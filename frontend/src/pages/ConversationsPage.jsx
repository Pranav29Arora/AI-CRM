import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { whatsappService } from '../services/whatsappService';
import { customerService } from '../services/customerService';
import {
  MessageSquare,
  Bot,
  Send,
  Phone,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Search,
  Plus,
  RefreshCw,
  X,
  Info,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Layers,
  Zap
} from 'lucide-react';
import { aiService } from '../services/aiService';

export const ConversationsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedCustomerId = searchParams.get('customerId');
  const initialMsgParam = searchParams.get('initialMsg');

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Message input state
  const [inputMessage, setInputMessage] = useState(initialMsgParam || '');

  // AI Suggestion & Deal Intelligence State
  const [aiDraft, setAiDraft] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [draftTone, setDraftTone] = useState('relationship');
  const [threadSummary, setThreadSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Incoming message simulator modal
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simulateData, setSimulateData] = useState({
    customerName: 'Rajesh Kumar',
    phone: '+91 98110 45231',
    text: 'Namaste, can we close 5 units at ₹58,500 if we transfer 50% advance now?'
  });
  const [simulating, setSimulating] = useState(false);

  // Guide toggle
  const [showIntegrationGuide, setShowIntegrationGuide] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const [status, convList] = await Promise.all([
        whatsappService.getStatus(),
        whatsappService.getConversations()
      ]);

      setConnectionStatus(status);
      setConversations(convList);

      if (convList.length > 0) {
        let targetConv = convList[0];
        if (preselectedCustomerId) {
          const match = convList.find(c => c.customerId === preselectedCustomerId);
          if (match) targetConv = match;
        }
        setActiveConvId(targetConv.id);
        const detailed = await whatsappService.getConversation(targetConv.id);
        setActiveConv(detailed);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConv]);

  // Handle switching active conversation
  const handleSelectConversation = async (conv) => {
    try {
      setActiveConvId(conv.id);
      setAiDraft(null);
      const detailed = await whatsappService.getConversation(conv.id);
      setActiveConv(detailed);
      // update unread count in list
      setConversations(prev =>
        prev.map(c => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !activeConvId) return;

    try {
      setSending(true);
      const res = await whatsappService.sendMessage(activeConvId, inputMessage.trim());
      setInputMessage('');
      setAiDraft(null);

      // Refresh active conversation
      const updated = await whatsappService.getConversation(activeConvId);
      setActiveConv(updated);

      // Refresh conversations list
      const updatedList = await whatsappService.getConversations();
      setConversations(updatedList);
    } catch (err) {
      alert("Failed to send message: " + err.message);
    } finally {
      setSending(false);
    }
  };

  // Generate AI reply draft with tone support
  const handleGenerateAIReply = async (toneToUse) => {
    if (!activeConvId) return;
    const tone = toneToUse || draftTone;
    try {
      setGeneratingAI(true);
      const result = await whatsappService.generateAIReply(activeConvId, tone);
      setAiDraft(result);
    } catch (err) {
      alert("AI suggestion failed: " + err.message);
    } finally {
      setGeneratingAI(false);
    }
  };

  // Summarize conversation thread
  const handleSummarizeThread = async () => {
    if (!activeConvId) return;
    try {
      setSummarizing(true);
      const res = await aiService.summarizeThread({ conversationId: activeConvId });
      setThreadSummary(res);
      setShowSummary(true);
    } catch (err) {
      alert("Failed to summarize thread: " + err.message);
    } finally {
      setSummarizing(false);
    }
  };

  // Simulate incoming WhatsApp message
  const handleSimulateIncoming = async (e) => {
    e.preventDefault();
    try {
      setSimulating(true);
      const res = await whatsappService.simulateIncoming(simulateData);
      setIsSimulateModalOpen(false);

      // Refresh list and select the target conversation
      const updatedList = await whatsappService.getConversations();
      setConversations(updatedList);

      if (res.conversation) {
        handleSelectConversation(res.conversation);
      }
    } catch (err) {
      alert("Simulation failed: " + err.message);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-9 h-9 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-medium">Loading WhatsApp Deal Desk...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-8.5rem)]">
      {/* WhatsApp Connection Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">WhatsApp Integration Desk</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {connectionStatus?.mode || 'Simulation Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {connectionStatus?.description || 'Simulated conversation interface for testing negotiations.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimulateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Simulate Incoming Message
            </button>

            <button
              onClick={() => setShowIntegrationGuide(!showIntegrationGuide)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5 text-brand-400" />
              Live WAKit Guide
              {showIntegrationGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible WAKit & WhatsApp Cloud API Guide */}
        {showIntegrationGuide && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              How to Enable Live WhatsApp Integration in Production:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
              <li>{connectionStatus?.integrationGuide?.step1}</li>
              <li>{connectionStatus?.integrationGuide?.step2}</li>
              <li>{connectionStatus?.integrationGuide?.step3}</li>
              <li>When live credentials are active, outgoing messages will dispatch in real-time with blue receipt ticks.</li>
            </ol>
          </div>
        )}
      </div>

      {/* Main Two-Pane Chat Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 rounded-2xl overflow-hidden border border-slate-800 bg-[#0b141a]">
        {/* LEFT PANE: Conversation List (4 cols) */}
        <div className="md:col-span-4 bg-[#111b21] border-r border-slate-800 flex flex-col min-h-0">
          {/* Chat List Header */}
          <div className="p-3.5 bg-[#202c33] border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Chats ({conversations.length})
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              Online
            </span>
          </div>

          {/* Conversation List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                  activeConvId === conv.id ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]/60'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white flex-shrink-0 text-sm">
                  {conv.customerName.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-bold text-white truncate">{conv.customerName}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(conv.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{conv.lastMessage}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{conv.customerPhone}</p>
                </div>

                {conv.unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500 text-slate-950">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANE: Active Conversation Stream & Actions (8 cols) */}
        {activeConv ? (
          <div className="md:col-span-8 flex flex-col min-h-0 bg-[#0b141a]">
            {/* Chat Top Header */}
            <div className="p-3.5 bg-[#202c33] border-b border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-xs">
                  {activeConv.customerName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{activeConv.customerName}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {activeConv.customerPhone} • <span className="text-emerald-400">Simulation Active</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSummarizeThread}
                  disabled={summarizing}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 rounded-lg transition-colors"
                  title="Generate AI deal briefing and buyer sentiment summary"
                >
                  {summarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                  AI Deal Brief
                </button>
                <button
                  onClick={() => navigate(`/negotiations?customerId=${activeConv.customerId || ''}`)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-brand-600/30 hover:bg-brand-600/50 text-brand-200 border border-brand-500/30 rounded-lg transition-colors"
                >
                  Open Deal Desk
                </button>
              </div>
            </div>

            {/* Expandable AI Thread Summary Deal Brief */}
            {showSummary && threadSummary && (
              <div className="p-4 bg-slate-900 border-b border-slate-800 text-xs space-y-2.5 animate-fade-in flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white">AI Deal Brief & Sentiment</span>
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                      {threadSummary.buyerSentiment}
                    </span>
                  </div>
                  <button onClick={() => setShowSummary(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
                </div>
                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  {threadSummary.executiveSummary}
                </p>
                {threadSummary.keyObjections && threadSummary.keyObjections.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Key Buyer Focus / Requests:</span>
                    {threadSummary.keyObjections.map((obj, i) => (
                      <div key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center justify-between">
                  <span><strong>Recommended Next Action:</strong> {threadSummary.recommendedAction}</span>
                  <button
                    onClick={() => setInputMessage(threadSummary.recommendedAction)}
                    className="text-xs font-bold underline hover:text-emerald-200 ml-2 flex-shrink-0"
                  >
                    Use as Reply →
                  </button>
                </div>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a]">
              {/* Simulation Mode watermark notice */}
              <div className="text-center my-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-400">
                  🔒 Messages are simulated locally in Phase 1 evaluation sandbox
                </span>
              </div>

              {activeConv.messages.map((msg) => {
                const isCustomer = msg.sender === 'customer';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                        isCustomer
                          ? 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/50'
                          : 'bg-[#005c4b] text-white rounded-tr-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-1 text-[9px] text-slate-400 font-mono">
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!isCustomer && (
                          <span className="text-emerald-300 font-sans">
                            {msg.status === 'simulated' ? '[Simulated]' : '✓✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Draft Suggestion Box */}
            {aiDraft && (
              <div className="p-3 bg-brand-950/70 border-t border-brand-500/30 flex-shrink-0 animate-fade-in">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-brand-300 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-brand-400" />
                    AI Proposed Counter Reply ({aiDraft.mode}):
                  </span>
                  <button
                    onClick={() => setAiDraft(null)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-200 italic mb-2 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  "{aiDraft.suggestedReply}"
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setInputMessage(aiDraft.suggestedReply)}
                    className="px-3 py-1 text-xs font-semibold bg-brand-600/40 hover:bg-brand-600/60 text-brand-200 rounded-lg border border-brand-500/40 transition-colors"
                  >
                    Copy to Input Field
                  </button>
                  <button
                    onClick={() => {
                      setInputMessage(aiDraft.suggestedReply);
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Approve & Send Now
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Bar: Action & Message Input */}
            <div className="p-3 bg-[#202c33] border-t border-slate-800 flex-shrink-0 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleGenerateAIReply(draftTone)}
                    disabled={generatingAI}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-brand-600/30 hover:bg-brand-600/50 text-brand-300 border border-brand-500/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Bot className={`w-3.5 h-3.5 ${generatingAI ? 'animate-spin' : ''}`} />
                    {generatingAI ? "Drafting with AI..." : "Draft AI Counter Reply"}
                  </button>

                  {/* Tone Selector Pills */}
                  <div className="flex items-center gap-1 bg-[#111b21] p-0.5 rounded-lg border border-slate-700/60 text-[10px]">
                    {[
                      { id: 'relationship', label: '🤝 Trade' },
                      { id: 'assertive', label: '🛡️ Firm' },
                      { id: 'urgent', label: '⚡ Urgent' },
                      { id: 'hinglish', label: '🇮🇳 Hinglish' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setDraftTone(t.id);
                          if (aiDraft) handleGenerateAIReply(t.id);
                        }}
                        className={`px-1.5 py-0.5 rounded transition-colors ${
                          draftTone === t.id
                            ? 'bg-brand-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="text-[10px] text-slate-500">
                  Enter to send • Salesperson approval enforced
                </span>
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a response or counter-offer to buyer..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 bg-[#2a3942] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={sending || !inputMessage.trim()}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all disabled:opacity-50 flex-shrink-0"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="md:col-span-8 flex flex-col items-center justify-center text-slate-500 p-8">
            <MessageSquare className="w-12 h-12 mb-3 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">Select a conversation to begin chatting</p>
            <p className="text-xs text-slate-500 mt-1">Or click 'Simulate Incoming Message' above</p>
          </div>
        )}
      </div>

      {/* SIMULATE INCOMING MESSAGE MODAL */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Simulate Incoming WhatsApp Inquiry
              </h2>
              <button onClick={() => setIsSimulateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateIncoming} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Customer / Sender Name</label>
                <input
                  type="text"
                  required
                  value={simulateData.customerName}
                  onChange={(e) => setSimulateData({ ...simulateData, customerName: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Sender WhatsApp Phone Number</label>
                <input
                  type="text"
                  required
                  value={simulateData.phone}
                  onChange={(e) => setSimulateData({ ...simulateData, phone: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Matched automatically with existing customer records if numbers align.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Incoming Message Text</label>
                <textarea
                  rows="3"
                  required
                  value={simulateData.text}
                  onChange={(e) => setSimulateData({ ...simulateData, text: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simulating}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-1.5"
                >
                  {simulating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Inject Incoming Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
