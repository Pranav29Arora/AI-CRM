import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { whatsappService } from '../services/whatsappService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import {
  MessageSquare,
  Bot,
  Send,
  Phone,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  CheckCheck,
  Check,
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
  Zap,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  TrendingUp,
  DollarSign,
  ArrowRight,
  SlidersHorizontal,
  PlayCircle
} from 'lucide-react';
import { aiService } from '../services/aiService';

export const ConversationsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedCustomerId = searchParams.get('customerId');
  const initialMsgParam = searchParams.get('initialMsg');

  // Core Data
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [convContext, setConvContext] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Autonomous AI Roleplay Simulator State
  // Modes: 'buyer_roleplay' (User roleplays as Buyer against Gemini AI Sales Agent) vs 'salesperson' (User types as Sales Desk)
  const [roleplayMode, setRoleplayMode] = useState('buyer_roleplay');
  const [roleplayThinking, setRoleplayThinking] = useState(false);
  const [inputMessage, setInputMessage] = useState(initialMsgParam || '');

  // AI Opener Outreach State
  const [openingDraft, setOpeningDraft] = useState(null);
  const [loadingOpener, setLoadingOpener] = useState(false);
  const [sendingOpener, setSendingOpener] = useState(false);
  const [draftTone, setDraftTone] = useState('formal');

  // AI Suggestion & Deal Intelligence State
  const [aiDraft, setAiDraft] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [threadSummary, setThreadSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // New Wholesale Conversation Modal
  const [isNewConvModalOpen, setIsNewConvModalOpen] = useState(false);
  const [crmCustomers, setCrmCustomers] = useState([]);
  const [crmProducts, setCrmProducts] = useState([]);
  const [selectedCustId, setSelectedCustId] = useState('');
  const [selectedProdId, setSelectedProdId] = useState('');
  const [creatingConv, setCreatingConv] = useState(false);

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

  // Load conversation context and AI opener preview
  const loadConvDetails = async (convId) => {
    try {
      const [detailed, context] = await Promise.all([
        whatsappService.getConversation(convId),
        whatsappService.getConversationContext(convId)
      ]);
      setActiveConv(detailed);
      setConvContext(context);

      // If conversation has 0 messages, generate the formal AI Opener preview
      if (detailed && (!detailed.messages || detailed.messages.length === 0)) {
        loadAiOpener(convId, draftTone);
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    }
  };

  const loadAiOpener = async (convId, tone = draftTone) => {
    try {
      setLoadingOpener(true);
      const res = await whatsappService.getOpeningOutreach(convId, tone);
      setOpeningDraft(res);
    } catch (err) {
      console.error('Failed to generate AI opener:', err);
    } finally {
      setLoadingOpener(false);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const [status, convList, custs, prods] = await Promise.all([
        whatsappService.getStatus(),
        whatsappService.getConversations(),
        customerService.getCustomers(),
        productService.getProducts()
      ]);

      setConnectionStatus(status);
      setCrmCustomers(custs);
      setCrmProducts(prods);

      let targetList = [...convList];

      // If conversations are empty but we have customers in CRM, auto-initiate the first customer's thread
      if (targetList.length === 0 && custs.length > 0) {
        try {
          const autoInitiate = await whatsappService.initiateConversation({
            customerId: custs[0].id,
            productId: custs[0]?.interestedProducts?.[0]?.id || custs[0]?.interestedProducts?.[0]?.productId || prods[0]?.id
          });
          if (autoInitiate) {
            targetList = [autoInitiate];
          }
        } catch (initErr) {
          console.warn('Auto-initiate conversation warning:', initErr.message);
        }
      }

      setConversations(targetList);

      if (targetList.length > 0) {
        let targetConv = targetList[0];
        if (preselectedCustomerId) {
          const match = targetList.find(c => c.customerId === preselectedCustomerId);
          if (match) targetConv = match;
        }
        setActiveConvId(targetConv.id);
        await loadConvDetails(targetConv.id);
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
  }, [activeConv, roleplayThinking]);

  // Handle switching active conversation
  const handleSelectConversation = async (conv) => {
    try {
      setActiveConvId(conv.id);
      setAiDraft(null);
      setOpeningDraft(null);
      await loadConvDetails(conv.id);
      // update unread count in list
      setConversations(prev =>
        prev.map(c => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    }
  };

  // Dispatch the formal Opening Outreach generated by Gemini
  const handleSendOpeningOutreach = async (customText = null) => {
    if (!activeConvId) return;
    try {
      setSendingOpener(true);
      const res = await whatsappService.sendOpeningOutreach(activeConvId, {
        tone: draftTone,
        text: customText || openingDraft?.outreach?.openingMessage
      });

      // Reload active conversation and context
      await loadConvDetails(activeConvId);

      // Refresh conversations list
      const updatedList = await whatsappService.getConversations();
      setConversations(updatedList);
      setOpeningDraft(null);
    } catch (err) {
      alert("Failed to send opening outreach: " + err.message);
    } finally {
      setSendingOpener(false);
    }
  };

  // Roleplay Message Send Handler
  const handleSendMessage = async (e, textOverride = null) => {
    e?.preventDefault();
    const textToSend = textOverride || inputMessage;
    if (!textToSend.trim() || !activeConvId) return;

    if (roleplayMode === 'buyer_roleplay') {
      // USER AS BUYER: triggers autonomous Gemini Sales Agent reply
      try {
        setRoleplayThinking(true);
        setInputMessage('');

        // Optimistically show buyer message in active view
        const tempBuyerMsg = {
          id: `temp-${Date.now()}`,
          sender: 'customer',
          text: textToSend.trim(),
          timestamp: new Date().toISOString(),
          status: 'delivered'
        };
        setActiveConv(prev => prev ? {
          ...prev,
          messages: [...(prev.messages || []), tempBuyerMsg]
        } : prev);

        const res = await whatsappService.sendBuyerRoleplayMessage(activeConvId, {
          text: textToSend.trim(),
          tone: draftTone,
          autoReply: true
        });

        // Update with full response
        if (res.conversation) {
          setActiveConv(res.conversation);
        }
        if (res.evaluation) {
          setConvContext(prev => prev ? { ...prev, evaluation: res.evaluation } : prev);
        }

        // Refresh list
        const updatedList = await whatsappService.getConversations();
        setConversations(updatedList);
      } catch (err) {
        alert("Failed to send buyer roleplay message: " + err.message);
      } finally {
        setRoleplayThinking(false);
      }
    } else {
      // USER AS SALESPERSON
      try {
        setSending(true);
        await whatsappService.sendMessage(activeConvId, textToSend.trim());
        setInputMessage('');
        setAiDraft(null);

        const updated = await whatsappService.getConversation(activeConvId);
        setActiveConv(updated);

        const updatedList = await whatsappService.getConversations();
        setConversations(updatedList);
      } catch (err) {
        alert("Failed to send message: " + err.message);
      } finally {
        setSending(false);
      }
    }
  };

  // Generate AI reply draft (for Sales Desk mode)
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

  // Start new conversation from modal
  const handleStartNewConversation = async (e) => {
    e.preventDefault();
    if (!selectedCustId) return;

    try {
      setCreatingConv(true);
      const conv = await whatsappService.initiateConversation({
        customerId: selectedCustId,
        productId: selectedProdId || null
      });

      setIsNewConvModalOpen(false);

      const updatedList = await whatsappService.getConversations();
      setConversations(updatedList);
      if (conv) {
        handleSelectConversation(conv);
      }
    } catch (err) {
      alert("Failed to initiate conversation: " + err.message);
    } finally {
      setCreatingConv(false);
    }
  };

  // Simulate incoming WhatsApp message
  const handleSimulateIncoming = async (e) => {
    e.preventDefault();
    try {
      setSimulating(true);
      const res = await whatsappService.simulateIncoming(simulateData);
      setIsSimulateModalOpen(false);

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

  // Quick Buyer roleplay action buttons
  const quickBuyerPlays = [
    {
      label: '💰 Ask 5% Discount',
      text: 'Can you give a 5% volume discount if we close 5 units right now?'
    },
    {
      label: '⚡ Push Competitor Rate',
      text: `A local distributor is offering at ₹${convContext?.evaluation?.boundaries?.absoluteLowerLimit ? (convContext.evaluation.boundaries.absoluteLowerLimit - 1000).toLocaleString('en-IN') : '80,000'}. Can you match their price?`
    },
    {
      label: '🚚 Free Express Delivery?',
      text: 'Can you include free door delivery and transit insurance on this lot?'
    },
    {
      label: '💳 Demand 15-day Credit',
      text: 'We require 15 days credit term after delivery for this order. Can we proceed?'
    },
    {
      label: '🤝 Agree & Close Deal',
      text: 'Deal confirmed at your rate! Please send pro-forma invoice with GST billing.'
    }
  ];

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-9 h-9 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-medium">Initializing Autonomous WhatsApp Deal Desk...</p>
      </div>
    );
  }

  // Margin Guard status metrics
  const product = convContext?.product;
  const evaluation = convContext?.evaluation;
  const floorPrice = evaluation?.boundaries?.absoluteLowerLimit || product?.absoluteLowerLimit || 0;
  const prefPrice = evaluation?.boundaries?.preferredMinPrice || product?.preferredMinPrice || 0;
  const targetPrice = evaluation?.boundaries?.targetPrice || product?.targetPrice || 0;
  const currentPrice = evaluation?.suggestedCounterPrice || prefPrice;
  const grossMargin = evaluation?.metrics?.grossMargin ?? 10;
  const grossProfit = evaluation?.metrics?.grossProfit ?? 0;

  return (
    <div className="space-y-3.5 flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Top Banner: Status + Autonomous Mode Controller */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">WhatsApp Hub & Sales Desk</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Autonomous AI Agent Active
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {connectionStatus?.mode || 'Simulation Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Gemini initiates formal B2B wholesale discussions and autonomously defends margins against buyer objections.
              </p>
            </div>
          </div>

          {/* Interactive Mode Switcher & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Switcher Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setRoleplayMode('buyer_roleplay')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  roleplayMode === 'buyer_roleplay'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="You type as the Customer to test Gemini's margin defense"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Buyer Simulator</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleplayMode('salesperson')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  roleplayMode === 'salesperson'
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="You type as the Distributor Salesperson"
              >
                <Bot className="w-3.5 h-3.5 text-brand-400" />
                <span>Sales Desk</span>
              </button>
            </div>

            <button
              onClick={() => {
                if (crmCustomers.length > 0) setSelectedCustId(crmCustomers[0].id);
                if (crmProducts.length > 0) setSelectedProdId(crmProducts[0].id);
                setIsNewConvModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Wholesale Thread
            </button>

            <button
              onClick={() => setIsSimulateModalOpen(true)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
              title="Simulate custom incoming WhatsApp message"
            >
              Simulate Inbound
            </button>

            <button
              onClick={() => setShowIntegrationGuide(!showIntegrationGuide)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors"
              title="Integration guide"
            >
              <Info className="w-4 h-4 text-brand-400" />
            </button>
          </div>
        </div>

        {/* Collapsible WAKit & Cloud API Guide */}
        {showIntegrationGuide && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 animate-fade-in">
            <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              How Option B (Autonomous AI Agent + Roleplay Simulator) Works:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-400 leading-relaxed">
              <li><strong>Formal AI Opening:</strong> Gemini drafts and initiates formal B2B outreach with customer name, interested product, quantity, GST billing & factory warranty.</li>
              <li><strong>Zero-Margin-Leak Policy:</strong> When you roleplay as the buyer offering sub-floor pricing, Gemini immediately detects floor violations and rejects the offer.</li>
              <li><strong>Autonomous Multi-Turn Replies:</strong> Each message you send as the buyer automatically triggers the sales agent within ~1s with defensive tactics.</li>
              <li><strong>Live Margin HUD:</strong> Shows real-time pricing corridors (Floor, Preferred, Target, Gross Margin %) right above the conversation thread.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Main Two-Pane Chat Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 rounded-2xl overflow-hidden border border-slate-800 bg-[#0b141a]">
        {/* LEFT PANE: Conversation List (4 cols) */}
        <div className="md:col-span-4 bg-[#111b21] border-r border-slate-800 flex flex-col min-h-0">
          {/* Chat List Header */}
          <div className="p-3 bg-[#202c33] border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Chats</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
                {conversations.length}
              </span>
            </span>
            <button
              onClick={() => {
                if (crmCustomers.length > 0) setSelectedCustId(crmCustomers[0].id);
                setIsNewConvModalOpen(true);
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start Chat</span>
            </button>
          </div>

          {/* Conversation List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                <p className="text-xs font-semibold text-slate-400 mb-1">No chats active</p>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  Click 'New Wholesale Thread' to initiate a conversation with a customer from your CRM.
                </p>
                <button
                  onClick={() => setIsNewConvModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-xl"
                >
                  + Start First Thread
                </button>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                    activeConvId === conv.id ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]/60'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white flex-shrink-0 text-sm shadow-sm">
                    {conv.customerName.charAt(0)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-bold text-white truncate">{conv.customerName}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {conv.lastMessageTimestamp
                          ? new Date(conv.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{conv.lastMessage || 'No messages yet'}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-slate-500 font-mono">{conv.customerPhone}</span>
                      {conv.messages && conv.messages.length === 0 && (
                        <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-950/70 px-1.5 py-0.2 rounded border border-emerald-500/30">
                          Ready for Opener
                        </span>
                      )}
                    </div>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500 text-slate-950">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANE: Active Conversation Stream & Autonomous Margin HUD (8 cols) */}
        {activeConv ? (
          <div className="md:col-span-8 flex flex-col min-h-0 bg-[#0b141a]">
            {/* Chat Top Header */}
            <div className="p-3 bg-[#202c33] border-b border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-xs">
                  {activeConv.customerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">{activeConv.customerName}</h3>
                    {roleplayMode === 'buyer_roleplay' ? (
                      <span className="px-2 py-0.2 text-[9px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        🎭 Roleplaying as Buyer
                      </span>
                    ) : (
                      <span className="px-2 py-0.2 text-[9px] font-bold rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        💼 Sales Desk Mode
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {activeConv.customerPhone} • <span className="text-emerald-400">Gemini Sales Agent On Duty</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSummarizeThread}
                  disabled={summarizing || !activeConv.messages || activeConv.messages.length === 0}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 rounded-lg transition-colors disabled:opacity-40"
                  title="Generate AI deal briefing and buyer sentiment summary"
                >
                  {summarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                  AI Deal Brief
                </button>
                <button
                  onClick={() => navigate(`/negotiations?customerId=${activeConv.customerId || ''}`)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-brand-600/30 hover:bg-brand-600/50 text-brand-200 border border-brand-500/30 rounded-lg transition-colors"
                >
                  Deal Desk
                </button>
              </div>
            </div>

            {/* LIVE MARGIN GUARD HEADS-UP DISPLAY (HUD) */}
            <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 flex-shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Product & Inquired Lot */}
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {product ? product.name : 'Wholesale Consignment'}
                      </span>
                      {product?.sku && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                          {product.sku}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Lot: {convContext?.quantity || 5} units • Target: ₹{targetPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Pricing Boundaries Ladder */}
                <div className="flex items-center gap-3 bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800">
                  <div className="text-[11px]">
                    <span className="text-[9px] uppercase font-bold text-rose-400 block">Floor Limit</span>
                    <span className="font-mono font-bold text-slate-200">₹{floorPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-5 w-px bg-slate-800" />
                  <div className="text-[11px]">
                    <span className="text-[9px] uppercase font-bold text-amber-400 block">Preferred</span>
                    <span className="font-mono font-bold text-slate-200">₹{prefPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-5 w-px bg-slate-800" />
                  <div className="text-[11px]">
                    <span className="text-[9px] uppercase font-bold text-emerald-400 block">Current Quote</span>
                    <span className="font-mono font-bold text-emerald-300">₹{currentPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Live Margin Status Badge */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Deal Margin</span>
                    <span className={`font-mono font-bold ${
                      grossMargin >= 15 ? 'text-emerald-400' : grossMargin >= 8 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {grossMargin}% (₹{grossProfit.toLocaleString('en-IN')})
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${
                    evaluation?.recommendation === 'REJECT'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : evaluation?.recommendation === 'ACCEPT'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {evaluation?.recommendation || 'GUARDED'}
                  </span>
                </div>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0b141a] ambient-dot-grid">
              {/* Simulation Mode watermark notice */}
              <div className="text-center my-1">
                <span className="px-3.5 py-1 rounded-full text-[10px] font-semibold bg-slate-900/90 border border-slate-800 text-slate-400 shadow-sm backdrop-blur-sm">
                  🔒 WhatsApp Simulation Sandbox • Autonomous Margin Protection Active
                </span>
              </div>

              {/* EMPTY THREAD: START CONVERSATION WITH AI OPENER BANNER */}
              {activeConv.messages && activeConv.messages.length === 0 && (
                <div className="my-6 max-w-xl mx-auto bg-gradient-to-br from-slate-900 via-slate-900/90 to-brand-950/60 border border-brand-500/30 rounded-2xl p-5 shadow-2xl animate-fade-in">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center border border-brand-500/30">
                      <Sparkles className="w-4 h-4 text-brand-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Start Wholesale Discussion with Gemini AI</h4>
                      <p className="text-[11px] text-slate-400">
                        Formal B2B opening outreach addressing {activeConv.customerName} with warranty, GST & lot quote.
                      </p>
                    </div>
                  </div>

                  {/* Tone Selector Pills for Opening Outreach */}
                  <div className="flex flex-wrap items-center gap-1.5 my-3 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs">
                    <span className="text-[11px] text-slate-400 font-semibold px-1">Tone:</span>
                    {[
                      { id: 'formal', label: '🤝 Trade (Formal)' },
                      { id: 'assertive', label: '🛡️ Firm' },
                      { id: 'urgent', label: '⚡ Urgent Warehouse Cutoff' },
                      { id: 'hinglish', label: '🇮🇳 Hinglish' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setDraftTone(t.id);
                          loadAiOpener(activeConvId, t.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          draftTone === t.id
                            ? 'bg-brand-600 text-white font-bold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Generated Opening Message Preview */}
                  {loadingOpener ? (
                    <div className="p-6 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-400 mx-auto mb-2" />
                      <p className="text-xs">Formulating formal B2B wholesale opening message...</p>
                    </div>
                  ) : openingDraft ? (
                    <div className="space-y-3">
                      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-brand-500/20 font-sans text-xs text-slate-200 leading-relaxed">
                        <p className="whitespace-pre-wrap">{openingDraft.outreach?.openingMessage}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Product: {openingDraft.product?.name || 'Selected SKU'} • Qty: {openingDraft.quantity}
                        </span>
                        <button
                          onClick={() => handleSendOpeningOutreach()}
                          disabled={sendingOpener}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
                        >
                          {sendingOpener ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Dispatch Opening Outreach via Gemini</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => loadAiOpener(activeConvId, draftTone)}
                      className="w-full py-2.5 text-xs font-bold text-brand-300 bg-brand-600/20 hover:bg-brand-600/30 rounded-xl border border-brand-500/30"
                    >
                      Generate AI Opener
                    </button>
                  )}
                </div>
              )}

              {/* Message Bubbles */}
              {activeConv.messages.map((msg) => {
                const isCustomer = msg.sender === 'customer';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-lg transition-all ${
                        isCustomer
                          ? 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/60'
                          : 'bg-gradient-to-r from-[#005c4b] to-[#016f5a] text-white rounded-tr-none border border-emerald-600/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5 opacity-80 text-[10px] font-semibold uppercase tracking-wider">
                        <span>
                          {isCustomer ? `${activeConv.customerName} (Buyer)` : 'Gemini AI (Distributor Desk)'}
                        </span>
                        {msg.tacticApplied && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-950/50 text-emerald-300 text-[9px] font-mono border border-emerald-500/30">
                            🛡️ {msg.tacticApplied}
                          </span>
                        )}
                      </div>

                      <p className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed">{msg.text}</p>

                      <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] text-slate-300 font-mono">
                        {msg.evaluatedPrice && (
                          <span className="mr-auto text-[9px] text-amber-300 font-semibold">
                            Evaluated: ₹{msg.evaluatedPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!isCustomer && (
                          <span className="text-sky-400 inline-flex items-center" title="Delivered & Read">
                            <CheckCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* AI Sales Agent Live Typing Indicator */}
              {roleplayThinking && (
                <div className="flex flex-col items-end animate-fade-in">
                  <div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-xs bg-slate-900 border border-emerald-500/40 text-emerald-300 shadow-md flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 flex-shrink-0" />
                    <span className="font-medium text-[11px]">
                      Gemini Sales Agent is evaluating margin guardrails & drafting reply...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* AI Draft Suggestion Box (for Sales Desk mode) */}
            {aiDraft && roleplayMode === 'salesperson' && (
              <div className="p-4 bg-gradient-to-r from-brand-950/90 via-slate-900/95 to-brand-950/90 border-t border-brand-500/40 flex-shrink-0 animate-fade-in shadow-[0_-5px_20px_rgba(59,130,246,0.1)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-brand-400" />
                    </span>
                    <span className="text-xs font-bold text-brand-200">
                      AI Proposed Strategy Reply ({aiDraft.mode}):
                    </span>
                  </div>
                  <button
                    onClick={() => setAiDraft(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors text-xs"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-200 italic mb-3 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-brand-500/20 font-sans">
                  "{aiDraft.suggestedReply}"
                </p>
                <div className="flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => setInputMessage(aiDraft.suggestedReply)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-brand-600/30 hover:bg-brand-600/50 text-brand-200 rounded-xl border border-brand-500/40 transition-all hover:scale-[1.02]"
                  >
                    Copy to Input Field
                  </button>
                  <button
                    onClick={() => {
                      setInputMessage(aiDraft.suggestedReply);
                      setTimeout(() => handleSendMessage(null, aiDraft.suggestedReply), 100);
                    }}
                    className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5 hover:scale-[1.02]"
                  >
                    <Send className="w-3.5 h-3.5" /> Approve & Send Now
                  </button>
                </div>
              </div>
            )}

            {/* QUICK BUYER ACTION CHIPS (Visible in Buyer Roleplay Mode) */}
            {roleplayMode === 'buyer_roleplay' && (
              <div className="px-3.5 py-2 bg-[#182229] border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
                <span className="text-amber-400 font-semibold flex-shrink-0 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  Buyer Plays:
                </span>
                {quickBuyerPlays.map((play, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(null, play.text)}
                    disabled={roleplayThinking}
                    className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-amber-500/20 border border-slate-700/80 hover:border-amber-500/50 text-slate-300 hover:text-amber-200 flex-shrink-0 transition-all disabled:opacity-50 text-[11px]"
                  >
                    {play.label}
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Bar: Action & Message Input */}
            <div className="p-3 bg-[#202c33] border-t border-slate-800 flex-shrink-0 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {roleplayMode === 'buyer_roleplay' ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-medium">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>Roleplay active: You type as the Buyer • Gemini AI defends margins automatically</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGenerateAIReply(draftTone)}
                      disabled={generatingAI}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-600/30 hover:bg-brand-600/50 text-brand-300 border border-brand-500/40 rounded-xl transition-all disabled:opacity-50 shadow-sm"
                    >
                      <Bot className={`w-3.5 h-3.5 ${generatingAI ? 'animate-spin' : ''}`} />
                      {generatingAI ? "Drafting with AI..." : "Draft AI Counter Reply"}
                    </button>
                  )}

                  {/* Tone Selector Pills */}
                  <div className="flex items-center gap-1 bg-[#111b21] p-1 rounded-xl border border-slate-700/60 text-[10px]">
                    {[
                      { id: 'formal', label: '🤝 Trade' },
                      { id: 'assertive', label: '🛡️ Firm' },
                      { id: 'urgent', label: '⚡ Urgent' },
                      { id: 'hinglish', label: '🇮🇳 Hinglish' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setDraftTone(t.id);
                          if (aiDraft && roleplayMode === 'salesperson') handleGenerateAIReply(t.id);
                        }}
                        className={`px-2 py-0.5 rounded-lg transition-colors font-medium ${
                          draftTone === t.id
                            ? 'bg-brand-600 text-white font-bold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 font-medium">
                  {roleplayMode === 'buyer_roleplay' ? 'Press Enter to submit buyer objection' : 'Press Enter to send'}
                </span>
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={
                    roleplayMode === 'buyer_roleplay'
                      ? "Type an objection, counter-rate, or question as the Buyer (e.g. 'Give ₹80,000 final')..."
                      : "Type a response or counter-offer to buyer..."
                  }
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={roleplayThinking || sending}
                  className="flex-1 bg-[#2a3942] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-sans disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={roleplayThinking || sending || !inputMessage.trim()}
                  className={`p-2.5 rounded-xl text-white shadow-md transition-all disabled:opacity-50 flex-shrink-0 hover:scale-105 ${
                    roleplayMode === 'buyer_roleplay'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                  }`}
                  title={roleplayMode === 'buyer_roleplay' ? "Send as Buyer" : "Send message"}
                >
                  {roleplayThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="md:col-span-8 flex flex-col items-center justify-center text-center p-12 bg-[#0b141a]">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-xl shadow-emerald-500/5">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">WhatsApp Deal Desk</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
              Gemini AI initiates formal wholesale outreach and autonomously defends distributor margins against buyer counter-offers.
            </p>
            <button
              onClick={() => setIsNewConvModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Start Wholesale Thread</span>
            </button>
          </div>
        )}
      </div>

      {/* START NEW WHOLESALE THREAD MODAL */}
      {isNewConvModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Start Wholesale Discussion
              </h2>
              <button onClick={() => setIsNewConvModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartNewConversation} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Customer</label>
                <select
                  required
                  value={selectedCustId}
                  onChange={(e) => {
                    setSelectedCustId(e.target.value);
                    const c = crmCustomers.find(item => item.id === e.target.value);
                    if (c?.interestedProducts?.[0]?.id || c?.interestedProducts?.[0]?.productId) {
                      setSelectedProdId(c.interestedProducts[0].id || c.interestedProducts[0].productId);
                    }
                  }}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                >
                  <option value="">-- Choose Customer --</option>
                  {crmCustomers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''} - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Negotiation Product</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                >
                  <option value="">-- Choose Product Catalog SKU --</option>
                  {crmProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Floor: ₹{p.absoluteLowerLimit.toLocaleString('en-IN')} | Target: ₹{p.targetPrice.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Gemini will formulate a formal opening outreach message locked to this product's margin guardrails.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewConvModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingConv || !selectedCustId}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creatingConv && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Launch WhatsApp Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
