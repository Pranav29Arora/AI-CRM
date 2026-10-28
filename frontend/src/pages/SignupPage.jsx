import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Check
} from 'lucide-react';

export const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field touched states for inline validation
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  // Inline validation calculations
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordLongEnough = password.length >= 6;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate submissions

    // Mark all touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true
    });

    setError('');

    // Validations
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !isEmailValid) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!isPasswordLongEnough) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }
    if (!agreeTerms) {
      setError('You must accept the terms and conditions to create an account.');
      return;
    }

    try {
      setLoading(true);
      await signup(name.trim(), email.trim(), password.trim());
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:grid lg:grid-cols-12 selection:bg-blue-100 selection:text-blue-900">
      {/* ================= LEFT SECTION (Branding, Headline, Margin Ladder Preview) ================= */}
      <div className="lg:col-span-5 xl:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-8 lg:p-12 xl:p-16 flex flex-col justify-between relative overflow-hidden hidden lg:flex border-r border-slate-800">
        {/* Decorative background glow */}
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

        {/* Middle: Headline, Supporting Text & Pricing Ladder Preview */}
        <div className="relative z-10 my-10 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Margin Protection Architecture
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Start Selling Smarter with AI-CRM
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Organise customer enquiries, manage product pricing, and use AI-assisted negotiations to work towards better deals.
            </p>
          </div>

          {/* Pricing Ladder & Margin Safeguard Preview Card */}
          <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-5 shadow-2xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Dynamic Pricing Guard</h4>
                  <p className="text-[11px] text-slate-400">Apple MacBook Air M3 (512GB)</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Safety Locked
              </span>
            </div>

            {/* Pricing Tiers */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[10px] text-slate-400">Base Cost</div>
                <div className="font-semibold text-slate-200 mt-0.5">₹1,02,000</div>
              </div>
              <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                <div className="text-[10px] text-emerald-400">Floor (Min)</div>
                <div className="font-semibold text-emerald-300 mt-0.5">₹1,14,000</div>
              </div>
              <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-500/30">
                <div className="text-[10px] text-blue-400">Target</div>
                <div className="font-semibold text-blue-300 mt-0.5">₹1,24,900</div>
              </div>
            </div>

            {/* AI Margin Rule */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                Sales team cannot quote below <strong className="text-white">₹1,14,000</strong> without manager approval. Preserves a mandatory <strong className="text-emerald-400">11.7% profit margin</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: Trust & Feature Pillars */}
        <div className="relative z-10 pt-6 border-t border-slate-800 grid grid-cols-3 gap-4 text-left">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Zero Margin Leaks
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Automated floor rules</p>
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              Lead Pipelines
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">WhatsApp follow-ups</p>
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Secure Auth
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Firebase identity</p>
          </div>
        </div>
      </div>

      {/* ================= RIGHT SECTION (Centered Registration Card) ================= */}
      <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 relative">
        {/* Mobile Header */}
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

        {/* Registration Card */}
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/50 p-7 sm:p-9 relative">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                New Sales Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Create your AI-CRM account
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Get started with smarter customer management.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Full Name */}
            <div>
              <label
                htmlFor="fullname"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Full name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="fullname"
                  name="fullname"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  onBlur={() => handleBlur('name')}
                  placeholder="Vikram Sharma"
                  required
                  className={`block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm ${
                    touched.name && !name.trim()
                      ? 'border-rose-300 focus:border-rose-500'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
              </div>
              {touched.name && !name.trim() && (
                <p className="text-[11px] text-rose-600 mt-1">Full name is required.</p>
              )}
            </div>

            {/* 2. Email Address */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Email address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  onBlur={() => handleBlur('email')}
                  placeholder="vikram@retailmart.in"
                  required
                  className={`block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm ${
                    touched.email && (!email.trim() || !isEmailValid)
                      ? 'border-rose-300 focus:border-rose-500'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
              </div>
              {touched.email && email.trim() && !isEmailValid && (
                <p className="text-[11px] text-rose-600 mt-1">
                  Please enter a valid email address format.
                </p>
              )}
            </div>

            {/* 3. Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password <span className="text-rose-500">*</span>
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  onBlur={() => handleBlur('password')}
                  placeholder="Minimum 6 characters"
                  required
                  className={`block w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm ${
                    touched.password && !isPasswordLongEnough
                      ? 'border-rose-300 focus:border-rose-500'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
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

              {/* Password Requirement Checklist */}
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    isPasswordLongEnough
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span
                  className={
                    isPasswordLongEnough ? 'text-emerald-700 font-medium' : 'text-slate-500'
                  }
                >
                  Minimum 6 characters (Firebase requirement)
                </span>
              </div>
            </div>

            {/* 4. Confirm Password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Confirm password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Re-enter your password"
                  required
                  className={`block w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm ${
                    touched.confirmPassword && !doPasswordsMatch
                      ? 'border-rose-300 focus:border-rose-500'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {touched.confirmPassword && confirmPassword && !doPasswordsMatch && (
                <p className="text-[11px] text-rose-600 mt-1">
                  Passwords do not match.
                </p>
              )}
            </div>

            {/* 5. Terms and Conditions Acceptance Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    setError('');
                  }}
                  onBlur={() => handleBlur('terms')}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                />
                <span className="text-xs text-slate-600 leading-snug">
                  I agree to the{' '}
                  <span className="font-semibold text-slate-800">Terms of Service</span> and{' '}
                  <span className="font-semibold text-slate-800">Privacy Policy</span>.
                </span>
              </label>
              {touched.terms && !agreeTerms && (
                <p className="text-[11px] text-rose-600 mt-1 pl-6">
                  You must agree to the terms and conditions to proceed.
                </p>
              )}
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Registering user in Firebase...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Navigation link to Login */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>

          {/* Firebase Authentication Notice */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Real user registration via Firebase Authentication</span>
          </div>
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
