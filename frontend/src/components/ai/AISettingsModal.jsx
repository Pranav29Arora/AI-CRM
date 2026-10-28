import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/aiService';
import {
  Sparkles,
  Bot,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  Zap,
  RefreshCw,
  Cpu,
  Lock
} from 'lucide-react';

export const AISettingsModal = ({ isOpen, onClose, onUpdated }) => {
  const [status, setStatus] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await aiService.getStatus();
      setStatus(data);
    } catch (err) {
      console.warn('Failed to fetch AI status:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setMessage(null);
      setApiKey('');
    }
  }, [isOpen]);

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key to test.' });
      return;
    }
    try {
      setTesting(true);
      setMessage(null);
      const res = await aiService.testConnection(apiKey.trim());
      if (res.success) {
        setMessage({ type: 'success', text: `✅ ${res.message || 'Gemini API connection verified!'}` });
      } else {
        setMessage({ type: 'error', text: res.message || 'API test failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Connection test failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      const res = await aiService.updateConfig(apiKey.trim());
      setMessage({ type: 'success', text: res.message || 'Configuration saved successfully.' });
      await fetchStatus();
      if (onUpdated) onUpdated();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update Gemini API key.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      setLoading(true);
      setMessage(null);
      await aiService.updateConfig('');
      setApiKey('');
      setMessage({ type: 'success', text: 'API key cleared. System reverted to Demo AI Heuristics Mode.' });
      await fetchStatus();
      if (onUpdated) onUpdated();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to clear key.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl flex flex-col rounded-2xl glass-panel bg-slate-900/95 border border-slate-700/80 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Gemini AI Intelligence Engine
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                  status?.isLive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                }`}>
                  {status?.isLive ? 'Live Gemini 1.5 Flash' : 'Demo Guardrails Mode'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure live Google Gemini 1.5 Flash or utilize deterministic B2B trade heuristics.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">

          {/* Current Status Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Cpu className="w-4 h-4 text-brand-400" />
                Active Model Engine:
              </div>
              <span className="font-mono text-xs font-bold text-brand-300">
                {status?.model || 'gemini-1.5-flash'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {status?.isLive ? (
                <div className="flex items-start gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Live Gemini API Active:</strong> Real-time generative replies, multi-turn WhatsApp conversation summaries, and dynamic tone tuning are enabled via your Google AI API key.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-slate-300">
                  <Bot className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Demo AI Heuristics Active:</strong> Generates authentic Indian B2B wholesale trade messages using rule-bound heuristics. Mathematical pricing guardrails are strictly guaranteed.
                  </span>
                </div>
              )}
            </div>

            {/* Guaranteed Guardrail Badge */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span>
                <strong>Zero-Hallucination Guardrail:</strong> AI can suggest tactics and draft messages, but the backend pricing ladder strictly blocks any unauthorized deals below the absolute floor.
              </span>
            </div>
          </div>

          {/* Notifications */}
          {message && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Configuration Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-brand-400" />
                  Google Gemini API Key
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1 underline underline-offset-2"
                >
                  Get key from Google AI Studio
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={status?.apiKeyConfigured ? "••••••••••••••••••••••••••••••••••••" : "Paste AIzaSy... API key here"}
                  className="glass-input block w-full pl-3.5 pr-20 py-2.5 text-xs font-mono rounded-xl bg-slate-950/80 border-slate-700/80"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Keys are stored securely in backend environment variables and used only for generative prompts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !apiKey.trim()}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all disabled:opacity-40"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
                Test Key
              </button>

              <button
                type="submit"
                disabled={loading || !apiKey.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-md shadow-brand-500/20 transition-all disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Save & Activate Gemini
              </button>

              {status?.apiKeyConfigured && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                  className="text-xs text-rose-400 hover:text-rose-300 ml-auto transition-colors"
                >
                  Revert to Demo Mode
                </button>
              )}
            </div>
          </form>

          {/* Capabilities Grid */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <h4 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Supported Deal Intelligence Capabilities:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span>Multi-tone replies (Hinglish/Urgent/Firm)</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span>3 Alternative counter-proposals</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span>WhatsApp conversation thread summarizer</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span>Buyer price elasticity profiling</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default AISettingsModal;
