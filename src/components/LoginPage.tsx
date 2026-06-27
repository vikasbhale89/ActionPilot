import React, { useState } from "react";
import { UserSession } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Simple input validation helper
  const validateForm = () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill out all fields.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    if (activeTab === "signup" && !displayName.trim()) {
      setError("Please enter a display name.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!validateForm()) return;

    setIsLoading(true);
    // Simulate API authorization network lag
    setTimeout(() => {
      setIsLoading(false);
      const nameToUse = activeTab === "signup" ? displayName.trim() : "Vikas";
      
      const newSession: UserSession = {
        email: email.trim().toLowerCase(),
        displayName: nameToUse,
        createdAt: new Date().toISOString(),
      };

      setSuccessMsg(activeTab === "signup" ? "Account created successfully!" : "Logged in successfully!");
      
      // Delay success redirect for nice feedback animation
      setTimeout(() => {
        onLoginSuccess(newSession);
      }, 800);
    }, 1200);
  };

  // Quick Demo Login bypass button
  const handleDemoLogin = () => {
    setError(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const demoSession: UserSession = {
        email: "vikas.bhale@example.com",
        displayName: "Vikas Bhale",
        avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=vikas",
        createdAt: new Date().toISOString(),
      };
      setSuccessMsg("Authorized in Demo Mode! ⚡");
      setTimeout(() => {
        onLoginSuccess(demoSession);
      }, 800);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#040508] relative overflow-hidden flex items-center justify-center px-4 py-16 select-none font-sans">
      
      {/* GLOWING ORBITS BACKGROUND BACKGROUNDS */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-violet-600/5 rounded-full blur-[90px] -translate-x-1/2 -translate-y-1/2 animate-pulse" />

      {/* Floating particles */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-indigo-400/40 rounded-full animate-bounce duration-[4s]" />
      <div className="absolute bottom-24 right-12 w-3 h-3 bg-blue-400/30 rounded-full animate-bounce duration-[6s]" />
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-violet-400/50 rounded-full animate-ping duration-[3s]" />

      <div className="w-full max-w-[460px] relative z-10">
        
        {/* LOGO AND BRAND HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/20 mb-3 border border-white/10">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase font-display flex justify-center items-center gap-1.5">
            ActionPilot <span className="text-[10px] font-mono font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-400/20 uppercase tracking-widest">Secure</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1.5">
            Step into your ambient focus workspace. Fight procrastination.
          </p>
        </div>

        {/* MAIN CARD CONTAINER */}
        <div className="bg-white/[0.02] border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8" style={{ boxShadow: "0 30px 60px -15px rgba(0,0,0,0.7)" }}>
          
          {/* TAB HEADERS */}
          <div className="flex p-1 bg-white/[0.03] rounded-2xl border border-white/5 mb-6 relative">
            <button
              onClick={() => {
                setActiveTab("signin");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                activeTab === "signin" 
                  ? "bg-white text-black font-extrabold shadow-lg" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab("signup");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                activeTab === "signup" 
                  ? "bg-white text-black font-extrabold shadow-lg" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form 
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === "signin" ? -15 : 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === "signin" ? 15 : -15 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* DISPLAY NAME (SIGN UP ONLY) */}
              {activeTab === "signup" && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Vikas Bhale"
                      disabled={isLoading}
                      className="w-full bg-white/5 text-white placeholder-white/20 text-xs pl-11 pr-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* EMAIL */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vikas@example.com"
                    disabled={isLoading}
                    className="w-full bg-white/5 text-white placeholder-white/20 text-xs pl-11 pr-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full bg-white/5 text-white placeholder-white/20 text-xs pl-11 pr-12 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* ERROR BLOCK */}
              {error && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-300 leading-normal font-medium">{error}</p>
                </div>
              )}

              {/* SUCCESS BLOCK */}
              {successMsg && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-300 leading-normal font-semibold font-mono">{successMsg}</p>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-black bg-white hover:bg-indigo-600 hover:text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-white/5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>{activeTab === "signin" ? "Enter Dashboard" : "Create Account"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* DIVIDER */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-3 bg-[#0d0e14] text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Or Bypass Auth</span>
          </div>

          {/* DEMO MODE AUTO SIGN IN */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full py-3 bg-indigo-950/20 border border-indigo-500/25 hover:border-indigo-400/40 text-indigo-400 hover:text-indigo-300 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            Quick Demo Auto-Login
          </button>

        </div>
      </div>
    </div>
  );
}
