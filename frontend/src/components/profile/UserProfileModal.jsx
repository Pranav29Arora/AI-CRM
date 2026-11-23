import React from 'react';
import {
  X,
  User,
  Mail,
  Building2,
  ShieldCheck,
  LogOut,
  ExternalLink,
  LogIn,
  UserPlus,
  Key,
  Database,
  Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const UserProfileModal = ({ isOpen, onClose, user, onLogout, onOpenAISettings }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden bg-slate-900/95 animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                User Profile & Account
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full">
                  Active Session
                </span>
              </h3>
              <p className="text-xs text-slate-400">Authenticated user details and session management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* User Identity Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950/90 to-brand-950/30 border border-slate-800 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-xl font-extrabold text-white shadow-xl shadow-brand-500/25 border border-brand-400/40 flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold text-white truncate">{user?.name || 'Authorized User'}</h4>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="truncate">{user?.email || 'user@example.com'}</span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/30 rounded-md">
                  {user?.role || 'Sales Director'}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded-md truncate max-w-[180px]">
                  {user?.company || 'Wholesale Enterprise'}
                </span>
              </div>
            </div>
          </div>

          {/* Account Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-1">Company / Hub</span>
              <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                <span className="truncate">{user?.company || 'Apex Wholesale & Retail'}</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-1">Access Level</span>
              <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>{user?.role || 'Administrator'}</span>
              </p>
            </div>
          </div>

          {/* Navigation & Account Actions */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Quick Links</span>
            
            <button
              onClick={() => {
                onClose();
                if (onOpenAISettings) onOpenAISettings();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all text-left"
            >
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-brand-400" />
                <span>Configure Gemini AI Model Key</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </button>

            <Link
              to="/landing"
              onClick={onClose}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all text-left"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4 text-brand-400" />
                <span>View Public Landing Page</span>
              </div>
            </Link>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/login"
                onClick={onClose}
                className="flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-950/40 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all font-semibold"
              >
                <LogIn className="w-3.5 h-3.5 text-brand-400" />
                <span>Switch Account</span>
              </Link>
              <Link
                to="/signup"
                onClick={onClose}
                className="flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-950/40 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all font-semibold"
              >
                <UserPlus className="w-3.5 h-3.5 text-brand-400" />
                <span>New Account</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Modal Footer with Prominent Log Out */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              onClose();
              await onLogout();
            }}
            className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02]"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
