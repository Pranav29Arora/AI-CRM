import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center text-slate-300 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-3 shadow-lg shadow-brand-500/10">
            <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          </div>
          <p className="text-sm font-semibold text-white">Loading AI-CRM...</p>
        </div>
      </div>
    );
  }

  // Allow login and signup pages to be accessible at all times
  // Users who are logged in can switch accounts or review their active credentials
  return children;
};
