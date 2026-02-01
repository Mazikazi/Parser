"use client";

import React from "react";
import { Globe, Download, Lock } from "lucide-react";

interface PortfolioData {
  headline: string;
  subheadline: string;
  about_me: string;
  skills: string[];
  projects?: { title: string; description: string }[];
  experience?: { company: string; role: string; duration: string; description: string }[];
}

interface PortfolioPreviewProps {
  data: PortfolioData | null;
  html?: string;
  template: string;
  userEmail?: string;
  onDownload?: () => void;
}

export default function PortfolioPreview({ data, html, template, userEmail, onDownload }: PortfolioPreviewProps) {
  const username = userEmail?.split("@")[0] || "johndoe";

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="ml-4 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Globe className="w-3 h-3" />
            preview.resumeflow.ai/{username}
          </div>
        </div>
        <div className="flex gap-2">
          {html && (
            <button 
              onClick={onDownload}
              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
              title="Download HTML"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="relative aspect-[16/10] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden group">
        {html ? (
          <iframe 
            srcDoc={html} 
            className="w-full h-full border-none"
            title="Portfolio Preview"
          />
        ) : (
          <>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] rotate-[-30deg] select-none z-0">
              <span className="text-9xl font-black dark:text-white">RESUMEFLOW</span>
            </div>

            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-20">
              <div className="bg-indigo-600 p-4 rounded-2xl mb-6 shadow-xl">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Ready to go live?</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
                Generate your portfolio to see a live preview and download the source code.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => document.getElementById('generate-btn')?.click()}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                >
                  Generate Now
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
