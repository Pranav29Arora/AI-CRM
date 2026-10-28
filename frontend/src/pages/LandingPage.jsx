import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Check
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 4. Top Navigation Bar (Sticky) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Left: Brand Logo & Name */}
          <button
            onClick={() => scrollToSection('top')}
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                AI-CRM
              </span>
              <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Retail & Wholesale
              </span>
            </div>
          </button>

          {/* Middle Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button
              onClick={() => scrollToSection('top')}
              className="hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 py-0.5"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 py-0.5"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 py-0.5"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 py-0.5"
            >
              About
            </button>
          </nav>

          {/* Right Side: Log In and Sign Up buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm hover:shadow-md hover:shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
            <button
              onClick={() => scrollToSection('top')}
              className="block w-full text-left py-2 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left py-2 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg"
            >
              About
            </button>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="w-full text-center py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 5. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                AI-Powered Sales Workspace for Retail & Wholesale
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                Turn Customer Enquiries Into Successful Deals
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
                Manage customer relationships, automate follow-ups, and negotiate smarter with AI. AI-CRM helps retailers save time, protect profit margins, and convert more enquiries into sales.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>

                <button
                  onClick={() => scrollToSection('features')}
                  className="inline-flex items-center justify-center px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 text-base font-semibold rounded-xl border border-slate-300 shadow-sm hover:border-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Explore Features
                </button>
              </div>

              {/* Key Highlights */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4 text-left">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Margin Safety</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">Floor Protection</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Communication</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">WhatsApp Ready</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Architecture</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">Supabase Ready</p>
                </div>
              </div>
            </div>

            {/* Right Side: Illustrative Product Dashboard Preview */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/70 p-5 space-y-4 relative">
                {/* Mockup Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-semibold text-slate-600 ml-1.5">
                      Sample Retailer Workspace
                    </span>
                  </div>
                  {/* Deal Status Badge */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Negotiation in Progress
                  </span>
                </div>

                {/* 1. Customer Enquiry Card */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-left">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Rajesh Kumar (Apex Electronics Hub)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Inquiry: Samsung 55" QLED 4K TV • 5 Units</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold">
                      WhatsApp Lead
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Customer Offer:</span>
                    <span className="font-bold text-slate-900">₹52,000 / unit</span>
                  </div>
                </div>

                {/* 2. Product Price Card */}
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/70 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">Configured Pricing Ladder</span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Protected Margins
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                      <p className="text-slate-400 font-medium">Cost</p>
                      <p className="font-bold text-slate-700 mt-0.5">₹42,000</p>
                    </div>
                    <div className="p-1.5 bg-rose-50 rounded-lg border border-rose-200">
                      <p className="text-rose-600 font-medium">Floor Limit</p>
                      <p className="font-bold text-rose-700 mt-0.5">₹48,000</p>
                    </div>
                    <div className="p-1.5 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-blue-600 font-medium">Target Min</p>
                      <p className="font-bold text-blue-700 mt-0.5">₹53,500</p>
                    </div>
                    <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-emerald-600 font-medium">Selling Target</p>
                      <p className="font-bold text-emerald-700 mt-0.5">₹58,000</p>
                    </div>
                  </div>
                </div>

                {/* 3. AI Negotiation Conversation */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-left space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-violet-700">
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI Negotiation Response</span>
                  </div>
                  <div className="bg-slate-100 p-2.5 rounded-lg text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">Customer: </span>
                    "Bhai sahab, can you give 5 units at ₹52,000? Looking to finalize today."
                  </div>
                  <div className="bg-violet-50 border border-violet-200/80 p-2.5 rounded-lg text-xs text-slate-800">
                    <span className="font-semibold text-violet-900">AI Recommendation (Counter): </span>
                    "Namaste Rajesh ji! Due to factory pricing, ₹52,000 is tight. We can lock ₹53,500 with full GST invoice and express hub dispatch today."
                  </div>
                </div>

                {/* 4. Customer Follow-up Reminder */}
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-left flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-emerald-900">Follow-up Reminder</p>
                      <p className="text-[11px] text-emerald-700">Today at 2:30 PM • Rajesh Kumar (Stock Reservation)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
                    Due Soon
                  </span>
                </div>

                {/* Disclaimer Caption */}
                <p className="text-[11px] text-slate-400 text-center italic pt-1">
                  Illustrative demonstration data. Simulated workspace preview.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Features Section */}
      <section id="features" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Platform Features
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything You Need to Sell Smarter
            </h3>
            <p className="text-base sm:text-lg text-slate-600">
              Bring customer management, product pricing, and AI-assisted negotiations together in one workspace.
            </p>
          </div>

          {/* 5 Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Smart Product Management
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Maintain your product catalogue with cost prices, selling prices, and minimum acceptable prices.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-200/70 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-blue-600" />
                Configurable floor thresholds & live catalogue
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Customer Management
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Organise customer enquiries, contact details, product interests, and follow-up information.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-200/70 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-indigo-600" />
                Lead profiles, deal history & buyer preferences
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                AI-Powered Negotiation
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate intelligent negotiation replies that aim for your selling price while respecting your configured minimum price.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-200/70 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-violet-600" />
                Adaptive tones & zero-hallucination floor rules
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Automated Follow-ups
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Plan reminders for customers who enquire about products, helping retailers follow up at the right time.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-200/70 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-emerald-600" />
                Due date scheduler & priority notifications
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/5 transition-all md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-5">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-bold text-slate-900">
                  WhatsApp Communication
                </h4>
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                  Roadmap
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Prepare for WhatsApp-based customer conversations and reminders through a future messaging integration.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-200/70 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-teal-600" />
                Simulated retail chat interface for testing
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Simple Workflow
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              From Enquiry to Deal in Three Simple Steps
            </h3>
            <p className="text-base sm:text-lg text-slate-600">
              A structured, transparent path from customer inquiry to confirmed order.
            </p>
          </div>

          {/* Steps Grid with Visual Progression */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-left relative shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center mb-6 shadow-md shadow-blue-500/20">
                1
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">
                Add Your Products
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Enter product details, cost prices, selling prices, and your minimum acceptable prices.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-left relative shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center mb-6 shadow-md shadow-indigo-500/20">
                2
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">
                Manage Customer Enquiries
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Record customer interests, organise leads, and plan timely follow-ups.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-left relative shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white font-bold text-xl flex items-center justify-center mb-6 shadow-md shadow-violet-500/20">
                3
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">
                Negotiate Smarter
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Use AI-assisted negotiation to generate responses, recommend acceptable offers, and help move conversations towards a deal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Benefits Section */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Clear Value
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built for Better Retail Decisions
            </h3>
            <p className="text-base sm:text-lg text-slate-600">
              Streamline your daily sales operations with practical tools designed specifically for retailers and wholesalers.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Spend less time managing enquiries manually.
                </h4>
                <p className="text-sm text-slate-600 mt-1">
                  Centralize message records, pricing requests, and active dialogues into a unified workspace.
                </p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Keep customer information organised.
                </h4>
                <p className="text-sm text-slate-600 mt-1">
                  Maintain clean contact directories, customer preferences, and historical interaction records.
                </p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Respond to interested customers more consistently.
                </h4>
                <p className="text-sm text-slate-600 mt-1">
                  Deliver prompt, professional quotations and timely answers to common buyer queries.
                </p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Protect profit margins with explicit pricing rules.
                </h4>
                <p className="text-sm text-slate-600 mt-1">
                  Enforce strict mathematical lower floor boundaries so sales representatives never sell below cost.
                </p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-4 md:col-span-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Track negotiations and follow-ups from one workspace.
                </h4>
                <p className="text-sm text-slate-600 mt-1">
                  Monitor deal stages, scheduled reminder dates, and negotiation outcomes without switching between multiple apps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. About Section */}
      <section id="about" className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Your Smarter Partner for Retail Sales
            </h3>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
              AI-CRM brings customer relationship management and AI-assisted price negotiation into one practical platform. It is designed to help retailers manage product enquiries, maintain customer relationships, and make more informed selling decisions.
            </p>

            <div className="pt-2">
              <Link
                to="/signup"
                className="inline-flex items-center px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Final Call-to-Action Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-3xl p-10 sm:p-16 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-5">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                Ready to Make Every Enquiry Count?
              </h3>
              <p className="text-base sm:text-lg text-slate-300">
                Bring your products, customer leads, and negotiations together with AI-CRM.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/signup"
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-base font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Create Your Account
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white text-base font-semibold rounded-xl border border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white"
                >
                  Log In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="mt-auto bg-slate-100 border-t border-slate-200 py-12 text-slate-600 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-between">
            {/* Brand column */}
            <div className="md:col-span-5 space-y-3 text-left">
              <button
                onClick={() => scrollToSection('top')}
                className="flex items-center gap-2.5 text-slate-900 font-extrabold text-lg focus:outline-none"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>AI-CRM</span>
              </button>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                An AI-powered customer relationship management platform designed for retailers and wholesalers to manage enquiries, follow-ups, and price negotiations in one place.
              </p>
              <p className="text-[11px] text-slate-400">
                Architecture ready for Supabase database & authentication integration.
              </p>
            </div>

            {/* Quick Navigation Links */}
            <div className="md:col-span-4 text-left space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Navigation
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>
                  <button
                    onClick={() => scrollToSection('top')}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('how-it-works')}
                    className="hover:text-blue-600 transition-colors"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('about')}
                    className="hover:text-blue-600 transition-colors"
                  >
                    About
                  </button>
                </li>
              </ul>
            </div>

            {/* Account Links */}
            <div className="md:col-span-3 text-left space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Account
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>
                  <Link to="/login" className="hover:text-blue-600 transition-colors">
                    Log In
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-blue-600 transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <p>© {currentYear} AI-CRM. All rights reserved.</p>
            <p className="text-[11px] text-slate-400">
              Evaluation Version • Built for Retailers & Wholesalers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
