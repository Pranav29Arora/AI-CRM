import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password flow state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  // Demo credentials state
  const [demoCreds, setDemoCreds] = useState(null);

  const { login, sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    const fetchDemoCreds = async () => {
      try {
        const res = await authService.getDemoCredentials();
        if (res.credentials) {
          setDemoCreds(res.credentials);
        }
      } catch (err) {
        setDemoCreds({
          email: 'demo@aicrm.com',
          password: 'demo123',
          role: 'Wholesale & Retail Director'
        });
      }
    };
    fetchDemoCreds();
  }, []);

  const handleFillDemo = () => {
    if (demoCreds) {
      setEmail(demoCreds.email);
      setPassword(demoCreds.password);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate submissions

    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      await login(cleanEmail, password, rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (resetLoading) return;

    setResetError('');
    setResetSuccess('');

    const cleanEmail = resetEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setResetError('Please enter a valid email address.');
      return;
    }

    try {
      setResetLoading(true);
      const res = await sendPasswordReset(cleanEmail);
      setResetSuccess(
        res.message || 'Password reset link sent! Please check your email inbox and spam folder.'
      );
    } catch (err) {
      setResetError(err.message || 'Unable to send password reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:grid lg:grid-cols-12 selection:bg-blue-100 selection:text-blue-900">
      {/* ================= LEFT SECTION (Branding, Headline, Live AI Preview) ================= */}
      <div className="lg:col-span-5 xl:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-8 lg:p-12 xl:p-16 flex flex-col justify-between relative overflow-hidden hidden lg:flex border-r border-slate-800">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: AI-CRM Branding */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                AI<span className="text-blue-400">-CRM</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                Smart Retail CRM
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Headline, Supporting Text & Live AI Negotiation Preview */}
        <div className="relative z-10 my-10 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Smarter Retail Negotiations
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Welcome Back to AI-CRM
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Manage your customers, track enquiries, and close deals smarter.
            </p>
          </div>

          {/* Realistic Live Enquiry & AI Negotiation Card */}
          <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-5 shadow-2xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Live Customer Enquiry</h4>
                  <p className="text-[11px] text-slate-400">Aarav Electronics (Wholesale)</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                AI Counter Ready
              </span>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Product:</span>
                <span className="font-medium text-white">Sony WH-1000XM5 (10 units)</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Customer Offer:</span>
                <span className="font-semibold text-rose-400">₹22,000 / unit</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Floor Price (Safe Margin):</span>
                <span className="font-semibold text-emerald-400">₹21,500 (18% margin)</span>
              </div>
            </div>

            {/* AI Negotiation Strategy */}
            <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/30 text-xs">
              <div className="flex items-center gap-1.5 text-blue-300 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                AI Negotiation Advice
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                "Counter at <strong className="text-white">₹22,400</strong> with free express shipping. Preserves <span className="text-emerald-400 font-semibold">22.8% margin</span> and has an estimated <span className="text-blue-300 font-semibold">91% close probability</span>."
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: Trust & Feature Pillars */}
        <div className="relative z-10 pt-6 border-t border-slate-800 grid grid-cols-3 gap-4 text-left">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              100% Margin
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Floor price protection</p>
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              WhatsApp
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Automated follow-ups</p>
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Firebase
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Real cloud auth</p>
          </div>
        </div>
      </div>

      {/* ================= RIGHT SECTION (Centered Auth Card) ================= */}
      <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 relative">
        {/* Mobile-only Header */}
        <div className="lg:hidden w-full max-w-md mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              AI<span className="text-blue-600">-CRM</span>
            </span>
          </Link>
          <p className="text-xs text-slate-500">
            Smarter customer enquiries & AI price negotiations
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/50 p-7 sm:p-9 relative">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                AI-CRM Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {showForgotPassword ? 'Reset password' : 'Log in to your account'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {showForgotPassword
                ? 'Enter your account email to receive a password reset link.'
                : 'Continue managing your customers and deals.'}
            </p>
          </div>

          {/* ================= FORGOT PASSWORD VIEW ================= */}
          {showForgotPassword ? (
            <div className="space-y-5">
              {resetSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{resetSuccess}</span>
                </div>
              )}

              {resetError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{resetError}</span>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        setResetError('');
                      }}
                      placeholder="you@company.com"
                      required
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <span>Send Password Reset Link</span>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetError('');
                    setResetSuccess('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to log in
                </button>
              </div>
            </div>
          ) : (
            /* ================= STANDARD LOGIN VIEW ================= */
            <>
              {/* Demo Evaluation Account Helper */}
              <div className="mb-6 p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    <span>Evaluation Demo Account</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-700 border border-blue-300">
                    Firebase Verified
                  </span>
                </div>

                <div className="bg-white/90 rounded-lg p-2.5 border border-blue-100 font-mono text-[11px] text-slate-700 flex justify-between items-center">
                  <div>
                    <div><span className="text-slate-400">Email:</span> demo@aicrm.com</div>
                    <div><span className="text-slate-400">Pass:</span> demo123</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="py-1 px-2.5 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Auto-Fill
                  </button>
                </div>
              </div>

              {/* Error Message Alert */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Email address */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="you@company.com"
                      required
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* 2. Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="••••••••"
                      required
                      className="block w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me & Forgot Password Controls */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setResetEmail(email);
                      setError('');
                    }}
                    className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Primary Log In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Log In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Navigation link to Sign Up */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>

              {/* Firebase Authentication Trust Notice */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Protected by Firebase Authentication</span>
              </div>
            </>
          )}
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            ← Back to AI-CRM Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
};
