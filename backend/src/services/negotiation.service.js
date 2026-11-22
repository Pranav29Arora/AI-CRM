import { dataService } from './data.service.js';
import { aiService } from './ai.service.js';

/**
 * NegotiationService - Pricing Rule Guardrail & AI Strategy Engine.
 *
 * CRITICAL RULE: Backend pricing math is strictly isolated.
 * Gemini or Demo AI generates natural language explanations and messages,
 * but can NEVER override floor constraints or authorize sub-floor deals.
 */

class NegotiationService {
  calculatePricingMetrics({ costPrice, sellingPrice, quantity = 1 }) {
    const cp = Number(costPrice) || 0;
    const sp = Number(sellingPrice) || 0;
    const qty = Math.max(1, Number(quantity) || 1);

    const grossProfit = (sp - cp) * qty;
    const grossMargin = sp > 0 ? ((sp - cp) / sp) * 100 : 0;

    return {
      grossProfit: Math.round(grossProfit),
      grossMargin: Number(grossMargin.toFixed(2)),
      totalDealValue: sp * qty
    };
  }

  evaluateBoundaries(product, offerPrice, quantity = 1, currentRound = 1) {
    const offer = Number(offerPrice) || 0;
    const cp = Number(product.costPrice) || 0;
    const floor = Number(product.absoluteLowerLimit) || 0;
    const pref = Number(product.preferredMinPrice) || 0;
    const target = Number(product.targetPrice) || 0;
    const qty = Math.max(1, Number(quantity) || 1);
    const round = Math.max(1, Number(currentRound) || 1);

    const metrics = this.calculatePricingMetrics({
      costPrice: cp,
      sellingPrice: offer,
      quantity: qty
    });

    let recommendation = 'COUNTER';
    let canApprove = false;
    let suggestedCounterPrice = pref;
    let reasoning = '';

    if (offer < floor) {
      recommendation = 'REJECT';
      canApprove = false;
      // On Round 1, anchor firmly at exact target catalog rate; on later rounds, hold at preferred baseline
      suggestedCounterPrice = round <= 1 ? target : pref;
      reasoning = `Customer offer of ₹${offer.toLocaleString()} is strictly BELOW the absolute lower limit of ₹${floor.toLocaleString()} (Cost: ₹${cp.toLocaleString()}). Selling below absolute floor violates margin guardrails and risks negative profit. Firm rejection required.`;
    } else if (offer >= floor && offer < pref) {
      recommendation = 'COUNTER';
      // Permitted to approve ONLY after extensive rounds (Round 4+) if buyer stands firm above floor
      canApprove = round >= 4;
      if (round <= 1) {
        // Round 1: Firmly anchor at the exact target catalog rate first
        suggestedCounterPrice = target;
        reasoning = `Customer offer of ₹${offer.toLocaleString()} is below preferred baseline of ₹${pref.toLocaleString()} (Gross Profit: ₹${metrics.grossProfit.toLocaleString()}, ${metrics.grossMargin}% margin). Round 1: Anchor firmly at exact target catalog rate of ₹${target.toLocaleString()} before considering concessions.`;
      } else if (round === 2) {
        // Round 2: Defend margin corridor, retaining upper band above preferred
        suggestedCounterPrice = Math.round((pref * 0.35 + target * 0.65) / 100) * 100;
        reasoning = `Round 2: Customer persists below preferred baseline. Defend distributor margin by countering in upper corridor at ₹${suggestedCounterPrice.toLocaleString()}.`;
      } else if (round === 3) {
        // Round 3: Hold preferred baseline
        suggestedCounterPrice = pref;
        reasoning = `Round 3: Hold firm at preferred minimum baseline of ₹${pref.toLocaleString()} with GST input credit and factory warranty benefits.`;
      } else {
        // Round 4+: Concede towards midpoint between offer and preferred
        suggestedCounterPrice = Math.max(floor, Math.round((offer + pref) / 2 / 100) * 100);
        reasoning = `Round ${round}: Concession corridor reached. Counter at ₹${suggestedCounterPrice.toLocaleString()} to secure batch without crossing below floor.`;
      }
    } else if (offer >= pref && offer < target) {
      // Offer is between preferred minimum and target price
      if (round <= 1) {
        // Round 1: Target the EXACT target catalog rate first! DO NOT surrender margin on first try
        recommendation = 'COUNTER';
        canApprove = false;
        suggestedCounterPrice = target;
        const maxProfit = (target - cp) * qty;
        reasoning = `Customer offer of ₹${offer.toLocaleString()} is viable, but on Round 1, DO NOT surrender margin early. Firmly anchor at the exact target catalog rate of ₹${target.toLocaleString()} to capture full potential profit of ₹${maxProfit.toLocaleString()}.`;
      } else if (round === 2) {
        // Round 2: Concede minimally, retaining significantly MORE than the customer
        // (70% surplus retained for distributor, customer gets 30% concession from target)
        recommendation = 'COUNTER';
        canApprove = true;
        suggestedCounterPrice = Math.round((offer * 0.30 + target * 0.70) / 100) * 100;
        const distributorGain = suggestedCounterPrice - offer;
        const customerDiscount = target - suggestedCounterPrice;
        reasoning = `Round 2: Decrease price while strictly retaining the majority of surplus (₹${distributorGain.toLocaleString()} retained for distributor vs ₹${customerDiscount.toLocaleString()} customer discount). Counter at ₹${suggestedCounterPrice.toLocaleString()}.`;
      } else if (round === 3) {
        // Round 3: Secondary concession, still retaining 58% towards target
        recommendation = 'COUNTER';
        canApprove = true;
        suggestedCounterPrice = Math.round((offer * 0.42 + target * 0.58) / 100) * 100;
        reasoning = `Round 3: Second concession round. Counter at ₹${suggestedCounterPrice.toLocaleString()}, maintaining balanced trade partnership while keeping price strictly above customer's initial budget.`;
      } else {
        // Round 4+: Customer has negotiated across multiple rounds and stood firm. Approve deal!
        recommendation = 'ACCEPT';
        canApprove = true;
        suggestedCounterPrice = offer;
        reasoning = `Round ${round}: Customer has held firm across multiple negotiation rounds. At ₹${offer.toLocaleString()}, the deal delivers healthy profit of ₹${metrics.grossProfit.toLocaleString()} (${metrics.grossMargin}% margin). Concession approved to secure the order and prevent buyer defection.`;
      }
    } else {
      // Offer >= target: Full target price captured!
      recommendation = 'ACCEPT';
      canApprove = true;
      suggestedCounterPrice = offer;
      reasoning = `Customer offer of ₹${offer.toLocaleString()} meets or exceeds full target catalog rate (₹${target.toLocaleString()}). Expected lot gross profit is ₹${metrics.grossProfit.toLocaleString()} (${metrics.grossMargin}% margin). Maximum profit captured — instant acceptance recommended!`;
    }

    return {
      recommendation,
      canApprove,
      suggestedCounterPrice,
      reasoning,
      metrics,
      boundaries: {
        costPrice: cp,
        absoluteLowerLimit: floor,
        preferredMinPrice: pref,
        targetPrice: target
      }
    };
  }

