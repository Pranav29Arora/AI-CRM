import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-200 flex items-center justify-center mb-3 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
        <p className="text-sm font-semibold text-slate-800">Loading AI-CRM...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
