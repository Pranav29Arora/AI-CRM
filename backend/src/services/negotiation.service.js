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
      // On Round 1, anchor high near target; on later rounds, hold at preferred
      suggestedCounterPrice = round <= 1 
        ? Math.round((pref + target * 2) / 3 / 100) * 100 
        : pref;
      reasoning = `Customer offer of ₹${offer.toLocaleString()} is strictly BELOW the absolute lower limit of ₹${floor.toLocaleString()} (Cost: ₹${cp.toLocaleString()}). Selling below the absolute floor will violate margin guardrails and risk negative profit. Firm rejection required.`;
    } else if (offer >= floor && offer < pref) {
      recommendation = 'COUNTER';
      // Permitted to approve ONLY after multiple rounds if customer refuses to budge
      canApprove = round >= 3;
      if (round <= 1) {
        // Round 1: Counter aggressively close to target catalog price
        suggestedCounterPrice = Math.round((pref + target) / 2 / 100) * 100;
      } else if (round === 2) {
        // Round 2: Hold preferred minimum
        suggestedCounterPrice = pref;
      } else {
        // Round 3+: Concede towards midpoint between offer and preferred
        suggestedCounterPrice = Math.max(floor, Math.round((offer + pref) / 2 / 100) * 100);
      }
      reasoning = `Customer offer of ₹${offer.toLocaleString()} is above the absolute floor (₹${floor.toLocaleString()}), generating ₹${metrics.grossProfit.toLocaleString()} gross profit (${metrics.grossMargin}% margin). However, it is below your preferred minimum of ₹${pref.toLocaleString()}. Round ${round}: Counter at ₹${suggestedCounterPrice.toLocaleString()} to defend margin corridor before accepting concessions.`;
    } else if (offer >= pref && offer < target) {
      // Offer is between preferred minimum and target price!
      if (round <= 1) {
        // Round 1: DO NOT confirm on first try! Counter as close to target as possible to maximize profit
        recommendation = 'COUNTER';
        canApprove = true; // Profitable deal, but commercially held to extract maximum target value
        suggestedCounterPrice = Math.round((offer + target * 3) / 4 / 100) * 100;
        if (suggestedCounterPrice <= offer && target > offer) {
          suggestedCounterPrice = target;
        }
        const maxProfit = (target - cp) * qty;
        reasoning = `Customer offer of ₹${offer.toLocaleString()} meets the preferred baseline (gross profit ₹${metrics.grossProfit.toLocaleString()}, ${metrics.grossMargin}% margin). However, on the first attempt, DO NOT confirm immediately. Actively push towards target price (₹${target.toLocaleString()}) by countering at ₹${suggestedCounterPrice.toLocaleString()} to capture up to ₹${maxProfit.toLocaleString()} maximum profit.`;
      } else if (round === 2) {
        // Round 2: Split difference towards target
        recommendation = 'COUNTER';
        canApprove = true;
        suggestedCounterPrice = Math.round((offer + target) / 2 / 100) * 100;
        reasoning = `Round 2: Customer offer of ₹${offer.toLocaleString()} is viable, but continue defending margin. Split the remaining difference towards target catalog rate by countering at ₹${suggestedCounterPrice.toLocaleString()}.`;
      } else {
        // Round 3+: Customer has negotiated through multiple rounds. Close the deal!
        recommendation = 'ACCEPT';
        canApprove = true;
        suggestedCounterPrice = offer;
        reasoning = `Round ${round}: Customer has negotiated across multiple rounds. At ₹${offer.toLocaleString()}, the deal delivers healthy profit of ₹${metrics.grossProfit.toLocaleString()} (${metrics.grossMargin}% margin). Concession approved to secure the order and prevent buyer defection.`;
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

