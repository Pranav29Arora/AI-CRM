import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AISettingsModal } from '../components/ai/AISettingsModal';
import { FirestoreStatusModal } from '../components/firestore/FirestoreStatusModal';
import { apiRequest } from '../services/api';
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
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Zap,
  Key,
  Flame,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [isFirestoreModalOpen, setIsFirestoreModalOpen] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState({ connected: false });

  const fetchSystemStatus = async () => {
    try {
      const res = await apiRequest('/system/status');
      if (res.data?.firestore) {
        setFirestoreStatus(res.data.firestore);
      }
    } catch (e) {
      // Backend status poll note
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Products Catalog', path: '/products', icon: Package },
    { name: 'Customers & Leads', path: '/customers', icon: Users },
    { name: 'Negotiation Engine', path: '/negotiations', icon: Sparkles, badge: 'AI Guard' },
    { name: 'WhatsApp Hub', path: '/conversations', icon: MessageSquare, badge: 'Desk' },
  ];

  const currentNav = navLinks.find(link => link.path === location.pathname) || { name: 'Overview' };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-brand-500 selection:text-white">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-md shadow-brand-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
            AI-CRM
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/80 backdrop-blur-2xl border-r border-slate-800/70 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo Branding */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 rounded-xl blur-sm opacity-60 group-hover:opacity-100 transition duration-300" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
                  AI-CRM
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">Wholesale Intelligence</p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-brand-500/10 text-brand-300 border border-brand-500/30 rounded-full">
              PRO
            </span>
          </div>

          {/* Quick Action Button in Sidebar */}
          <div className="p-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/negotiations');
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 shadow-md shadow-brand-500/20 transition-all hover:scale-[1.01]"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Launch Deal Desk</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-1 space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Workspaces
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group relative
                    ${isActive
                      ? 'bg-brand-600/20 text-white border border-brand-500/40 shadow-sm shadow-brand-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-brand-400 to-indigo-500 rounded-r-full" />
                      )}
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                        <span className="font-semibold">{link.name}</span>
                      </div>
                      {link.badge && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isActive
                            ? 'bg-brand-500/20 text-brand-300 border-brand-400/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700/60'
                        }`}>
                          {link.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info Card */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <button
            onClick={() => setIsFirestoreModalOpen(true)}
            className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-xs transition-all"
            title="Click to view Cloud Firestore status & rules"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-300 text-[11px]">
                <Database className={`w-3.5 h-3.5 ${firestoreStatus.connected ? 'text-emerald-400' : 'text-amber-400'}`} />
                Cloud Firestore
              </span>
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${firestoreStatus.connected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${firestoreStatus.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {firestoreStatus.connected ? (
                <>Live sync active on <span className="text-slate-300 font-mono text-[10px]">ai-crm-f73a5</span></>
              ) : (
                <span className="text-amber-300 font-medium">Rules pending (Click to sync)</span>
              )}
            </p>
          </button>

          {/* User Profile Strip & Logout */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white border border-brand-400/40">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Sales Director'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.company || 'Wholesale Enterprise'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen overflow-y-auto ambient-mesh">
        {/* Top Navbar */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-slate-900/40 backdrop-blur-xl border-b border-slate-800/70 sticky top-0 z-30">
          {/* Breadcrumb Context */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>AI-CRM</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-bold">{currentNav.name}</span>
            </div>
            <span className="h-3.5 w-px bg-slate-800" />
            <button
              onClick={() => setIsFirestoreModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold transition-all hover:scale-[1.02] ${
                firestoreStatus.connected
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:border-amber-400/50'
              }`}
              title="Click to check Cloud Firestore connection & rules"
            >
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${firestoreStatus.connected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {firestoreStatus.connected ? 'Firestore Realtime' : 'Firestore Setup Needed'}
            </button>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3">
            {/* Gemini AI Key Quick Config Button */}
            <button
              onClick={() => setIsAISettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800/80 border border-slate-700 hover:border-brand-500/60 text-slate-200 hover:text-white transition-all shadow-sm"
              title="Manage Gemini Generative AI Model"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Gemini Model</span>
            </button>

            {/* Quick action to negotiation */}
            <button
              onClick={() => navigate('/negotiations')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white rounded-xl shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
            >
              <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Quick Quote</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white border border-brand-400/40">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-slate-200">{user?.name || "User"}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{user?.company || "Retail Corp"}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-xs font-bold text-white">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <p className="text-[10px] text-brand-400 mt-0.5 font-medium">{user?.role} • {user?.company}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setIsAISettingsOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-brand-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Key className="w-3.5 h-3.5 text-brand-400" /> Configure Gemini AI Model
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/products');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Package className="w-3.5 h-3.5" /> Manage Products
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/customers');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Users className="w-3.5 h-3.5" /> Manage Customers
                  </button>
                  <Link
                    to="/landing"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-brand-400" /> View Public Landing Page
                  </Link>
                  <div className="border-t border-slate-800 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>

        {/* Global AI Intelligence Settings Modal */}
        <AISettingsModal
          isOpen={isAISettingsOpen}
          onClose={() => setIsAISettingsOpen(false)}
        />

        {/* Cloud Firestore Status & Configuration Modal */}
        <FirestoreStatusModal
          isOpen={isFirestoreModalOpen}
          onClose={() => setIsFirestoreModalOpen(false)}
          status={firestoreStatus}
          onSyncSuccess={(newStatus) => setFirestoreStatus(newStatus)}
        />
      </div>
    </div>
  );
};
