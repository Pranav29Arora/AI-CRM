import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-200 flex items-center justify-center mb-3 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
        <p className="text-sm font-semibold text-slate-800">Verifying AI-CRM session...</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to Firebase Authentication</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
