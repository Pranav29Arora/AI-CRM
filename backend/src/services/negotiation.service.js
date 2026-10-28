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

  evaluateBoundaries(product, offerPrice, quantity = 1) {
    const offer = Number(offerPrice);
    const cp = Number(product.costPrice);
    const floor = Number(product.absoluteLowerLimit);
    const pref = Number(product.preferredMinPrice);
    const target = Number(product.targetPrice);

    const metrics = this.calculatePricingMetrics({
      costPrice: cp,
      sellingPrice: offer,
      quantity
    });

    let recommendation = 'COUNTER';
    let canApprove = false;
    let suggestedCounterPrice = pref;
    let reasoning = '';

    if (offer < floor) {
      recommendation = 'REJECT';
      canApprove = false;
      suggestedCounterPrice = pref;
      reasoning = `Customer offer of ₹${offer.toLocaleString()} is strictly BELOW the absolute lower limit of ₹${floor.toLocaleString()} (Cost: ₹${cp.toLocaleString()}). Selling below the absolute floor will violate margin guardrails and risk negative profit. Firm rejection required.`;
    } else if (offer >= floor && offer < pref) {
      recommendation = 'COUNTER';
      canApprove = true; // Permitted ONLY if customer refuses to move, subject to explicit approval
      // Suggest counter halfway between offer and preferred, or closer to preferred
      suggestedCounterPrice = Math.round((offer + pref * 2) / 3 / 100) * 100;
      if (suggestedCounterPrice < floor) suggestedCounterPrice = floor;

      reasoning = `Customer offer of ₹${offer.toLocaleString()} is above the absolute floor (₹${floor.toLocaleString()}), generating ₹${metrics.grossProfit.toLocaleString()} gross profit (${metrics.grossMargin}% margin). However, it is below your preferred minimum of ₹${pref.toLocaleString()}. First attempt to counter at ₹${suggestedCounterPrice.toLocaleString()} before accepting lower margin.`;
    } else {
      recommendation = 'ACCEPT';
      canApprove = true;
      suggestedCounterPrice = offer;
      reasoning = `Customer offer of ₹${offer.toLocaleString()} meets or exceeds preferred target (₹${pref.toLocaleString()}). Expected lot gross profit is ₹${metrics.grossProfit.toLocaleString()} (${metrics.grossMargin}% margin). Excellent wholesale return — recommend instant acceptance.`;
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
    const product = dataService.getProductById(productId);
    if (!product) {
      const err = new Error(`Product ${productId} not found.`);
      err.status = 404;
      throw err;
    }

    const customer = customerId ? dataService.getCustomerById(customerId) : null;
    const evaluation = this.evaluateBoundaries(product, offerPrice, quantity);
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

