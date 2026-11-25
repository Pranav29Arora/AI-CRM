import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Package,
  Users,
  Bot,
  Clock,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Menu,
  X,
  TrendingUp,
  Layers,
  DollarSign,
  AlertCircle,
  Calendar,
  Check,
  Zap,
  Sliders,
  AlertTriangle,
  ArrowUpRight,
  CheckCheck,
  LogOut,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';

export const LandingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Logout notice:', e);
    }
    setProfileDropdownOpen(false);
    navigate('/login');
  };

  // Interactive Live Demo Playground State for Hero
  const [demoOffer, setDemoOffer] = useState(54000);
  const demoCost = 42000;
  const demoFloor = 48000;
  const demoPref = 53500;
  const demoTarget = 58000;

  // Compute live guardrail status for interactive hero
  const getDemoVerdict = (offer) => {
    if (offer < demoFloor) {
      return {
        verdict: 'REJECT',
        color: 'rose',
        statusText: 'Floor Breach — Hard Rejected',
        reply: "Due to factory cost constraints, ₹" + Number(offer).toLocaleString() + " is below our absolute floor limit. Our lowest approved bulk rate is ₹" + demoFloor.toLocaleString() + " with immediate wire."
      };
    } else if (offer < demoPref) {
      return {
        verdict: 'COUNTER',
        color: 'amber',
        statusText: 'Counter Range — Strategic Counter',
        reply: "Thank you for the bulk enquiry! While ₹" + Number(offer).toLocaleString() + " is tight, we can meet you halfway at ₹" + demoPref.toLocaleString() + " with full GST tax invoice and express hub dispatch today."
      };
    } else {
      return {
        verdict: 'ACCEPT',
        color: 'emerald',
        statusText: 'Optimal Rate — Deal Approved',
        reply: "Offer of ₹" + Number(offer).toLocaleString() + " is confirmed and locked! Generating tax invoice and allocating stock for dispatch."
      };
    }
  };

  const demoResult = getDemoVerdict(demoOffer);

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      const navOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient background glowing orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-brand-600/15 via-indigo-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[35%] -left-32 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full" />
        <div className="absolute top-[60%] -right-32 w-[550px] h-[550px] bg-emerald-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Top Navigation Bar (Sticky Glassmorphic) */}
      <header className="sticky top-0 z-50 bg-[#080c14]/85 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Brand Logo & Name */}
          <button
            onClick={() => scrollToSection('top')}
            className="flex items-center gap-3.5 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span className="font-black text-xl tracking-tight text-white group-hover:text-brand-400 transition-colors">
                AI<span className="text-brand-400">-CRM</span>
              </span>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Wholesale & Retail Desk
              </span>
            </div>
          </button>

          {/* Middle Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <button
              onClick={() => scrollToSection('top')}
              className="hover:text-brand-400 transition-colors"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('simulator')}
              className="hover:text-brand-400 transition-colors flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Live Guard Simulator
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-brand-400 transition-colors"
            >
              Platform Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-brand-400 transition-colors"
            >
              Workflow
            </button>
          </nav>

          {/* Right Side: Log In, Sign Up, and Dashboard/Profile buttons */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors rounded-xl hover:bg-slate-900/60"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60"
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:scale-[1.02] flex items-center gap-1.5"
                >
                  <span>Start Free Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:scale-[1.02] flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Go to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {/* Profile Pill & Dropdown with Log Out */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-xs transition-colors"
                    title="Profile & Session Menu"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="font-semibold text-slate-200 hidden lg:inline max-w-[100px] truncate">{user?.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in">
                      <div className="px-3 py-2 border-b border-slate-800 mb-1">
                        <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                        <p className="text-[10px] text-brand-400 font-medium mt-0.5">{user?.role} • {user?.company}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 font-medium"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-brand-400" /> Go to Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:text-white hover:bg-rose-600 rounded-xl transition-colors flex items-center gap-2 font-bold mt-1 shadow-sm"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950/95 border-b border-slate-800 px-5 pt-3 pb-6 space-y-3 backdrop-blur-xl">
            <button
              onClick={() => scrollToSection('top')}
              className="block w-full text-left py-2 px-3 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-xl"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('simulator')}
              className="block w-full text-left py-2 px-3 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-xl"
            >
              Live Simulator
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2 px-3 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-xl"
            >
              Platform Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2 px-3 text-sm font-semibold text-slate-200 hover:bg-slate-900 rounded-xl"
            >
              Workflow
            </button>
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="w-full text-center py-2.5 text-xs font-bold text-slate-200 border border-slate-800 rounded-xl hover:bg-slate-900"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="w-full text-center py-2.5 text-xs font-bold text-slate-200 border border-slate-800 rounded-xl hover:bg-slate-900"
                  >
                    Sign Up
                  </Link>
                  <Link
                    to="/login"
                    className="w-full text-center py-2.5 text-xs font-bold bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>Start Free Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 mt-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <Link
                      to="/dashboard"
                      className="py-2 text-center text-xs font-bold bg-brand-600 text-white rounded-xl shadow-md flex items-center justify-center gap-1"
                    >
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="py-2 text-center text-xs font-bold bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white rounded-xl border border-rose-500/30 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-brand-500/30 text-brand-300 text-xs font-semibold shadow-sm backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Next-Gen Wholesale CRM & Gemini Margin Guard</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                Close Wholesale Deals <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
                  Without Giving Up Margins
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Empower your sales team with real-time floor protection, instant Gemini AI counter-offers, and integrated WhatsApp deal desks. Never sell below cost again.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to={user ? "/dashboard" : "/signup"}
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-bold rounded-2xl shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 transition-all hover:scale-[1.02] group"
                >
                  <span>{user ? "Open Workspace Dashboard" : "Start Free Workspace"}</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  onClick={() => scrollToSection('simulator')}
                  className="inline-flex items-center justify-center px-6 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-sm font-bold rounded-2xl border border-slate-700/80 shadow-sm transition-all hover:border-brand-500/50"
                >
                  <Zap className="w-4 h-4 text-amber-400 mr-2" />
                  Try Live Pricing Guard
                </button>
              </div>

              {/* Key Trust Highlights */}
              <div className="pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-6 text-left">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Margin Safety</p>
                  <p className="text-base font-extrabold text-emerald-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    Zero Loss Guard
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Reasoning</p>
                  <p className="text-base font-extrabold text-indigo-300 mt-1 flex items-center gap-1">
                    <Bot className="w-4 h-4" />
                    Gemini 1.5 Live
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Data Store</p>
                  <p className="text-base font-extrabold text-brand-300 mt-1 flex items-center gap-1">
                    <CheckCheck className="w-4 h-4" />
                    Cloud Firestore
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: Interactive Live Margin Simulator Playground */}
            <div id="simulator" className="lg:col-span-5">
              <div className="glass-panel rounded-3xl border border-slate-700/70 shadow-2xl p-6 space-y-4 relative overflow-hidden backdrop-blur-xl">
                {/* Decorative radial card glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Live Pricing Guard Simulator</h4>
                      <p className="text-[10px] text-slate-400">Interactive deal desk demo</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Active Demo
                  </span>
                </div>

                {/* Simulated Product Card */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Samsung 65" Neo QLED 4K TV</p>
                      <p className="text-[10px] text-slate-400">SKU: SAM-65-QLED • 10 Units Consignment</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-brand-300">Target: ₹58,000</span>
                  </div>

                  {/* 4-Stage Pricing Ladder Pill Bar */}
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] pt-1">
                    <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400 block text-[9px]">Cost</span>
                      <span className="font-mono font-bold text-slate-300">₹42k</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30">
                      <span className="text-rose-400 block text-[9px] font-bold">Floor</span>
                      <span className="font-mono font-bold text-rose-300">₹48k</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30">
                      <span className="text-amber-400 block text-[9px] font-bold">Pref Min</span>
                      <span className="font-mono font-bold text-amber-300">₹53.5k</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                      <span className="text-emerald-400 block text-[9px] font-bold">Target</span>
                      <span className="font-mono font-bold text-emerald-300">₹58k</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Offer Slider / Preset Buttons */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-brand-400" />
                      Adjust Buyer Offer:
                    </label>
                    <span className="text-sm font-mono font-black text-white px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700">
                      ₹{demoOffer.toLocaleString()}
                    </span>
                  </div>

                  {/* Range Slider */}
                  <input
                    type="range"
                    min="40000"
                    max="60000"
                    step="500"
                    value={demoOffer}
                    onChange={(e) => setDemoOffer(Number(e.target.value))}
                    className="w-full accent-brand-500 cursor-pointer"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center justify-between gap-1.5 pt-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setDemoOffer(45000)}
                      className={`px-2 py-1 rounded-lg border font-mono transition-all ${
                        demoOffer < demoFloor ? 'bg-rose-500/25 border-rose-500 text-rose-300 font-bold' : 'bg-slate-800/80 border-slate-700 text-slate-400'
                      }`}
                    >
                      ₹45,000 (Floor Breach)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoOffer(51500)}
                      className={`px-2 py-1 rounded-lg border font-mono transition-all ${
                        demoOffer >= demoFloor && demoOffer < demoPref ? 'bg-amber-500/25 border-amber-500 text-amber-300 font-bold' : 'bg-slate-800/80 border-slate-700 text-slate-400'
                      }`}
                    >
                      ₹51,500 (Counter Zone)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoOffer(55000)}
                      className={`px-2 py-1 rounded-lg border font-mono transition-all ${
                        demoOffer >= demoPref ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-800/80 border-slate-700 text-slate-400'
                      }`}
                    >
                      ₹55,000 (Acceptable)
                    </button>
                  </div>
                </div>

                {/* Live Dynamic Verdict & AI Reply Preview */}
                <div className={`p-4 rounded-2xl border transition-all duration-200 space-y-2.5 ${
                  demoResult.verdict === 'ACCEPT'
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : demoResult.verdict === 'COUNTER'
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : 'bg-rose-950/30 border-rose-500/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Live AI Margin Verdict:
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      demoResult.verdict === 'ACCEPT'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : demoResult.verdict === 'COUNTER'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {demoResult.statusText}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                    <span className="text-[10px] font-bold text-brand-400 block mb-1">
                      🤖 Gemini AI Auto-Drafted WhatsApp Reply:
                    </span>
                    "{demoResult.reply}"
                  </div>
                </div>

                <div className="pt-1 text-center">
                  <Link
                    to="/signup"
                    className="text-xs font-bold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 group"
                  >
                    <span>Configure your own products & margins</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section id="features" className="py-24 bg-slate-950/60 border-y border-slate-800/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-400 px-3.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20">
              Enterprise Grade Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Everything Your Wholesale Desk Needs
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              Stop losing margins to informal discounts and unstructured negotiation threads.
            </p>
          </div>

          {/* 5 Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {/* Feature 1 */}
            <div className="glass-panel glass-panel-hover p-8 rounded-3xl border border-slate-800 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/30 text-brand-400 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                4-Tier Margin Guardrails
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Define cost prices, absolute minimum limits, preferred rates, and target wholesale prices per SKU. Floor limits are mathematically enforced.
              </p>
              <div className="pt-3 border-t border-slate-800 text-xs text-brand-300 flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-400" />
                Zero-loss mathematical boundary
              </div>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel glass-panel-hover p-8 rounded-3xl border border-slate-800 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Buyer Intelligence & CRM
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Organize wholesale accounts, purchasing budgets, contact details, deal stages, and buyer price-elasticity archetypes in one dashboard.
              </p>
              <div className="pt-3 border-t border-slate-800 text-xs text-indigo-300 flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-400" />
                Live account pipeline & history
              </div>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel glass-panel-hover p-8 rounded-3xl border border-slate-800 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Gemini AI Counter Generator
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Generate high-converting counter-offers tailored to the buyer's sentiment. Choose from relationship-focused, firm, or urgent negotiation styles.
              </p>
              <div className="pt-3 border-t border-slate-800 text-xs text-violet-300 flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-400" />
                Gemini 1.5 with tone controls
              </div>
            </div>

            {/* Feature 4 */}
            <div className="glass-panel glass-panel-hover p-8 rounded-3xl border border-slate-800 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                WhatsApp Deal Desk
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Seamless WhatsApp Web interface simulator with real-time lead linking, automated draft replies, and 1-click deal approvals with double blue ticks.
              </p>
              <div className="pt-3 border-t border-slate-800 text-xs text-emerald-300 flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-400" />
                Live simulation & WAKit ready
              </div>
            </div>

            {/* Feature 5 */}
            <div className="glass-panel glass-panel-hover p-8 rounded-3xl border border-slate-800 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Follow-Up & Reminders Scheduler
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Never lose a hot wholesale buyer. Set automated follow-up reminders with custom notes and priority tags to keep consignments moving.
              </p>
              <div className="pt-3 border-t border-slate-800 text-xs text-amber-300 flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-400" />
                Due-date tracking & quick action
              </div>
            </div>

            {/* Feature 6 */}
            <div className="glass-panel glass-panel-hover p-8 rounded-3xl border border-slate-800 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Executive Sales Analytics
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Monitor total revenue, profit margins, active deals, win rate, and category distribution in real-time with Recharts dynamic data visuals.
              </p>
              <div className="pt-3 border-t border-slate-800 text-xs text-teal-300 flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-400" />
                Real-time Firestore aggregation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-400 px-3.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20">
              Simple 3-Step Flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              From Inquiry to Closed Deal in Minutes
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              Structured, mathematically safe, and fast.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Input Catalog & Guardrails</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Add products along with base cost, absolute lower limit, and wholesale target price. Your floor rules are permanently locked in.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Receive Buyer Offers</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Connect via WhatsApp or manual inquiry. The AI instantly evaluates the offer against the product's margin ladder and buyer history.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-teal-600/30">
                3
              </div>
              <h3 className="text-lg font-bold text-white">Approve & Dispatch</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Sales reps review the AI-drafted reply or accept the deal with 1 click. Zero margin loss, full audit timeline, and closed won!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-3xl border border-brand-500/40 p-10 sm:p-16 text-center text-white shadow-2xl relative overflow-hidden bg-gradient-to-r from-brand-950/80 via-slate-900 to-indigo-950/80">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                Ready to Protect Your Profit Margins?
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Take control of wholesale negotiations today. Create your account and set up your dynamic pricing guard in under two minutes.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/signup"
                  className="w-full sm:w-auto px-9 py-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-bold rounded-2xl shadow-xl shadow-brand-500/30 transition-all hover:scale-105"
                >
                  Create Your Free Account
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-2xl border border-slate-700 transition-all hover:border-brand-500/50"
                >
                  Log In to Workspace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-800/80 py-12 text-slate-400 text-xs relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-between">
            {/* Brand column */}
            <div className="md:col-span-6 space-y-3 text-left">
              <button
                onClick={() => scrollToSection('top')}
                className="flex items-center gap-2.5 text-white font-extrabold text-lg focus:outline-none"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>AI-CRM</span>
              </button>
              <p className="text-slate-400 max-w-sm leading-relaxed">
                AI-powered sales intelligence & wholesale negotiation platform with mathematical floor protection, Cloud Firestore persistence, and Gemini deal reasoning.
              </p>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 text-left space-y-2">
              <p className="font-bold uppercase tracking-wider text-white">Platform</p>
              <ul className="space-y-1.5 text-slate-400">
                <li><button onClick={() => scrollToSection('top')} className="hover:text-brand-400 transition-colors">Overview</button></li>
                <li><button onClick={() => scrollToSection('simulator')} className="hover:text-brand-400 transition-colors">Live Simulator</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-brand-400 transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-brand-400 transition-colors">Workflow</button></li>
              </ul>
            </div>

            {/* Account Links */}
            <div className="md:col-span-3 text-left space-y-2">
              <p className="font-bold uppercase tracking-wider text-white">Access</p>
              <ul className="space-y-1.5 text-slate-400">
                <li><Link to="/login" className="hover:text-brand-400 transition-colors">Log In</Link></li>
                <li><Link to="/signup" className="hover:text-brand-400 transition-colors">Sign Up Free</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-slate-500 gap-3">
            <p>© {currentYear} AI-CRM Workspace. All rights reserved.</p>
            <p className="text-[11px] text-slate-400">
              Cloud Firestore Realtime • Gemini AI Heuristics
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
