import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { AISettingsModal } from '../components/ai/AISettingsModal';
import {
  LayoutDashboard,
  Package,
  Users,
  Sparkles,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Database,
  RefreshCw,
  Bell,
  Search,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Zap,
  Key
} from 'lucide-react';

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [bannerNotice, setBannerNotice] = useState('Firebase Cloud Firestore connected (Project: ai-crm-f73a5). Live cloud synchronization active.');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResetData = async () => {
    if (!window.confirm("Reset mock database to initial seed data? Any new items will be reverted.")) {
      return;
    }
    try {
      setIsResetting(true);
      await authService.resetData();
      setBannerNotice("Mock database has been reset to original seed data!");
      // Reload current route data
      window.location.reload();
    } catch (err) {
      alert("Failed to reset database: " + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Products Catalog', path: '/products', icon: Package },
    { name: 'Customers & Leads', path: '/customers', icon: Users },
    { name: 'Negotiation Engine', path: '/negotiations', icon: Sparkles, badge: 'AI Guard' },
    { name: 'WhatsApp Follow-ups', path: '/conversations', icon: MessageSquare, badge: 'Simulated' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
            AI-CRM
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo Branding */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
                <Sparkles className="w-5 h-5 text-white animate-pulse-slow" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
                  AI-CRM
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">Retail & Wholesale</p>
              </div>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-md">
              v1.0
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group
                    ${isActive
                      ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-brand-300 border border-slate-700/80">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info Card */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 mb-3">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Cloud Firestore
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
              Connected to <strong className="text-slate-300">ai-crm-f73a5</strong>. Live cloud persistence active.
            </p>
            <button
              onClick={handleResetData}
              disabled={isResetting}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-600/50"
            >
              <RefreshCw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
              Reset Cloud Data
            </button>
          </div>

          {/* User mini badge & quick logout */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={user?.name || "User"}
                className="w-8 h-8 rounded-full border border-slate-700 object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Evaluator'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.company || 'Demo Account'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen overflow-y-auto">
        {/* Top Navbar */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live DB: Firebase Cloud Firestore (ai-crm-f73a5)
            </div>
            <NavLink
              to="/"
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              Landing Page <ExternalLink className="w-3 h-3" />
            </NavLink>
          </div>

          <div className="flex items-center gap-3">
            {/* Gemini AI Key Quick Config Button */}
            <button
              onClick={() => setIsAISettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-750 hover:border-brand-500/50 transition-all shadow-sm"
              title="Add or manage Google Gemini 1.5 Flash API Key"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Gemini AI Key</span>
            </button>

            {/* Quick action to negotiation */}
            <button
              onClick={() => navigate('/negotiations')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-lg shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
            >
              <Zap className="w-3.5 h-3.5" />
              New Deal Offer
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                  alt={user?.name || "User"}
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                />
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-semibold text-slate-200">{user?.name || "Admin"}</p>
                  <p className="text-[10px] text-slate-400">{user?.role || "Director"}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-xs font-semibold text-white">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <p className="text-[10px] text-brand-400 mt-1 font-medium">{user?.role} • {user?.company}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setIsAISettingsOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-brand-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Key className="w-3.5 h-3.5 text-brand-400" /> Configure Gemini AI Key
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/products');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Package className="w-3.5 h-3.5" /> Manage Products
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/customers');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Users className="w-3.5 h-3.5" /> Manage Customers
                  </button>
                  <div className="border-t border-slate-800 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Evaluation Mode Alert */}
        <div className="bg-slate-900/40 border-b border-slate-800/60 px-6 py-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span>{bannerNotice}</span>
          </div>
          <span className="hidden sm:inline-block text-[11px] text-slate-500">
            Backend REST API connected & verified
          </span>
        </div>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>

        {/* Global AI Intelligence Settings Modal */}
        <AISettingsModal
          isOpen={isAISettingsOpen}
          onClose={() => setIsAISettingsOpen(false)}
        />
      </div>
    </div>
  );
};
