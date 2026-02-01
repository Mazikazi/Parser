"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { 
  Sparkles, 
  Layout, 
  FileText, 
  Zap, 
  CheckCircle2, 
  Lock, 
  ChevronRight,
  Menu,
  X,
  Download,
  Globe,
  Upload,
  Loader2,
  ArrowRight,
  Star,
  ShieldCheck,
  Rocket,
  Moon,
  Sun,
  AlertCircle,
  Target,
  TrendingUp,
  Search,
  Lightbulb
} from "lucide-react";
import { useTheme } from "next-themes";
import AuthModal from "@/components/auth/AuthModal";
import { toast } from "sonner";
import PortfolioPreview from "@/components/portfolio/PortfolioPreview";
import PricingModal from "@/components/pricing/PricingModal";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"phraser" | "portfolio">("phraser");
  const [credits, setCredits] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Phraser State
  const [role, setRole] = useState("");
  const [tone, setTone] = useState("Professional");
  const [content, setContent] = useState("");
  const [rewrittenContent, setRewrittenContent] = useState("");
  const [keywords, setKeywords] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Portfolio State
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [portfolioHtml, setPortfolioHtml] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState("Modern Minimal");

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchCredits(currentUser.uid);
        // Set up real-time listener for credits
        const userRef = doc(db, "profiles", currentUser.uid);
        const unsubProfile = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setCredits(doc.data().credits);
          }
        });
        return () => unsubProfile();
      } else {
        setCredits(0);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchCredits = async (userId: string) => {
    const userRef = doc(db, "profiles", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      setCredits(userDoc.data().credits);
    }
  };

  const getAuthHeaders = async () => {
    if (!user) return {};
    const token = await user.getIdToken();
    return {
      "Authorization": `Bearer ${token}`
    };
  };

  const handlePhrase = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/ai/phrase", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role, tone, content }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRewrittenContent(data.content);
      toast.success("Resume rewritten successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePortfolio = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    let dataToUse = portfolioData;
    const headers = await getAuthHeaders();

    // If we don't have parsed data yet, we need to analyze first
    if (!dataToUse) {
      setLoading(true);
      try {
        const res = await fetch("/api/ai/analyze-resume", {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ resumeText: content, keywords: [] }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        dataToUse = data.parsed_resume;
        setPortfolioData(dataToUse);
        setAnalysisResult(data);
      } catch (err: any) {
        toast.error("Failed to parse resume: " + err.message);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const themeMap: Record<string, string> = {
        "Modern Minimal": "light",
        "Creative Dark": "dark",
        "Professional Executive": "neutral"
      };

      const res = await fetch("/api/ai/portfolio", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          resumeData: dataToUse, 
          theme: themeMap[selectedTemplate] 
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPortfolioHtml(data.html);
      toast.success("Portfolio generated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPortfolio = () => {
    if (!portfolioHtml) return;
    const blob = new Blob([portfolioHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Portfolio downloaded!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/parse-resume", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setContent(data.text);
      toast.success("Resume parsed successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const keywordList = keywords.split(",").map(k => k.trim()).filter(k => k);
      const res = await fetch("/api/ai/analyze-resume", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ resumeText: content, keywords: keywordList }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysisResult(data);
      // If we have parsed data, we can pre-fill the portfolio content later
      if (data.parsed_resume) {
        setPortfolioData(data.parsed_resume);
      }
      toast.success("Resume analyzed successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const ThemeToggle = () => {
    if (!mounted) return <div className="w-10 h-10" />; // Placeholder to prevent layout shift
    return (
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="relative flex items-center gap-2 p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all w-16 h-8"
        aria-label="Toggle Theme"
      >
        <div className={`absolute w-6 h-6 rounded-full bg-white dark:bg-indigo-600 shadow-sm transition-all duration-300 flex items-center justify-center ${theme === 'dark' ? 'translate-x-8' : 'translate-x-0'}`}>
          {theme === "dark" ? <Moon className="w-3.5 h-3.5 text-white" /> : <Sun className="w-3.5 h-3.5 text-yellow-500" />}
        </div>
        <div className="flex justify-between w-full px-1.5">
          <Sun className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-slate-500' : 'opacity-0'}`} />
          <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'opacity-0' : 'text-slate-400'}`} />
        </div>
      </button>
    );
  };

  // Landing Page Component
  const LandingPage = () => (
    <div className="bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full text-sm font-bold mb-8 animate-bounce">
              <Rocket className="w-4 h-4" />
              New: AI Portfolio Builder is live!
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-8">
              Land Your Dream Job with <span className="text-indigo-600 dark:text-indigo-400">AI Precision.</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
              The all-in-one career toolkit. Rewrite your resume for ATS success and build a stunning portfolio website in seconds. No coding required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-indigo-900/20 flex items-center justify-center gap-2"
              >
                Get Started for Free <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800"></div>)}
                </div>
                <span className="text-sm">Joined by 10k+ professionals</span>
              </div>
            </div>
          </div>
        </div>
        {/* Background Decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 opacity-10 dark:opacity-20 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Everything you need to stand out</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />,
                title: "AI Resume Phraser",
                desc: "Instantly rewrite bullet points with high-impact action verbs and ATS-optimized keywords."
              },
              {
                icon: <Layout className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
                title: "Portfolio Builder",
                desc: "Convert your resume into a professional personal website with one click. Multiple templates available."
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />,
                title: "ATS Optimization",
                desc: "Our AI is trained on thousands of successful resumes to ensure you pass the initial screening."
              }
            ].map((f, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all group">
                <div className="bg-slate-50 dark:bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
          </div>
          <p className="text-2xl font-medium text-slate-800 dark:text-slate-200 italic mb-8">
            "This tool helped me land interviews at Google and Meta. The AI phrasing is incredible."
          </p>
          <div className="font-bold text-slate-900 dark:text-white">Sarah Jenkins</div>
          <div className="text-slate-500 dark:text-slate-400 text-sm">Senior Product Designer</div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <PricingModal 
        isOpen={isPricingModalOpen} 
        onClose={() => setIsPricingModalOpen(false)} 
        userEmail={user?.email}
        onPaymentSuccess={() => user && fetchCredits(user.uid)}
      />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ResumeFlow AI</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {user && (
                <>
                  <button onClick={() => setActiveTab("phraser")} className={`text-sm font-medium transition-colors ${activeTab === "phraser" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"}`}>Resume Phraser</button>
                  <button onClick={() => setActiveTab("portfolio")} className={`text-sm font-medium transition-colors ${activeTab === "portfolio" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"}`}>Portfolio Builder</button>
                  <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors" onClick={() => setIsPricingModalOpen(true)}>
                    <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
                    <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{credits} Credits</span>
                  </div>
                  <button onClick={handleSignOut} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">Sign Out</button>
                </>
              )}
              {!user && (
                <button onClick={() => setIsAuthModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all">
                  Sign In
                </button>
              )}
              <div className="pl-4 border-l border-slate-200 dark:border-slate-800">
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <ThemeToggle />
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-600 dark:text-slate-400"
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-4">
            {user ? (
              <>
                <button onClick={() => {setActiveTab("phraser"); setIsMenuOpen(false)}} className="block w-full text-left px-4 py-2 text-slate-600 dark:text-slate-400">Resume Phraser</button>
                <button onClick={() => {setActiveTab("portfolio"); setIsMenuOpen(false)}} className="block w-full text-left px-4 py-2 text-slate-600 dark:text-slate-400">Portfolio Builder</button>
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl">
                  <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-indigo-600" />
                  <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{credits} Credits</span>
                </div>
                <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-red-500">Sign Out</button>
              </>
            ) : (
              <button onClick={() => {setIsAuthModalOpen(true); setIsMenuOpen(false)}} className="block w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-center">Sign In</button>
            )}
          </div>
        )}
      </nav>

      {!user ? <LandingPage /> : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "phraser" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Resume Intelligence</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">Analyze your resume, match keywords, and get ATS optimization tips.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Resume Content</label>
                    <label className="cursor-pointer flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? "Parsing..." : "Upload PDF/DOCX"}
                      <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Keywords (Optional)</label>
                    <input 
                      type="text" 
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="e.g. React, TypeScript, Project Management" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Separate keywords with commas</p>
                  </div>

                  <div>
                    <textarea 
                      rows={8}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Paste your resume content here or upload a file..."
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={handlePhrase}
                      disabled={loading || !content || isUploading}
                      className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Quick Rewrite</>}
                    </button>
                    <button 
                      onClick={handleAnalyzeResume}
                      disabled={loading || !content || isUploading}
                      className="bg-indigo-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-4 h-4" /> Analyze (1 Credit)</>}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {analysisResult ? (
                  <div className="space-y-6">
                    {/* Score Overview Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="58"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="transparent"
                              className="text-slate-100 dark:text-slate-800"
                            />
                            <circle
                              cx="64"
                              cy="64"
                              r="58"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={364.4}
                              strokeDashoffset={364.4 - (364.4 * analysisResult.analysis.ats_score) / 100}
                              className="text-indigo-600 dark:text-indigo-400 transition-all duration-1000 ease-out"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{analysisResult.analysis.ats_score}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ATS Score</span>
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${analysisResult.analysis.ats_score >= 80 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                              {analysisResult.analysis.ats_score >= 80 ? <TrendingUp className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-white">
                                {analysisResult.analysis.ats_score >= 80 ? "Excellent Compatibility" : "Needs Optimization"}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {analysisResult.analysis.ats_score >= 80 
                                  ? "Your resume is highly optimized for ATS systems." 
                                  : "Follow the suggestions below to improve your score."}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-1">
                                <Target className="w-3 h-3" /> Match Rate
                              </div>
                              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{analysisResult.analysis.keyword_match_percentage}%</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-1">
                                <Search className="w-3 h-3" /> Keywords
                              </div>
                              <div className="text-xl font-black text-green-600 dark:text-green-400">{analysisResult.analysis.matched_keywords.length} Found</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Keyword Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" /> Matched Keywords
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.analysis.matched_keywords.map((k: string) => (
                            <span key={k} className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded-full border border-green-100 dark:border-green-800/50">
                              {k}
                            </span>
                          ))}
                          {analysisResult.analysis.matched_keywords.length === 0 && <p className="text-sm text-slate-400 italic">No keywords matched yet.</p>}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500" /> Missing Keywords
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.analysis.missing_keywords.map((k: string) => (
                            <span key={k} className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full border border-amber-100 dark:border-amber-800/50">
                              {k}
                            </span>
                          ))}
                          {analysisResult.analysis.missing_keywords.length === 0 && <p className="text-sm text-slate-400 italic">Great! No critical keywords missing.</p>}
                        </div>
                      </div>
                    </div>

                    {/* Actionable Recommendations */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-indigo-500" /> Actionable Recommendations
                      </h3>
                      <div className="space-y-4">
                        {analysisResult.analysis.improvement_suggestions.map((s: any, i: number) => (
                          <div key={i} className="group p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                            <div className="flex items-start gap-4">
                              <div className="mt-1 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                                {i + 1}
                              </div>
                              <div className="space-y-3 flex-1">
                                <div>
                                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{s.section}</span>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{s.suggestion}</p>
                                </div>
                                {s.rewritten_bullet && (
                                  <div className="relative p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 group-hover:border-indigo-100 dark:group-hover:border-indigo-900 transition-colors">
                                    <div className="absolute -top-2 left-3 px-2 bg-white dark:bg-slate-950 text-[9px] font-bold text-slate-400 uppercase">Suggested Rewrite (STAR Method)</div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                      "{s.rewritten_bullet}"
                                    </p>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(s.rewritten_bullet);
                                        toast.success("Copied to clipboard!");
                                      }}
                                      className="mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                    >
                                      Copy to clipboard
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 dark:bg-slate-900/50 rounded-2xl p-8 text-slate-300 relative overflow-hidden min-h-[500px] border border-slate-800 flex flex-col items-center justify-center text-center">
                    <div className="bg-white/10 p-4 rounded-full mb-4">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white text-xl font-bold mb-2">No Analysis Yet</h3>
                    <p className="text-slate-400 text-sm max-w-xs">
                      Upload your resume and click "Analyze" to see your ATS score and improvement suggestions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Portfolio Builder</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">Generate a stunning personal website from your resume in seconds.</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                    <Upload className="w-4 h-4" />
                    {isUploading ? "Parsing..." : "Upload Resume"}
                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                  <button 
                    onClick={handleGeneratePortfolio}
                    disabled={loading || !content || isUploading}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Layout className="w-5 h-5" /> Generate Portfolio (1 Credit)</>}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">Select Template</h3>
                  <div className="space-y-3">
                    {["Modern Minimal", "Creative Dark", "Professional Executive"].map((t) => (
                      <div 
                        key={t} 
                        onClick={() => setSelectedTemplate(t)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTemplate === t ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"}`}
                      >
                        <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg mb-3 overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-800 dark:to-slate-700"></div>
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <PortfolioPreview 
                    data={portfolioData} 
                    html={portfolioHtml}
                    template={selectedTemplate} 
                    userEmail={user?.email} 
                    onDownload={handleDownloadPortfolio}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">ResumeFlow AI</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500 dark:text-slate-400">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white">Contact Support</a>
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500">© 2024 ResumeFlow AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
