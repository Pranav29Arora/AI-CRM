import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot password flow state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const { login, loginWithGoogle, sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;
    setError('');

    try {
      setGoogleLoading(true);
      await loginWithGoogle(rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
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
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col lg:grid lg:grid-cols-12 selection:bg-brand-500 selection:text-white">
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
      <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 relative bg-[#080c14]">
        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Mobile-only Header */}
        <div className="lg:hidden w-full max-w-md mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              AI<span className="text-brand-400">-CRM</span>
            </span>
          </Link>
          <p className="text-xs text-slate-400">
            Smarter customer enquiries & AI price negotiations
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-md glass-panel border border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10 relative backdrop-blur-xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-[11px] font-semibold bg-brand-500/10 text-brand-300 rounded-lg border border-brand-500/25">
                AI-CRM Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {showForgotPassword ? 'Reset password' : 'Log in to your account'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {showForgotPassword
                ? 'Enter your account email to receive a password reset link.'
                : 'Continue managing your customers and deals.'}
            </p>
          </div>

          {/* ================= FORGOT PASSWORD VIEW ================= */}
          {showForgotPassword ? (
            <div className="space-y-5">
              {resetSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{resetSuccess}</span>
                </div>
              )}

              {resetError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{resetError}</span>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
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
                      className="glass-input block w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
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
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to log in
                </button>
              </div>
            </div>
          ) : (
            /* ================= STANDARD LOGIN VIEW ================= */
            <>
              {/* Error Message Alert */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Google Sign-in Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 hover:text-white border border-slate-700/80 hover:border-slate-600 shadow-md transition-all disabled:opacity-50 hover:scale-[1.01]"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                    <span>Signing in with Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              {/* Or Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                  <span className="px-3 bg-[#0c121e] text-slate-500 rounded-full border border-slate-800">
                    Or continue with email
                  </span>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Email address */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                      className="glass-input block w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* 2. Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                      className="glass-input block w-full pl-10 pr-10 py-2.5 text-xs rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white focus:outline-none"
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
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500 cursor-pointer"
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
                    className="font-medium text-brand-400 hover:text-brand-300 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Primary Log In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 hover:scale-[1.01]"
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
              <div className="mt-6 pt-5 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-bold text-brand-400 hover:text-brand-300 hover:underline transition-colors ml-1"
                  >
                    Sign up free
                  </Link>
                </p>
              </div>

              {/* Firebase Authentication Trust Notice */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                <span>Protected by Firebase Authentication</span>
              </div>
            </>
          )}
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            ← Back to AI-CRM Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
};