  async generateResponseText({ customer, product, offerPrice, quantity, evaluation, tone = 'relationship' }) {
    return aiService.generateNegotiationResponses({
      customer,
      product,
      offerPrice,
      quantity,
      evaluation,
      tone
    });
  }

  async evaluateOffer({ customerId, productId, offerPrice, quantity = 1, currentRound = 1, tone = 'relationship' }) {
    const product = await dataService.getProductById(productId);
    if (!product) {
      const err = new Error(`Product ${productId} not found.`);
      err.status = 404;
      throw err;
    }

    const customer = customerId ? dataService.getCustomerById(customerId) : null;
    const evaluation = this.evaluateBoundaries(product, offerPrice, quantity, currentRound);
    const aiResponse = await this.generateResponseText({
      customer,
      product,
      offerPrice,
      quantity,
      evaluation,
      tone
    });

    return {
      productId: product.id,
      productName: product.name,
      customerId: customer?.id || null,
      customerName: customer ? `${customer.name} (${customer.company || 'Retailer'})` : 'Guest Customer',
      offerPrice: Number(offerPrice),
      quantity: Number(quantity),
      roundNumber: Number(currentRound),
      ...evaluation,
      suggestedReply: aiResponse.primaryReply,
      alternativeReplies: aiResponse.alternatives || [],
      aiTactics: aiResponse.tactics || [],
      winProbability: aiResponse.winProbability || 70,
      aiMode: aiResponse.isLiveAI ? 'Gemini 1.5 Flash (Live Generative AI)' : 'Demo AI Heuristics Mode (Deterministic Guardrail)',
      isLiveAI: aiResponse.isLiveAI,
      tone: aiResponse.tone || tone
    };
  }
}

export const negotiationService = new NegotiationService();

