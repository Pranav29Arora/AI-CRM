import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  X,
  ShieldAlert
} from 'lucide-react';
import { apiRequest } from '../../services/api';

export const FirestoreStatusModal = ({ isOpen, onClose, status, onSyncSuccess }) => {
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  if (!isOpen) return null;

  const rulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rulesSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestSync = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const res = await apiRequest('/system/sync', { method: 'POST' });
      setSyncResult({
        success: res.data?.connected || false,
        message: res.message || (res.data?.connected ? 'Connected to Cloud Firestore!' : 'Still blocked by permissions.')
      });
      if (res.data?.connected && onSyncSuccess) {
        onSyncSuccess(res.data);
      }
    } catch (err) {
      setSyncResult({
        success: false,
        message: err.message || 'Sync attempt failed.'
      });
    } finally {
      setSyncing(false);
    }
  };

  const isConnected = status?.connected === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden bg-slate-900/95">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cloud Firestore Realtime Sync</h3>
              <p className="text-[11px] text-slate-400">Project: <span className="font-mono text-slate-300">ai-crm-f73a5</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Current Status Banner */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isConnected 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <p className="font-bold">
                {isConnected ? 'Connected & Synchronized with Cloud Firestore' : 'Action Required: Firestore Security Rules Blocking Access'}
              </p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {isConnected 
                  ? 'All customers and products are actively backed up and synchronizing in real time with Cloud Firestore.' 
                  : 'Cloud Firestore is currently rejecting read/write attempts with "Missing or insufficient permissions". Your customer data is safe in persistent local disk cache, but Cloud Firestore will not reflect updates until rules are published.'
                }
              </p>
            </div>
          </div>

          {!isConnected && (
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                How to enable Cloud Firestore sync (1 minute):
              </h4>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-brand-300 flex-shrink-0 mt-0.5">1</span>
                  <span>
                    Open the <a href="https://console.firebase.google.com/project/ai-crm-f73a5/firestore/rules" target="_blank" rel="noopener noreferrer" className="text-brand-400 font-semibold underline inline-flex items-center gap-1 hover:text-brand-300">
                      Firebase Console Rules tab <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-brand-300 flex-shrink-0 mt-0.5">2</span>
                  <div className="space-y-1.5 flex-1">
                    <span>Replace the existing rules editor contents with:</span>
                    <div className="relative group">
                      <pre className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-300 border border-slate-800 overflow-x-auto">
                        {rulesSnippet}
                      </pre>
                      <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-white flex items-center gap-1 shadow-sm transition-all"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-brand-300 flex-shrink-0 mt-0.5">3</span>
                  <span>Click <strong className="text-white">Publish</strong> in the Firebase Console.</span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-brand-300 flex-shrink-0 mt-0.5">4</span>
                  <span>Click <strong className="text-white">Test Connection & Sync Now</strong> below.</span>
                </div>
              </div>
            </div>
          )}

          {syncResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              syncResult.success 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {syncResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span>{syncResult.message}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-900/60">
          <a
            href="https://console.firebase.google.com/project/ai-crm-f73a5/firestore/rules"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1.5 font-medium"
          >
            <span>Open Firebase Rules</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleTestSync}
              disabled={syncing}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5 shadow-md shadow-brand-600/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Testing...' : 'Test Connection & Sync Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
