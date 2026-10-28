import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { customerService } from '../services/customerService';
import { negotiationService } from '../services/negotiationService';
import { aiService } from '../services/aiService';
import { AISettingsModal } from '../components/ai/AISettingsModal';
import {
  Sparkles,
  Bot,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  MessageSquare,
  Clock,
  History,
  DollarSign,
  Package,
  Users,
  Edit3,
  Loader2,
  Check,
  ChevronRight,
  Layers,
  Sliders,
  Info,
  Zap,
  Target,
  Settings,
  TrendingUp,
  ThumbsUp,
  RefreshCw
} from 'lucide-react';

export const NegotiationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedCustomerId = searchParams.get('customerId');

  // Catalogs
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [negotiationHistory, setNegotiationHistory] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form selections
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId || '');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [quantity, setQuantity] = useState(5);

  // Active negotiation record (if inspecting an existing deal)
  const [activeNegotiationId, setActiveNegotiationId] = useState(null);
  const [negotiationRounds, setNegotiationRounds] = useState([]);

  // AI Evaluation State & Phase 4 Intelligence
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [customReply, setCustomReply] = useState('');
  const [roundNote, setRoundNote] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [selectedTone, setSelectedTone] = useState('relationship');
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [buyerProfile, setBuyerProfile] = useState(null);

  const toneOptions = [
    { id: 'relationship', label: 'Relationship', icon: '🤝', desc: 'Warm B2B trade & long-term volume' },
    { id: 'assertive', label: 'Assertive', icon: '🛡️', desc: 'Firm on margin & factory warranty' },
    { id: 'urgent', label: 'Urgent', icon: '⚡', desc: 'Fast deal & immediate hub dispatch' },
    { id: 'hinglish', label: 'Hinglish', icon: '🇮🇳', desc: 'Natural Indian wholesale idiom' },
  ];

  // Fetch products, customers, and active negotiations
  const loadData = async () => {
    try {
      setLoadingInitial(true);
      const [prods, custs, negs] = await Promise.all([
        productService.getProducts(),
        customerService.getCustomers(),
        negotiationService.getNegotiations()
      ]);

      setProducts(prods);
      setCustomers(custs);
      setNegotiationHistory(negs);

      // Preselect first product if available
      if (prods.length > 0) {
        setSelectedProductId(prods[1]?.id || prods[0]?.id); // Defaults to Samsung TV
        setOfferPrice(prods[1]?.preferredMinPrice || 58500);
      }

      if (preselectedCustomerId) {
        setSelectedCustomerId(preselectedCustomerId);
        fetchBuyerProfile(preselectedCustomerId);
      } else if (custs.length > 0) {
        setSelectedCustomerId(custs[0]?.id);
        fetchBuyerProfile(custs[0]?.id);
      }

      fetchAIStatus();

      // Check if there's a pre-existing negotiation for this customer & product
      if (negs.length > 0) {
        const matching = negs[0];
        setActiveNegotiationId(matching.id);
        setNegotiationRounds(matching.rounds || []);
      }
    } catch (err) {
      console.error('Failed to load initial negotiation data:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const fetchAIStatus = async () => {
    try {
      const data = await aiService.getStatus();
      setAiStatus(data);
    } catch (err) {
      console.warn('AI status load warning:', err.message);
    }
  };

  const fetchBuyerProfile = async (custId) => {
    if (!custId) {
      setBuyerProfile(null);
      return;
    }
    try {
      const prof = await aiService.getBuyerProfile(custId);
      setBuyerProfile(prof);
    } catch (err) {
      console.warn('Buyer profile load warning:', err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Trigger evaluation with tone support
  const handleEvaluate = async (e, toneToUse) => {
    if (e) e.preventDefault();
    if (!selectedProductId || !offerPrice) return;

    const tone = toneToUse || selectedTone;

    try {
      setEvaluating(true);
      setActionSuccess('');

      const result = await negotiationService.evaluateOffer({
        customerId: selectedCustomerId,
        productId: selectedProductId,
        offerPrice: Number(offerPrice),
        quantity: Number(quantity) || 1,
        currentRound: (negotiationRounds.length || 0) + 1,
        tone
      });

      setEvaluationResult(result);
      setCustomReply(result.suggestedReply);
    } catch (err) {
      alert("Evaluation failed: " + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  // Run evaluation automatically when product selection changes
  useEffect(() => {
    if (selectedProduct && offerPrice) {
      handleEvaluate();
    }
  }, [selectedProductId]);

  // Load existing negotiation into workspace
  const handleSelectExistingNegotiation = (neg) => {
    setActiveNegotiationId(neg.id);
    setSelectedCustomerId(neg.customerId || '');
    setSelectedProductId(neg.productId);
    setOfferPrice(neg.currentOffer);
    setQuantity(neg.quantity);
    setNegotiationRounds(neg.rounds || []);

    const matchingProd = products.find(p => p.id === neg.productId);
    if (matchingProd) {
      const grossMargin = Number((((neg.currentOffer - matchingProd.costPrice) / neg.currentOffer) * 100).toFixed(2));
      setEvaluationResult({
        recommendation: neg.recommendation,
        canApprove: neg.recommendation !== 'REJECT',
        suggestedCounterPrice: neg.currentOffer,
        reasoning: neg.reasoning,
        suggestedReply: neg.suggestedReply,
        aiMode: 'Saved Negotiation Session',
        isLiveAI: false,
        metrics: {
          grossProfit: neg.grossProfit,
          grossMargin: grossMargin,
          totalDealValue: neg.currentOffer * neg.quantity
        },
        boundaries: {
          costPrice: matchingProd.costPrice,
          absoluteLowerLimit: matchingProd.absoluteLowerLimit,
          preferredMinPrice: matchingProd.preferredMinPrice,
          targetPrice: matchingProd.targetPrice
        }
      });
      setCustomReply(neg.suggestedReply);
    }
  };

  // Save new round to negotiation
  const handleSaveRound = async () => {
    if (!selectedProduct || !evaluationResult) return;

    try {
      setEvaluating(true);
      const saved = await negotiationService.saveRound({
        negotiationId: activeNegotiationId,
        customerId: selectedCustomerId,
        customerName: selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.company})` : 'Retail Partner',
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: Number(quantity),
        costPrice: selectedProduct.costPrice,
        targetPrice: selectedProduct.targetPrice,
        preferredMinPrice: selectedProduct.preferredMinPrice,
        absoluteLowerLimit: selectedProduct.absoluteLowerLimit,
        currentOffer: Number(offerPrice),
        status: evaluationResult.recommendation === 'ACCEPT' ? 'Accepted' : 'Counter Offered',
        recommendation: evaluationResult.recommendation,
        grossProfit: evaluationResult.metrics.grossProfit,
        grossMargin: evaluationResult.metrics.grossMargin,
        reasoning: evaluationResult.reasoning,
        suggestedReply: customReply,
        roundNote: roundNote || `Recorded round at ₹${Number(offerPrice).toLocaleString()}`,
        roundSender: 'salesperson'
      });

      setActiveNegotiationId(saved.id);
      setNegotiationRounds(saved.rounds);
      setActionSuccess('Negotiation round successfully recorded in timeline!');
      setRoundNote('');

      // Refresh list
      const updatedList = await negotiationService.getNegotiations();
      setNegotiationHistory(updatedList);
    } catch (err) {
      alert("Failed to save negotiation round: " + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  // Approve deal
  const handleApproveDeal = async () => {
    if (!evaluationResult?.canApprove) {
      alert("This offer violates the absolute lower limit and cannot be approved.");
      return;
    }

    try {
      setEvaluating(true);
      if (activeNegotiationId) {
        await negotiationService.approveNegotiation(activeNegotiationId, Number(offerPrice));
      } else {
        await handleSaveRound();
      }
      setActionSuccess('Deal approved and authorized! Status updated to Accepted.');
    } catch (err) {
      alert("Approval failed: " + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-9 h-9 animate-spin text-brand-500 mb-3" />
        <p className="text-sm font-medium">Initializing AI negotiation workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-brand-400" />
              AI Negotiation Desk & Margin Guard
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Rule Guardrail Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time wholesale counter-offer suggestions powered by Gemini AI with hard mathematical floor constraints.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Settings / Model Configuration Button */}
          <button
            onClick={() => setIsAISettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-brand-500/50 text-slate-200 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>{aiStatus?.isLive ? 'Gemini 1.5 Live' : 'Demo Heuristics'}</span>
            <Settings className="w-3 h-3 text-slate-400 ml-1" />
          </button>

          {/* Existing Deals Quick Toggle */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-500 flex items-center gap-1 flex-shrink-0">
              <History className="w-3.5 h-3.5" /> Deals:
            </span>
            {negotiationHistory.slice(0, 3).map((neg) => (
              <button
                key={neg.id}
                onClick={() => handleSelectExistingNegotiation(neg)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex-shrink-0 truncate max-w-[150px] ${
                  activeNegotiationId === neg.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {neg.customerName.split(' ')[0]} • ₹{neg.currentOffer.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Grid (Left: Deal Inputs & Pricing Ladder, Center: AI Recommendation, Right: Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Deal Inputs & Price Boundaries (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-400" />
              1. Deal Parameters
            </h2>

            <form onSubmit={handleEvaluate} className="space-y-4">
              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Customer / Account</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border-slate-700 text-white"
                >
                  <option value="">Guest Retailer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''} — Budget: ₹{Number(c.budget).toLocaleString()}
                    </option>
                  ))}
                </select>
                {selectedCustomer && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Phone: {selectedCustomer.phone} • Status: {selectedCustomer.leadStatus}
                  </p>
                )}
              </div>

              {/* Product Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setSelectedProductId(pid);
                    const p = products.find(item => item.id === pid);
                    if (p) setOfferPrice(p.preferredMinPrice);
                  }}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border-slate-700 text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Customer Offer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Order Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Customer Offer (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 58500"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl font-mono text-white font-bold"
                  />
                </div>
              </div>

              {/* Tone Selection Chips */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                    AI Counter Strategy Tone
                  </span>
                  <span className="text-[10px] text-brand-400 font-mono capitalize">{selectedTone}</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {toneOptions.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTone(t.id);
                        if (selectedProductId && offerPrice) {
                          handleEvaluate(null, t.id);
                        }
                      }}
                      className={`p-2 rounded-xl text-[11px] text-left font-medium border transition-all ${
                        selectedTone === t.id
                          ? 'bg-brand-600/25 border-brand-500/60 text-white shadow-sm ring-1 ring-brand-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-semibold">
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </div>
                      <span className="block text-[9px] text-slate-400 font-normal mt-0.5 truncate">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={evaluating}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {evaluating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Running Pricing Guard...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    Evaluate Offer with AI Guard
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Pricing Boundaries Ladder Card */}
          {selectedProduct && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Product Guardrails
                </span>
                <span className="text-[10px] font-mono text-slate-400">SKU: {selectedProduct.sku}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400">Cost Price (Landing):</span>
                  <span className="font-mono font-bold text-slate-300">₹{selectedProduct.costPrice.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-rose-500/10 border border-rose-500/25">
                  <div>
                    <span className="text-rose-400 font-semibold block">Absolute Floor:</span>
                    <span className="text-[9px] text-rose-300/70">Never sell below</span>
                  </div>
                  <span className="font-mono font-bold text-rose-400">₹{selectedProduct.absoluteLowerLimit.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
                  <div>
                    <span className="text-amber-300 font-semibold block">Preferred Minimum:</span>
                    <span className="text-[9px] text-amber-300/70">Target minimum</span>
                  </div>
                  <span className="font-mono font-bold text-amber-300">₹{selectedProduct.preferredMinPrice.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                  <div>
                    <span className="text-emerald-400 font-semibold block">Target Price:</span>
                    <span className="text-[9px] text-emerald-300/70">Standard wholesale rate</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">₹{selectedProduct.targetPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Buyer Psychological Profile Card */}
          {buyerProfile && (
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Buyer Concession Profile
                </span>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/30">
                  {buyerProfile.buyerArchetype}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block">Price Elasticity:</span>
                  <span className="font-bold text-amber-300">{buyerProfile.priceElasticity}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block">Expected Rounds:</span>
                  <span className="font-bold text-slate-200">{buyerProfile.expectedConcessionRounds}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-200 leading-relaxed">
                <strong className="block text-indigo-300 mb-0.5">Closing Strategy:</strong>
                {buyerProfile.keyRecommendation}
              </div>
            </div>
          )}
        </div>

        {/* CENTER / RIGHT COLUMN: AI Evaluation & Response Desk (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {evaluationResult ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              {/* Recommendation Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${
                    evaluationResult.recommendation === 'ACCEPT'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : evaluationResult.recommendation === 'COUNTER'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {evaluationResult.recommendation === 'ACCEPT' && <Check className="w-6 h-6" />}
                    {evaluationResult.recommendation === 'COUNTER' && <Sliders className="w-6 h-6" />}
                    {evaluationResult.recommendation === 'REJECT' && <AlertTriangle className="w-6 h-6" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        System Recommendation:
                      </span>
                      <span className={`px-2.5 py-0.5 text-xs font-black rounded-full uppercase tracking-wider ${
                        evaluationResult.recommendation === 'ACCEPT'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : evaluationResult.recommendation === 'COUNTER'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}>
                        {evaluationResult.recommendation}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Offer: ₹{Number(offerPrice).toLocaleString()} / unit • Total Order: ₹{evaluationResult.metrics.totalDealValue.toLocaleString()} ({quantity} units)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border ${
                    evaluationResult.isLiveAI
                      ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                      : 'bg-brand-500/10 text-brand-300 border-brand-500/30'
                  }`}>
                    <Bot className="w-3.5 h-3.5 inline mr-1" />
                    {evaluationResult.aiMode}
                  </span>
                </div>
              </div>

              {/* Profit & Margin Metrics Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Expected Gross Profit</span>
                  <p className={`text-xl font-bold font-mono mt-1 ${
                    evaluationResult.metrics.grossProfit < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {evaluationResult.metrics.grossProfit < 0 ? `-₹${Math.abs(evaluationResult.metrics.grossProfit).toLocaleString()}` : `+₹${evaluationResult.metrics.grossProfit.toLocaleString()}`}
                  </p>
                  <span className="text-[10px] text-slate-500">Across {quantity} units</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Gross Margin %</span>
                  <p className={`text-xl font-bold font-mono mt-1 ${
                    evaluationResult.metrics.grossMargin < 0 ? 'text-rose-400' : 'text-indigo-300'
                  }`}>
                    {evaluationResult.metrics.grossMargin}%
                  </p>
                  <span className="text-[10px] text-slate-500">Target: {(((selectedProduct.targetPrice - selectedProduct.costPrice) / selectedProduct.targetPrice) * 100).toFixed(1)}%</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Suggested Counter</span>
                  <p className="text-xl font-bold font-mono text-amber-300 mt-1">
                    ₹{evaluationResult.suggestedCounterPrice.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-amber-400/80">Optimal margin capture</span>
                </div>
              </div>

              {/* Strategy & Tactical Deal Advice */}
              {evaluationResult.aiTactics && evaluationResult.aiTactics.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">AI Deal Tactics & Win Probability</span>
                    </div>
                    {evaluationResult.winProbability !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Estimated Win Likelihood:</span>
                        <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-md ${
                          evaluationResult.winProbability >= 70 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          evaluationResult.winProbability >= 40 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {evaluationResult.winProbability}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {evaluationResult.aiTactics.map((tactic, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-tight">{tactic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rationale Card */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <strong className="text-brand-300 block mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-brand-400" />
                  Strategy & Mathematical Rationale:
                </strong>
                <p className="text-slate-300 leading-relaxed">{evaluationResult.reasoning}</p>
              </div>

              {/* Editable Suggested Response */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-brand-400" />
                    Suggested Reply ({selectedTone} tone):
                  </label>
                  <span className="text-[10px] text-slate-400">Salesperson review required before sending</span>
                </div>

                <textarea
                  rows="3"
                  value={customReply}
                  onChange={(e) => setCustomReply(e.target.value)}
                  className="glass-input block w-full px-3.5 py-2.5 text-xs rounded-xl text-slate-200 leading-relaxed font-sans"
                />
              </div>

              {/* Alternative AI Counter Proposals */}
              {evaluationResult.alternativeReplies && evaluationResult.alternativeReplies.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                      Alternative AI Counter Variations (Click to swap):
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {evaluationResult.alternativeReplies.map((alt, i) => (
                      <div
                        key={i}
                        onClick={() => setCustomReply(alt)}
                        className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-brand-500/50 cursor-pointer transition-all text-xs text-slate-300 group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Variant {i === 0 ? 'A (Value Focus)' : 'B (Fast Closing)'}
                          </span>
                          <span className="text-[10px] text-brand-400 group-hover:underline">Use this →</span>
                        </div>
                        <p className="line-clamp-3 leading-relaxed text-slate-300 group-hover:text-white">
                          "{alt}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Round Internal Note */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Internal Round Note / Buyer Terms (e.g. "Customer promises 50% advance wire"):
                </label>
                <input
                  type="text"
                  placeholder="Optional round notes..."
                  value={roundNote}
                  onChange={(e) => setRoundNote(e.target.value)}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

              {/* Action Buttons Strip */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* Approve Deal Button */}
                  <button
                    onClick={handleApproveDeal}
                    disabled={!evaluationResult.canApprove || evaluating}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                      evaluationResult.canApprove
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {evaluationResult.canApprove ? "Approve Deal" : "Blocked by Floor Limit"}
                  </button>

                  {/* Save Round Button */}
                  <button
                    onClick={handleSaveRound}
                    disabled={evaluating}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-brand-400" />
                    Save Round to Timeline
                  </button>
                </div>

                {/* Send via WhatsApp */}
                <button
                  onClick={() => {
                    handleSaveRound();
                    navigate(`/conversations?customerId=${selectedCustomerId}&initialMsg=${encodeURIComponent(customReply)}`);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Send Counter via WhatsApp
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center">
              <Bot className="w-12 h-12 text-brand-400 mx-auto mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-white mb-1">Enter Customer Offer</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select a product and customer offer on the left to activate the AI deal advisor and profit calculations.
              </p>
            </div>
          )}

          {/* NEGOTIATION ROUNDS TIMELINE */}
          {negotiationRounds.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  Negotiation History Timeline ({negotiationRounds.length} Rounds)
                </h3>
                <span className="text-xs text-slate-400">Sequential audit log</span>
              </div>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {negotiationRounds.map((round, idx) => (
                  <div key={idx} className="relative pl-8 text-xs">
                    <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-brand-500 border-2 border-slate-900" />
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-white">
                          Round {round.roundNumber} • {round.sender === 'customer' ? 'Buyer Offer' : 'Sales Counter'}
                        </span>
                        <span className="text-slate-500 font-mono">
                          {round.timestamp ? new Date(round.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                        </span>
                      </div>
                      <p className="font-mono text-emerald-400 font-bold mb-1">
                        ₹{(round.offeredPrice || round.counterPrice || round.price || 0).toLocaleString()} ({round.quantity || quantity} units)
                      </p>
                      <p className="text-slate-300 italic">{round.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI SETTINGS MODAL */}
      <AISettingsModal
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
        onUpdated={() => {
          fetchAIStatus();
          handleEvaluate();
        }}
      />
    </div>
  );
};
