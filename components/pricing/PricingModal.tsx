"use client";

import React, { useState } from "react";
import { X, Check, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingModal({ isOpen, onClose, userEmail, onPaymentSuccess }: { 
  isOpen: boolean; 
  onClose: () => void;
  userEmail?: string;
  onPaymentSuccess: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (plan: { id: string; amount: number; name: string }) => {
    setLoading(plan.id);
    try {
      const res = await loadRazorpay();
      if (!res) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        return;
      }

      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        body: JSON.stringify({ amount: plan.amount, planId: plan.id }),
      });
      const orderData = await orderRes.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "ResumeFlow AI",
        description: `Purchase ${plan.name}`,
        order_id: orderData.id,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            body: JSON.stringify({
              ...response,
              planId: plan.id,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            toast.success("Payment successful! Credits added.");
            onPaymentSuccess();
            onClose();
          } else {
            toast.error("Verification failed.");
          }
        },
        prefill: {
          email: userEmail,
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    { id: "starter", name: "Starter Pack", amount: 499, credits: 10, features: ["10 AI Rewrites", "Basic Templates", "Email Support"] },
    { id: "pro", name: "Pro Pack", amount: 1499, credits: 50, features: ["50 AI Rewrites", "All Templates", "Priority Support", "No Watermark"], popular: true },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative border border-slate-200 dark:border-slate-800">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors z-10">
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Choose Your Plan</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Get the credits you need to accelerate your career.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <div key={plan.id} className={`relative p-8 rounded-3xl border-2 transition-all ${plan.popular ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/10" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">₹{plan.amount}</span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400">one-time</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                    <Zap className="w-4 h-4 fill-current" />
                    {plan.credits} Credits
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <Check className="w-5 h-5 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => handlePayment(plan)}
                  disabled={!!loading}
                  className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${plan.popular ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"}`}
                >
                  {loading === plan.id ? <Loader2 className="w-5 h-5 animate-spin" /> : "Get Started"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
