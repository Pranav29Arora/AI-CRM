import React, { useState, useEffect, useRef } from 'react';
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
  const preselectedProductId = searchParams.get('productId');

  // Catalogs
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [negotiationHistory, setNegotiationHistory] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form selections
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId || '');
  const [selectedProductId, setSelectedProductId] = useState(preselectedProductId || '');
  const [offerPrice, setOfferPrice] = useState('');
  const [quantity, setQuantity] = useState(1);

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

  // Sequence ref to prevent async race conditions
  const evalRequestIdRef = useRef(0);

  const toneOptions = [
    { id: 'relationship', label: 'Relationship', icon: '🤝', desc: 'Warm B2B trade & long-term volume' },
    { id: 'assertive', label: 'Assertive', icon: '🛡️', desc: 'Firm on margin & factory warranty' },
    { id: 'urgent', label: 'Urgent', icon: '⚡', desc: 'Fast deal & immediate hub dispatch' },
    { id: 'hinglish', label: 'Hinglish', icon: '🇮🇳', desc: 'Natural Indian wholesale idiom' },
  ];

  // Helper to extract clean array of interested products for a customer with explicit offered price
  const getCustomerInterestedProducts = (cust, prodsList = products) => {
    if (!cust) return [];
    let list = [];
    if (Array.isArray(cust.interestedProducts)) {
      list = cust.interestedProducts;
    } else if (typeof cust.interestedProducts === 'string' && cust.interestedProducts.trim()) {
      try {
        const parsed = JSON.parse(cust.interestedProducts);
        if (Array.isArray(parsed)) list = parsed;
        else list = [cust.interestedProducts.trim()];
      } catch {
        list = cust.interestedProducts.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(cust.selectedProducts)) {
      list = cust.selectedProducts;
    }

    const custBudget = Number(cust.budget) || 0;

    return list.map(item => {
      if (typeof item === 'object' && item !== null) {
        const catalogMatch = prodsList.find(p => 
          (item.id && p.id === item.id) ||
          (item.productId && p.id === item.productId) ||
          (item.sku && p.sku && item.sku.toLowerCase() === p.sku.toLowerCase()) ||
          (item.name && p.name.toLowerCase() === item.name.toLowerCase()) ||
          (item.name && (p.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(p.name.toLowerCase())))
        );
        const catalogPrice = Number(item.sellingPrice || catalogMatch?.targetPrice || catalogMatch?.preferredMinPrice || 0);
        // Explicit offered price if stored on item
        const explicitOffer = Number(item.offeredPrice || item.offerPrice || 0);
        // Customer offer: explicitOffer > customer budget > catalog preferred min
        const customerOffer = explicitOffer > 0 
          ? explicitOffer 
          : (custBudget > 0 ? custBudget : (catalogMatch ? Number(catalogMatch.preferredMinPrice) : catalogPrice));
        const explicitQty = Number(item.quantity || item.qty || 1);

        const resolvedId = catalogMatch ? catalogMatch.id : (item.id || item.productId || '');
        const resolvedName = catalogMatch ? catalogMatch.name : (item.name || 'Catalog Product');

        return {
          id: resolvedId,
          name: resolvedName,
          sellingPrice: catalogPrice,
          offeredPrice: customerOffer,
          offerPrice: customerOffer,
          quantity: explicitQty > 0 ? explicitQty : 1,
          sku: catalogMatch ? catalogMatch.sku : (item.sku || ''),
          category: catalogMatch ? catalogMatch.category : (item.category || '')
        };
      }
      const str = String(item || '').trim();
      const catalogMatch = prodsList.find(p => p.id === str || p.name.toLowerCase() === str.toLowerCase() || p.name.toLowerCase().includes(str.toLowerCase()));
      const catalogPrice = Number(catalogMatch?.targetPrice || catalogMatch?.preferredMinPrice || 0);
      const customerOffer = custBudget > 0 
        ? custBudget 
        : (catalogMatch ? Number(catalogMatch.preferredMinPrice) : catalogPrice);

      return {
        id: catalogMatch?.id || '',
        name: catalogMatch?.name || str,
        sellingPrice: catalogPrice,
        offeredPrice: customerOffer,
        offerPrice: customerOffer,
        quantity: 1,
        sku: catalogMatch?.sku || '',
        category: catalogMatch?.category || ''
      };
    });
  };

  // Synchronous, zero-delay evaluation for instant mathematical metrics
  const computeLocalEvaluation = (product, offer, qty) => {
    if (!product || !offer || Number(offer) <= 0) return null;
    const cp = Number(product.costPrice) || 0;
    const sp = Number(offer) || 0;
    const q = Math.max(1, Number(qty) || 1);
    const floor = Number(product.absoluteLowerLimit) || 0;
    const pref = Number(product.preferredMinPrice) || 0;
    const target = Number(product.targetPrice) || 0;

    const grossProfit = (sp - cp) * q;
    const grossMargin = sp > 0 ? Number((((sp - cp) / sp) * 100).toFixed(2)) : 0;
    const totalDealValue = sp * q;

    let recommendation = 'COUNTER';
    let canApprove = false;
    let suggestedCounterPrice = pref;
    let reasoning = '';

    if (sp < floor) {
      recommendation = 'REJECT';
      canApprove = false;
      suggestedCounterPrice = pref;
      reasoning = `Customer offer of ₹${sp.toLocaleString()} is strictly BELOW the absolute floor of ₹${floor.toLocaleString()} (Cost: ₹${cp.toLocaleString()}). Selling below floor violates margin guardrails and risks negative profit. Firm rejection required.`;
    } else if (sp >= floor && sp < pref) {
      recommendation = 'COUNTER';
      canApprove = true;
      suggestedCounterPrice = Math.round((sp + pref * 2) / 3 / 100) * 100;
      if (suggestedCounterPrice < floor) suggestedCounterPrice = floor;
      reasoning = `Customer offer of ₹${sp.toLocaleString()} is above absolute floor (₹${floor.toLocaleString()}), generating ₹${grossProfit.toLocaleString()} gross profit (${grossMargin}% margin). However, it is below preferred minimum of ₹${pref.toLocaleString()}. First attempt to counter at ₹${suggestedCounterPrice.toLocaleString()} before accepting lower margin.`;
    } else {
      recommendation = 'ACCEPT';
      canApprove = true;
      suggestedCounterPrice = sp;
      reasoning = `Customer offer of ₹${sp.toLocaleString()} meets or exceeds preferred target (₹${pref.toLocaleString()}). Expected lot gross profit is ₹${grossProfit.toLocaleString()} (${grossMargin}% margin). Excellent wholesale return — recommend instant acceptance.`;
    }

    return {
      recommendation,
      canApprove,
      suggestedCounterPrice,
      reasoning,
      metrics: {
        grossProfit,
        grossMargin,
        totalDealValue
      },
      boundaries: {
        costPrice: cp,
        absoluteLowerLimit: floor,
        preferredMinPrice: pref,
        targetPrice: target
      }
    };
  };

  // Direct evaluation invoker with instant local calculation & sequence guard
  const handleEvaluateDirect = async ({ customerId, productId, offerPrice: evalOffer, quantity: evalQty, toneToUse }) => {
    const pId = productId || selectedProductId;
    const offPr = evalOffer !== undefined ? evalOffer : offerPrice;
    if (!pId || !offPr || Number(offPr) <= 0) return;

    const prod = products.find(p => p.id === pId);
    const q = Number(evalQty || quantity) || 1;

    // Apply immediate local evaluation so metrics, margin, profit and recommendation update in 0ms!
    if (prod) {
      const localEval = computeLocalEvaluation(prod, offPr, q);
      if (localEval) {
        setEvaluationResult(prev => ({
          ...(prev || {}),
          ...localEval,
          aiMode: prev?.aiMode || 'AI Margin Guard Active',
          isLiveAI: prev?.isLiveAI || false
        }));
      }
    }

    const currentReqId = ++evalRequestIdRef.current;
    const tone = toneToUse || selectedTone;

    try {
      setEvaluating(true);
      setActionSuccess('');

      const result = await negotiationService.evaluateOffer({
        customerId: customerId !== undefined ? customerId : selectedCustomerId,
        productId: pId,
        offerPrice: Number(offPr),
        quantity: q,
        currentRound: (negotiationRounds.length || 0) + 1,
        tone
      });

      // Ignore if a newer request came in while this was resolving
      if (currentReqId !== evalRequestIdRef.current) return;

      setEvaluationResult(result);
      setCustomReply(result.suggestedReply);
    } catch (err) {
      if (currentReqId === evalRequestIdRef.current) {
        console.warn("Evaluation direct notice:", err.message);
      }
    } finally {
      if (currentReqId === evalRequestIdRef.current) {
        setEvaluating(false);
      }
    }
  };

  // Dedicated customer selection handler with auto-fill of interested product and exact customer offer price
  const handleCustomerSelect = async (customerId, specificProductId = null, custsList = customers, prodsList = products, negsList = negotiationHistory) => {
    setSelectedCustomerId(customerId);

    if (!customerId) {
      setBuyerProfile(null);
      if (prodsList.length > 0) {
        const prod = specificProductId ? prodsList.find(p => p.id === specificProductId) || prodsList[0] : prodsList[0];
        setSelectedProductId(prod.id);
        setOfferPrice(prod.preferredMinPrice);
        handleEvaluateDirect({ customerId: '', productId: prod.id, offerPrice: prod.preferredMinPrice, quantity });
      }
      return;
    }

    fetchBuyerProfile(customerId);

    const cust = custsList.find(c => c.id === customerId);
    if (!cust) return;

    // Extract interested products list
    const interestedItems = getCustomerInterestedProducts(cust, prodsList);

    // Determine target product
    let targetProduct = null;
    let targetOffer = null;
    let targetQty = 1;

    if (specificProductId) {
      targetProduct = prodsList.find(p => p.id === specificProductId);
      // Check if this product is in the customer's interested items to get its specific offer and quantity
      const specificInterest = interestedItems.find(item => 
        item.id === specificProductId || 
        (targetProduct && item.name?.toLowerCase() === targetProduct.name?.toLowerCase())
      );
      if (specificInterest) {
        if (specificInterest.offeredPrice > 0) targetOffer = specificInterest.offeredPrice;
        if (specificInterest.quantity > 0) targetQty = specificInterest.quantity;
      }
    }

    // Match from customer's interested products
    if (!targetProduct && interestedItems.length > 0) {
      const firstInterest = interestedItems[0];
      targetProduct = prodsList.find(p => 
        (firstInterest.id && p.id === firstInterest.id) ||
        (firstInterest.sku && p.sku && firstInterest.sku.toLowerCase() === p.sku.toLowerCase()) ||
        (firstInterest.name && p.name.toLowerCase() === firstInterest.name.toLowerCase()) ||
        (firstInterest.name && (p.name.toLowerCase().includes(firstInterest.name.toLowerCase()) || firstInterest.name.toLowerCase().includes(p.name.toLowerCase())))
      );

      // Customer's explicit offered price from interested item
      if (firstInterest.offeredPrice > 0) {
        targetOffer = firstInterest.offeredPrice;
      }
      // Customer's required quantity from interested item
      if (firstInterest.quantity > 0) {
        targetQty = firstInterest.quantity;
      }
    }

    // Check if there is an existing negotiation for this customer
    const existingNeg = negsList.find(n => n.customerId === customerId);

    // If still no target product, but existing negotiation exists
    if (!targetProduct && existingNeg) {
      targetProduct = prodsList.find(p => p.id === existingNeg.productId);
      if (existingNeg.currentOffer > 0) targetOffer = existingNeg.currentOffer;
      if (existingNeg.quantity > 0) targetQty = existingNeg.quantity;
    }

    // Fallback product if still none (default to first catalog SKU, never stale product from previous customer)
    if (!targetProduct && prodsList.length > 0) {
      targetProduct = prodsList[0];
    }

    // Determine active negotiation matching customer AND target product
    const matchingNeg = negsList.find(n => n.customerId === customerId && targetProduct && n.productId === targetProduct.id);
    if (matchingNeg) {
      setActiveNegotiationId(matchingNeg.id);
      setNegotiationRounds(matchingNeg.rounds || []);
    } else {
      setActiveNegotiationId(null);
      setNegotiationRounds([]);
    }

    // Determine offer price from customer budget or product floor if not set
    if (targetProduct) {
      if (!targetOffer || targetOffer <= 0) {
        const custBudget = Number(cust.budget) || 0;
        if (custBudget > 0) {
          targetOffer = custBudget;
        } else if (existingNeg && existingNeg.currentOffer > 0) {
          targetOffer = existingNeg.currentOffer;
        } else {
          targetOffer = targetProduct.preferredMinPrice || targetProduct.targetPrice;
        }
      }

      setSelectedProductId(targetProduct.id);
      setOfferPrice(targetOffer);
      setQuantity(targetQty);

      // Trigger automatic AI evaluation with exact customer offer
      handleEvaluateDirect({
        customerId,
        productId: targetProduct.id,
        offerPrice: targetOffer,
        quantity: targetQty
      });
    }
  };

  // Switch to an interested product item
  const handleSelectInterestedProductItem = (item) => {
    const matched = products.find(p => 
      (item.id && p.id === item.id) ||
      (item.sku && p.sku && item.sku.toLowerCase() === p.sku.toLowerCase()) ||
      (item.name && p.name.toLowerCase() === item.name.toLowerCase()) ||
      (item.name && (p.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(p.name.toLowerCase())))
    );

    if (matched) {
      const offer = item.offeredPrice > 0 
        ? item.offeredPrice 
        : (Number(selectedCustomer?.budget) > 0 ? Number(selectedCustomer.budget) : (matched.preferredMinPrice || matched.targetPrice));
      const itemQty = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
      setSelectedProductId(matched.id);
      setOfferPrice(offer);
      setQuantity(itemQty);

      const matchingNeg = negotiationHistory.find(n => n.customerId === selectedCustomerId && n.productId === matched.id);
      if (matchingNeg) {
        setActiveNegotiationId(matchingNeg.id);
        setNegotiationRounds(matchingNeg.rounds || []);
      } else {
        setActiveNegotiationId(null);
        setNegotiationRounds([]);
      }

      handleEvaluateDirect({
        customerId: selectedCustomerId,
        productId: matched.id,
        offerPrice: offer,
        quantity: itemQty
      });
    }
  };

  // Dedicated product change handler for Select Product dropdown
  const handleProductChange = (productId) => {
    setSelectedProductId(productId);
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    // Check if there is an active negotiation for this customer and this product
    const matchingNeg = negotiationHistory.find(n => n.customerId === selectedCustomerId && n.productId === productId);
    if (matchingNeg) {
      setActiveNegotiationId(matchingNeg.id);
      setNegotiationRounds(matchingNeg.rounds || []);
    } else {
      setActiveNegotiationId(null);
      setNegotiationRounds([]);
    }

    // Check if this product is one of the customer's interested items
    const interestMatch = customerInterestedProducts.find(item =>
      (item.id && item.id === prod.id) ||
      (item.sku && prod.sku && item.sku.toLowerCase() === prod.sku.toLowerCase()) ||
      (item.name && item.name.toLowerCase() === prod.name.toLowerCase()) ||
      (item.name && (prod.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(prod.name.toLowerCase())))
    );

    let newOffer = prod.preferredMinPrice || prod.targetPrice;
    let newQty = 1;

    if (interestMatch) {
      if (interestMatch.offeredPrice > 0) newOffer = interestMatch.offeredPrice;
      else if (Number(selectedCustomer?.budget) > 0) newOffer = Number(selectedCustomer.budget);
      if (interestMatch.quantity > 0) newQty = interestMatch.quantity;
    }

    setOfferPrice(newOffer);
    setQuantity(newQty);
    handleEvaluateDirect({
      customerId: selectedCustomerId,
      productId: prod.id,
      offerPrice: newOffer,
      quantity: newQty
    });
  };

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

      fetchAIStatus();

      // Automatically select customer and auto-populate interested product & offer price
      if (preselectedCustomerId) {
        handleCustomerSelect(preselectedCustomerId, preselectedProductId, custs, prods, negs);
      } else if (custs.length > 0) {
        handleCustomerSelect(custs[0]?.id, preselectedProductId, custs, prods, negs);
      } else if (prods.length > 0) {
        const targetProd = (preselectedProductId && prods.find(p => p.id === preselectedProductId)) || prods[0];
        if (targetProd) {
          setSelectedProductId(targetProd.id);
          setOfferPrice(targetProd.preferredMinPrice || targetProd.targetPrice);
          handleEvaluateDirect({
            customerId: '',
            productId: targetProd.id,
            offerPrice: targetProd.preferredMinPrice || targetProd.targetPrice,
            quantity: 1
          });
        }
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
  const customerInterestedProducts = getCustomerInterestedProducts(selectedCustomer);

  // Trigger evaluation with tone support
  const handleEvaluate = async (e, toneToUse) => {
    if (e) e.preventDefault();
    if (!selectedProductId || !offerPrice) return;
    handleEvaluateDirect({
      customerId: selectedCustomerId,
      productId: selectedProductId,
      offerPrice: Number(offerPrice),
      quantity: Number(quantity) || 1,
      toneToUse
    });
  };

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

            {products.length === 0 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                <span>Catalog is empty. Add products to test the AI Pricing Guard.</span>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg ml-2 flex-shrink-0"
                >
                  + Add Product
                </button>
              </div>
            )}

            <form onSubmit={handleEvaluate} className="space-y-4">
              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Customer / Account</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border-slate-700 text-white"
                >
                  <option value="">Guest Retailer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''} — Budget: ₹{Number(c.budget || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
                {selectedCustomer && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Phone: {selectedCustomer.phone || 'N/A'} • Status: {selectedCustomer.leadStatus || 'Active'}
                  </p>
                )}

                {/* Customer's Interested Products Quick Selector */}
                {customerInterestedProducts.length > 0 && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-brand-500/30">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                        Interested Products ({customerInterestedProducts.length}):
                      </span>
                      <span className="text-[10px] text-brand-400 font-medium">Click to load rate</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {customerInterestedProducts.map((item, idx) => {
                        const isSelected = selectedProduct && (
                          (item.id && selectedProduct.id === item.id) ||
                          selectedProduct.name.toLowerCase() === (item.name || '').toLowerCase()
                        );
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectInterestedProductItem(item)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 ring-1 ring-brand-400'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                            }`}
                          >
                            <Package className="w-3 h-3 text-brand-300" />
                            <span>{item.name}</span>
                            <span className="font-mono text-[10px] bg-slate-950/70 px-1.5 py-0.2 rounded text-slate-300 border border-slate-700">
                              Qty: {item.quantity || 1}
                            </span>
                            {item.offeredPrice > 0 ? (
                              <span className="font-mono text-[10px] bg-slate-950/60 px-1.5 py-0.5 rounded text-amber-300 font-bold border border-amber-500/30">
                                Offer: ₹{Number(item.offeredPrice).toLocaleString()}
                              </span>
                            ) : item.sellingPrice > 0 ? (
                              <span className="font-mono text-[10px] bg-slate-950/60 px-1.5 py-0.5 rounded text-emerald-300 font-bold">
                                Catalog: ₹{Number(item.sellingPrice).toLocaleString()}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  disabled={products.length === 0}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border-slate-700 text-white disabled:opacity-60"
                >
                  {products.length === 0 ? (
                    <option value="">No products in catalog — add a product first</option>
                  ) : (() => {
                    const matchedInterested = customerInterestedProducts.reduce((acc, item) => {
                      const p = products.find(prod =>
                        (item.id && prod.id === item.id) ||
                        (item.sku && prod.sku && item.sku.toLowerCase() === prod.sku.toLowerCase()) ||
                        (prod.name.toLowerCase() === (item.name || '').toLowerCase()) ||
                        (item.name && (prod.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(prod.name.toLowerCase())))
                      );
                      if (p && !acc.some(x => x.prod.id === p.id)) {
                        acc.push({ prod: p, item });
                      }
                      return acc;
                    }, []);

                    const otherProducts = products.filter(p => !matchedInterested.some(x => x.prod.id === p.id));

                    return (
                      <>
                        {matchedInterested.length > 0 && (
                          <optgroup label="★ Customer's Inquired Products">
                            {matchedInterested.map(({ prod: p, item }) => (
                              <option key={`int-${p.id}`} value={p.id}>
                                ★ {p.name} (Inquiry Offer: ₹{Number(item.offeredPrice).toLocaleString()} • Qty: {item.quantity || 1})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label={matchedInterested.length > 0 ? "All Other Catalog SKUs" : "Catalog SKUs"}>
                          {otherProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {p.stock}) — Target: ₹{Number(p.targetPrice || p.preferredMinPrice).toLocaleString()}
                            </option>
                          ))}
                        </optgroup>
                      </>
                    );
                  })()}
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
                    onChange={(e) => {
                      const newQty = Math.max(1, Number(e.target.value));
                      setQuantity(newQty);
                      if (selectedProductId && offerPrice) {
                        handleEvaluateDirect({
                          customerId: selectedCustomerId,
                          productId: selectedProductId,
                          offerPrice,
                          quantity: newQty
                        });
                      }
                    }}
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
                    onChange={(e) => {
                      const newOffer = e.target.value;
                      setOfferPrice(newOffer);
                      if (selectedProductId && Number(newOffer) > 0) {
                        handleEvaluateDirect({
                          customerId: selectedCustomerId,
                          productId: selectedProductId,
                          offerPrice: newOffer,
                          quantity
                        });
                      }
                    }}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl font-mono text-white font-bold"
                  />
                  {selectedProduct && (
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      <span className="text-[9px] text-slate-500 font-semibold uppercase">Quick Test:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setOfferPrice(selectedProduct.costPrice);
                          handleEvaluateDirect({
                            customerId: selectedCustomerId,
                            productId: selectedProduct.id,
                            offerPrice: selectedProduct.costPrice,
                            quantity
                          });
                        }}
                        className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
                        title="Test Floor Breach (< Floor)"
                      >
                        Cost
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOfferPrice(selectedProduct.absoluteLowerLimit);
                          handleEvaluateDirect({
                            customerId: selectedCustomerId,
                            productId: selectedProduct.id,
                            offerPrice: selectedProduct.absoluteLowerLimit,
                            quantity
                          });
                        }}
                        className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                        title="Test Exact Absolute Floor Limit"
                      >
                        Floor
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOfferPrice(selectedProduct.preferredMinPrice);
                          handleEvaluateDirect({
                            customerId: selectedCustomerId,
                            productId: selectedProduct.id,
                            offerPrice: selectedProduct.preferredMinPrice,
                            quantity
                          });
                        }}
                        className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                        title="Test Preferred Minimum"
                      >
                        Pref Min
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOfferPrice(selectedProduct.targetPrice);
                          handleEvaluateDirect({
                            customerId: selectedCustomerId,
                            productId: selectedProduct.id,
                            offerPrice: selectedProduct.targetPrice,
                            quantity
                          });
                        }}
                        className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-brand-500/10 text-brand-300 border border-brand-500/30 hover:bg-brand-500/20 transition-colors"
                        title="Test Full Target Price"
                      >
                        Target
                      </button>
                    </div>
                  )}
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
                disabled={evaluating || products.length === 0}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {evaluating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Running Pricing Guard...
                  </>
                ) : products.length === 0 ? (
                  <>
                    <Package className="w-4 h-4" />
                    Add Products to Enable Evaluation
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
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Product Margin Guardrails
                </span>
                <span className="text-[10px] font-mono text-slate-400">SKU: {selectedProduct.sku}</span>
              </div>

              {/* Dynamic Live Ladder Status Badge */}
              {offerPrice && (
                <div className="p-2.5 rounded-xl text-center text-xs font-bold font-mono transition-all border">
                  {Number(offerPrice) < Number(selectedProduct.absoluteLowerLimit) ? (
                    <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-2 rounded-lg flex items-center justify-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Offer ₹{Number(offerPrice).toLocaleString()} &lt; Floor ₹{Number(selectedProduct.absoluteLowerLimit).toLocaleString()} (Hard Reject)</span>
                    </div>
                  ) : Number(offerPrice) < Number(selectedProduct.preferredMinPrice) ? (
                    <div className="bg-amber-500/15 border border-amber-500/30 text-amber-300 p-2 rounded-lg flex items-center justify-center gap-1.5">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      <span>Offer ₹{Number(offerPrice).toLocaleString()} in Counter Range</span>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-2 rounded-lg flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Offer ₹{Number(offerPrice).toLocaleString()} ≥ Preferred (Acceptable)</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 font-medium">Cost Price (Base):</span>
                  <span className="font-mono font-bold text-slate-300">₹{Number(selectedProduct.costPrice || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
                  <div>
                    <span className="text-rose-400 font-bold block">Absolute Floor:</span>
                    <span className="text-[10px] text-rose-300/70">Never sell below</span>
                  </div>
                  <span className="font-mono font-bold text-rose-400 text-sm">₹{Number(selectedProduct.absoluteLowerLimit || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                  <div>
                    <span className="text-amber-300 font-bold block">Preferred Minimum:</span>
                    <span className="text-[10px] text-amber-300/70">Target minimum rate</span>
                  </div>
                  <span className="font-mono font-bold text-amber-300 text-sm">₹{Number(selectedProduct.preferredMinPrice || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                  <div>
                    <span className="text-emerald-400 font-bold block">Target Price:</span>
                    <span className="text-[10px] text-emerald-300/70">Standard wholesale catalog</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm">₹{Number(selectedProduct.targetPrice || 0).toLocaleString()}</span>
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
            <div className={`glass-panel p-6 rounded-3xl border transition-all duration-300 space-y-6 ${
              evaluationResult.recommendation === 'ACCEPT'
                ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 via-slate-900/95 to-slate-900/90 shadow-[0_0_35px_rgba(16,185,129,0.12)]'
                : evaluationResult.recommendation === 'COUNTER'
                ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-slate-900/95 to-slate-900/90 shadow-[0_0_35px_rgba(245,158,11,0.12)]'
                : 'border-rose-500/40 bg-gradient-to-b from-rose-950/20 via-slate-900/95 to-slate-900/90 shadow-[0_0_35px_rgba(244,63,94,0.12)]'
            }`}>
              {/* Recommendation Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
                <div className="flex items-center gap-3.5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl transition-transform hover:scale-105 ${
                    evaluationResult.recommendation === 'ACCEPT'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/20'
                      : evaluationResult.recommendation === 'COUNTER'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-amber-500/20'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-500/20'
                  }`}>
                    {evaluationResult.recommendation === 'ACCEPT' && <Check className="w-7 h-7 stroke-[2.5]" />}
                    {evaluationResult.recommendation === 'COUNTER' && <Sliders className="w-7 h-7 stroke-[2.5]" />}
                    {evaluationResult.recommendation === 'REJECT' && <AlertTriangle className="w-7 h-7 stroke-[2.5]" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        System Recommendation:
                      </span>
                      <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider shadow-sm ${
                        evaluationResult.recommendation === 'ACCEPT'
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-emerald-500/20'
                          : evaluationResult.recommendation === 'COUNTER'
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-amber-500/20'
                          : 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-rose-500/20'
                      }`}>
                        {evaluationResult.recommendation}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-medium">
                      Offer: <span className="font-mono font-bold text-white">₹{Number(offerPrice).toLocaleString()}</span> / unit • Total Order: <span className="font-mono font-bold text-white">₹{evaluationResult.metrics.totalDealValue.toLocaleString()}</span> ({quantity} units)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 ${
                    evaluationResult.isLiveAI
                      ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-sm'
                      : 'bg-brand-500/15 text-brand-300 border-brand-500/40 shadow-sm'
                  }`}>
                    <Bot className="w-4 h-4" />
                    <span>{evaluationResult.aiMode}</span>
                  </span>
                </div>
              </div>

              {/* Profit & Margin Metrics Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-sm">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Expected Gross Profit</span>
                  <p className={`text-2xl font-black font-mono mt-1 ${
                    evaluationResult.metrics.grossProfit < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {evaluationResult.metrics.grossProfit < 0 ? `-₹${Math.abs(evaluationResult.metrics.grossProfit).toLocaleString()}` : `+₹${evaluationResult.metrics.grossProfit.toLocaleString()}`}
                  </p>
                  <span className="text-[11px] text-slate-500">
                    Across {quantity} units (₹{Math.round(evaluationResult.metrics.grossProfit / (quantity || 1)).toLocaleString()}/unit)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-sm">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Gross Margin %</span>
                  <p className={`text-2xl font-black font-mono mt-1 ${
                    evaluationResult.metrics.grossMargin < 0 ? 'text-rose-400' : 'text-indigo-300'
                  }`}>
                    {evaluationResult.metrics.grossMargin}%
                  </p>
                  <span className="text-[11px] text-slate-500">
                    Target Margin: {selectedProduct && Number(selectedProduct.targetPrice) > 0 ? (((Number(selectedProduct.targetPrice) - Number(selectedProduct.costPrice)) / Number(selectedProduct.targetPrice)) * 100).toFixed(1) : 0}%
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-sm">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Suggested Counter</span>
                  <p className="text-2xl font-black font-mono text-amber-300 mt-1">
                    ₹{Number(evaluationResult.suggestedCounterPrice).toLocaleString()}
                  </p>
                  <span className="text-[11px] text-amber-400/90 font-medium">Optimal margin capture</span>
                </div>
              </div>

              {/* Strategy & Tactical Deal Advice */}
              {evaluationResult.aiTactics && evaluationResult.aiTactics.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">AI Deal Tactics & Win Probability</span>
                    </div>
                    {evaluationResult.winProbability !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Estimated Win Likelihood:</span>
                        <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg border ${
                          evaluationResult.winProbability >= 70 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          evaluationResult.winProbability >= 40 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {evaluationResult.winProbability}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {evaluationResult.aiTactics.map((tactic, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-snug">{tactic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rationale Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
                <strong className="text-brand-300 block mb-1.5 flex items-center gap-1.5 font-bold uppercase tracking-wider">
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
                  <span className="text-[10px] text-slate-400 font-medium">Salesperson review required before sending</span>
                </div>

                <textarea
                  rows="3"
                  value={customReply}
                  onChange={(e) => setCustomReply(e.target.value)}
                  className="glass-input block w-full px-4 py-3 text-xs rounded-2xl text-slate-200 leading-relaxed font-sans"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {evaluationResult.alternativeReplies.map((alt, i) => (
                      <div
                        key={i}
                        onClick={() => setCustomReply(alt)}
                        className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-brand-500/50 cursor-pointer transition-all text-xs text-slate-300 group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Variant {i === 0 ? 'A (Value Focus)' : 'B (Fast Closing)'}
                          </span>
                          <span className="text-[10px] text-brand-400 group-hover:underline font-semibold">Use this →</span>
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
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Internal Round Note / Buyer Terms (e.g. "Customer promises 50% advance wire"):
                </label>
                <input
                  type="text"
                  placeholder="Optional round notes..."
                  value={roundNote}
                  onChange={(e) => setRoundNote(e.target.value)}
                  className="glass-input block w-full px-3.5 py-2.5 text-xs rounded-xl"
                />
              </div>

              {/* Action Buttons Strip */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {/* Approve Deal Button */}
                  <button
                    onClick={handleApproveDeal}
                    disabled={!evaluationResult.canApprove || evaluating}
                    className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                      evaluationResult.canApprove
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25'
                        : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/60'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    {evaluationResult.canApprove ? "Approve Deal" : "Blocked by Floor Limit"}
                  </button>

                  {/* Save Round Button */}
                  <button
                    onClick={handleSaveRound}
                    disabled={evaluating}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-brand-400" />
                    Save Round to Timeline
                  </button>
                </div>

                {/* Send via WhatsApp */}
                <button
                  onClick={() => {
                    handleSaveRound();
                    navigate(`/conversations?customerId=${selectedCustomerId}&initialMsg=${encodeURIComponent(customReply)}`);
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send Counter via WhatsApp
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-3xl border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/10 animate-pulse">
                <Bot className="w-8 h-8" />
              </div>
              <div className="max-w-sm mx-auto">
                <h3 className="text-base font-bold text-white mb-1.5">Enter Customer Offer</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select a product and specify an offer price on the left to activate the AI Margin Guard, win probability calculations, and counter-offer drafting.
                </p>
              </div>
            </div>
          )}

          {/* NEGOTIATION ROUNDS TIMELINE */}
          {negotiationRounds.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  Negotiation Audit Trail ({negotiationRounds.length} Rounds)
                </h3>
                <span className="text-xs text-slate-400 font-mono">Sequential Round Log</span>
              </div>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {negotiationRounds.map((round, idx) => (
                  <div key={idx} className="relative pl-8 text-xs">
                    <div className="absolute left-2 top-2.5 w-3.5 h-3.5 rounded-full bg-brand-500 border-2 border-slate-900 ring-2 ring-brand-500/30" />
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          Round {round.roundNumber} • <span className={round.sender === 'customer' ? 'text-amber-400' : 'text-brand-300'}>{round.sender === 'customer' ? 'Buyer Offer' : 'Sales Counter'}</span>
                        </span>
                        <span className="text-slate-500 font-mono">
                          {round.timestamp ? new Date(round.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                        </span>
                      </div>
                      <p className="font-mono text-emerald-400 font-bold text-sm">
                        ₹{(round.offeredPrice || round.counterPrice || round.price || 0).toLocaleString()} ({round.quantity || quantity} units)
                      </p>
                      <p className="text-slate-300 italic text-[11px]">{round.note}</p>
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
