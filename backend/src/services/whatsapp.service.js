import { dataService } from './data.service.js';
import { negotiationService } from './negotiation.service.js';
import { aiService } from './ai.service.js';

/**
 * WhatsAppService - Dedicated communication layer for WhatsApp messaging & AI Sales Roleplay.
 *
 * SEPARATION ARCHITECTURE:
 * - Isolated from core business logic.
 * - Supports live WAKit / WhatsApp Web adapters when configured.
 * - Out-of-the-box verified Simulation Mode with explicit labeling.
 * - Autonomous AI Sales Agent roleplay simulator defending distributor margins.
 */

function extractOfferedPriceFromText(text, defaultPrice = 0) {
  if (!text) return defaultPrice;
  const str = text.trim();

  // 1. Percentage discount: e.g. "5% discount", "10% off"
  const pctMatch = str.match(/(\d+(?:\.\d+)?)\s*%\s*(?:discount|off|kam|less)/i);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    if (pct > 0 && pct < 100 && defaultPrice > 0) {
      return Math.round((defaultPrice * (1 - pct / 100)) / 100) * 100;
    }
  }

  // 2. Notation with 'k': e.g. "82k", "₹82k", "82.5k"
  const kMatch = str.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1]) * 1000;
    if (val >= 500) return Math.round(val);
  }

  // 3. Indian comma or plain number: e.g. "82,000", "₹82000", "82000"
  const numMatches = str.match(/(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})+|\d{4,7})/gi);
  if (numMatches && numMatches.length > 0) {
    const lastNumStr = numMatches[numMatches.length - 1].replace(/[^\d]/g, '');
    const parsed = parseInt(lastNumStr, 10);
    if (parsed >= 500) {
      return parsed;
    }
  }

  return defaultPrice;
}

class WhatsAppService {
  constructor() {
    this.isLiveAvailable = !!process.env.WHATSAPP_API_TOKEN;
  }

  getConnectionStatus() {
    return {
      status: this.isLiveAvailable ? 'CONNECTED' : 'SIMULATION_MODE',
      mode: this.isLiveAvailable ? 'Live WAKit / Cloud API' : 'Verified Simulation Mode',
      isLive: this.isLiveAvailable,
      activeSessionId: this.isLiveAvailable ? 'wakit-session-live' : 'simulated-session-demo',
      description: this.isLiveAvailable
        ? 'Connected to live WhatsApp messaging gateway.'
        : 'Running in explicitly labelled Simulation Mode. Outgoing and incoming messages are recorded locally without external network delivery.',
      integrationGuide: {
        step1: 'To enable live WhatsApp sending, configure WHATSAPP_API_TOKEN or WAKit session keys in backend .env',
        step2: 'Set up WhatsApp Business Cloud API webhook target at /api/whatsapp/webhook',
        step3: 'Verify phone number formatting in international format (e.g. +91 98110 45231)'
      }
    };
  }

  getAllConversations() {
    return dataService.getAllConversations();
  }

  getConversationById(id) {
    return dataService.getConversationById(id);
  }

  getConversationByCustomerId(customerId) {
    return dataService.getConversationByCustomerId(customerId);
  }

  /**
   * Helper to resolve the Customer and the negotiated Product for a conversation.
   */
  resolveProductAndCustomer(conversation) {
    const allCustomers = dataService.getAllCustomers();
    const allProducts = dataService.getAllProducts();

    let customer = null;
    if (conversation.customerId) {
      customer = allCustomers.find(c => c.id === conversation.customerId);
    }
    if (!customer && conversation.customerPhone) {
      const cleanPhone = conversation.customerPhone.replace(/[\s\-\+]/g, '');
      customer = allCustomers.find(c => {
        const cClean = (c.phone || '').replace(/[\s\-\+]/g, '');
        return cClean && (cleanPhone.includes(cClean) || cClean.includes(cleanPhone));
      });
    }

    let product = null;
    let offeredPrice = 0;
    let quantity = 1;

    // 1. Check if conversation has an explicit productId
    if (conversation.productId) {
      product = allProducts.find(p => p.id === conversation.productId);
    }

    // 2. Check customer interested products
    if (customer?.interestedProducts && customer.interestedProducts.length > 0) {
      let matchedInterest = null;
      if (product) {
        matchedInterest = customer.interestedProducts.find(p => (p.productId || p.id) === product.id || p.sku === product.sku);
      }
      if (!matchedInterest) {
        matchedInterest = customer.interestedProducts[0];
        if (!product) {
          product = allProducts.find(p => p.id === (matchedInterest.productId || matchedInterest.id) || p.sku === matchedInterest.sku);
        }
      }

      if (matchedInterest) {
        if (matchedInterest.offeredPrice) {
          offeredPrice = Number(matchedInterest.offeredPrice);
        }
        if (matchedInterest.quantity) {
          quantity = Number(matchedInterest.quantity) || 1;
        }
      }
    }

    // 3. Fallback to first catalog product
    if (!product && allProducts.length > 0) {
      product = allProducts[0];
    }

    if (!offeredPrice) {
      offeredPrice = customer?.budget ? Number(customer.budget) : (product?.preferredMinPrice || 0);
    }

    return {
      customer,
      product,
      offeredPrice,
      quantity
    };
  }

  /**
   * Retrieve rich Margin Guard context for the active conversation HUD.
   */
  getConversationContext(conversationId) {
    const conversation = dataService.getConversationById(conversationId);
    if (!conversation) {
      const err = new Error(`Conversation ${conversationId} not found.`);
      err.status = 404;
      throw err;
    }

    const { customer, product, offeredPrice, quantity } = this.resolveProductAndCustomer(conversation);

    let evaluation = null;
    if (product) {
      evaluation = negotiationService.evaluateBoundaries(product, offeredPrice, quantity);
    }

    return {
      conversation,
      customer,
      product,
      offeredPrice,
      quantity,
      evaluation
    };
  }

  /**
   * Generates formal B2B WhatsApp opening outreach via Gemini or deterministic fallback.
   */
  async getOpeningOutreach(conversationId, tone = 'formal') {
    const conversation = dataService.getConversationById(conversationId);
    if (!conversation) {
      const err = new Error(`Conversation ${conversationId} not found.`);
      err.status = 404;
      throw err;
    }

    const { customer, product, offeredPrice, quantity } = this.resolveProductAndCustomer(conversation);

    const outreach = await aiService.generateOpeningOutreach({
      customer,
      product,
      offeredPrice,
      quantity,
      tone
    });

    return {
      customer,
      product,
      offeredPrice,
      quantity,
      outreach
    };
  }

  /**
   * Dispatches the formal opening outreach to start the conversation thread.
   */
  async sendOpeningOutreach(conversationId, { tone = 'formal', text = null } = {}) {
    const conversation = dataService.getConversationById(conversationId);
    if (!conversation) {
      const err = new Error(`Conversation ${conversationId} not found.`);
      err.status = 404;
      throw err;
    }

    let messageText = text;
    let headline = 'Formal B2B Opening Outreach';

    if (!messageText) {
      const outreachRes = await this.getOpeningOutreach(conversationId, tone);
      messageText = outreachRes.outreach.openingMessage;
      headline = outreachRes.outreach.headline;
    }

    const status = this.isLiveAvailable ? 'sent' : 'simulated';

    const result = await dataService.addMessageToConversation(conversationId, {
      sender: 'salesperson',
      text: messageText.trim(),
      status,
      isAiGenerated: true,
      tacticApplied: headline
    });

    return {
      ...result,
      isLiveDelivered: this.isLiveAvailable,
      isAiGenerated: true,
      headline
    };
  }

  /**
   * Roleplay Simulator: Processes a buyer message and immediately triggers Gemini AI sales agent response.
   */
  async processBuyerMessage({ conversationId, text, tone = 'relationship', autoReply = true }) {
    if (!text || !text.trim()) {
      const err = new Error("Message text is required.");
      err.status = 400;
      throw err;
    }

    const conversation = dataService.getConversationById(conversationId);
    if (!conversation) {
      const err = new Error(`Conversation ${conversationId} not found.`);
      err.status = 404;
      throw err;
    }

    // 1. Record the Buyer's message
    const buyerResult = await dataService.addMessageToConversation(conversationId, {
      sender: 'customer',
      text: text.trim(),
      status: 'delivered'
    });

    if (!autoReply) {
      return {
        conversation: buyerResult.conversation,
        buyerMessage: buyerResult.message,
        aiReply: null
      };
    }

    // 2. Resolve Context & Evaluate Margin Boundaries
    const { customer, product, offeredPrice, quantity } = this.resolveProductAndCustomer(conversation);

    if (!product) {
      const fallbackReply = await dataService.addMessageToConversation(conversationId, {
        sender: 'salesperson',
        text: `Namaste ji, thank you for your message. We have noted your request and our distributor desk is reviewing available stock.`,
        status: this.isLiveAvailable ? 'sent' : 'simulated',
        isAiGenerated: true,
        tacticApplied: 'General Acknowledgement'
      });
      return {
        conversation: fallbackReply.conversation,
        buyerMessage: buyerResult.message,
        aiReply: fallbackReply.message
      };
    }

    // Extract any new price or percentage discount offered by the buyer
    let extractedOffer = extractOfferedPriceFromText(text, null);

    // If buyer did not state an explicit new number, check if they are accepting the salesperson's quote
    if (!extractedOffer) {
      const lastSalesMsg = [...(conversation.messages || [])].reverse().find(m => m.sender === 'salesperson' || m.sender === 'assistant' || m.isAiGenerated);
      if (lastSalesMsg) {
        const quotedMatches = [...(lastSalesMsg.text || '').matchAll(/(?:rate|counter|price|quote|concession|meet you at|lock at|offer is|can offer is|allocation at|consignments? at|per unit at|rate of|invoice at)\s*(?:is|of|a)?\s*₹\s*([0-9,]+)/gi)];
        if (quotedMatches.length > 0) {
          const lastQuoted = Number(quotedMatches[quotedMatches.length - 1][1].replace(/[^0-9]/g, ''));
          if (lastQuoted >= (product.absoluteLowerLimit || 0)) {
            extractedOffer = lastQuoted;
          }
        }
      }
    }
    if (!extractedOffer) {
      extractedOffer = offeredPrice || product.targetPrice;
    }

    const buyerMessagesCount = (conversation.messages || []).filter(m => m.sender === 'buyer' || m.sender === 'customer').length;
    const currentRound = Math.max(1, buyerMessagesCount);
    const evaluation = negotiationService.evaluateBoundaries(product, extractedOffer, quantity, currentRound);
    evaluation.evaluatedOffer = extractedOffer;
    evaluation.quantity = quantity;
    evaluation.currentRound = currentRound;

    // 3. Autonomous AI Sales Agent generates formal, margin-defending response
    const aiStrategy = await aiService.generateAutonomousChatReply({
      customer,
      product,
      threadMessages: conversation.messages,
      latestBuyerMessage: text.trim(),
      evaluation,
      tone
    });

    // 4. Record the Salesperson's AI response in the thread
    const status = this.isLiveAvailable ? 'sent' : 'simulated';
    const aiResult = await dataService.addMessageToConversation(conversationId, {
      sender: 'salesperson',
      text: aiStrategy.replyText,
      status,
      isAiGenerated: true,
      intent: aiStrategy.intent,
      tacticApplied: aiStrategy.tacticApplied,
      evaluatedPrice: extractedOffer
    });

    // 5. Automatic Deal Closure Detection:
    // Deal can ONLY be closed if the buyer actively agreed AND did NOT refuse/say no!
    const lowerText = (text || '').toLowerCase().trim();
    const buyerRejected = /^(no|nah|nahi|nope|never|not interested|deal off|cancel|drop it|leave it)\b|(\bno\b|\bnah\b|\bnahi\b|\bnot interested\b|\bcancel\b|\bdrop it\b|\bleave it\b|\bcan't do\b|\bcant do\b|\bwon't buy\b|\bwont buy\b|\bdon't want\b|\bdont want\b|\bmat bhejo\b|\bnahi chahiye\b)/i.test(lowerText);

    const hasAcceptanceWords = /(deal done|confirm deal|agree|agreed|accept|accepted|send invoice|proforma|pro-forma|pi bhejo|deal lock|pack karo|confirm karo|deal pakki|order confirm|done deal|deal final|finalise|finalize|lock kar do|lock it in|book it|book kar do|proceed|go ahead|lets do it|let's do it|done hai|theek hai|chalega|bhej do|le lunga|aa raha hu)/i.test(lowerText);
    const hasPickupIntent = /(collect|pickup|pick up|take delivery|collection|coming to pick|be there to collect)/i.test(lowerText);
    const isAffirmative = /^(yes|sure|ok|okay|yep|yeah|fine|perfect|great|super|alright|done|haan|ha ji|yes sure|sure thing|sounds good)[\s!.,]*$/i.test(lowerText) ||
      /^(yes|sure|okay|ok|alright|perfect),?\s*(i will|i'll|we will|we'll|let's|lets|please|proceed|send|issue|generate|can collect|will collect|there to collect)/i.test(lowerText);
    const isAffirmativeWithPickup = hasPickupIntent && /(sure|yes|ok|okay|will|ready|soon|coming|i am|i will|be there)/i.test(lowerText);
    const hasCounterOfferOrCondition = /(\bbut\b|\bhowever\b|\bif you can\b|\bcan you do\b|\bdiscount\b|\bkam\b|\bless\b)/i.test(lowerText);

    const lastSalesMsg = [...(conversation.messages || [])].reverse().find(m => m.sender === 'salesperson' || m.sender === 'assistant' || m.isAiGenerated);
    const salesAskedToClose = lastSalesMsg && /(pro-forma|invoice|lock|proceed|book|confirm|shall we|shall i|let me know if we can lock|at ₹)/i.test(lastSalesMsg.text || '');

    const buyerAgreed = !buyerRejected && !hasCounterOfferOrCondition && (
      hasAcceptanceWords ||
      isAffirmative ||
      isAffirmativeWithPickup ||
      (salesAskedToClose && (hasPickupIntent || /^(yes|sure|ok|okay|done|yep|yeah|fine|proceed|sounds good|great|alright)/i.test(lowerText)))
    );

    const aiConfirmed = !buyerRejected && (
      (aiStrategy.intent === 'DEAL_ACCEPTANCE' && /delighted to finalize|finalize this order|issue your pro-forma|confirmed and finalized|ready for collection/i.test(aiStrategy.replyText || ''))
    );

    let closedDealResult = null;
    const finalDealPrice = extractedOffer >= (product.absoluteLowerLimit || 0) ? extractedOffer : (evaluation?.suggestedCounterPrice || product.preferredMinPrice);

    if (!buyerRejected && (buyerAgreed || (aiConfirmed && evaluation?.canApprove)) && customer && product && finalDealPrice >= (product.absoluteLowerLimit || 0)) {
      try {
        closedDealResult = await dataService.recordClosedWonDeal({
          customerId: customer.id,
          productId: product.id,
          finalPrice: finalDealPrice,
          quantity,
          conversationId,
          source: 'WhatsApp Desk'
        });
      } catch (closeErr) {
        console.warn('[Auto Deal Close Notice]:', closeErr.message);
      }
    }

    return {
      conversation: aiResult.conversation,
      buyerMessage: buyerResult.message,
      aiReply: aiResult.message,
      evaluation,
      aiStrategy,
      isDealClosed: !!closedDealResult,
      closedDealResult
    };
  }

  /**
   * Explicitly seals and locks a deal from the WhatsApp Hub Desk UI.
   * Updates customer leadStatus to "Closed Won", writes detailed description in notes,
   * creates accepted negotiation, and syncs across Customers page & Dashboard.
   */
  async closeDeal({ conversationId, finalPrice = null, quantity = null }) {
    const conversation = dataService.getConversationById(conversationId);
    if (!conversation) {
      const err = new Error(`Conversation ${conversationId} not found.`);
      err.status = 404;
      throw err;
    }

    const { customer, product, offeredPrice, quantity: defQty } = this.resolveProductAndCustomer(conversation);
    if (!customer || !product) {
      const err = new Error("Cannot close deal: Customer or product not resolved.");
      err.status = 400;
      throw err;
    }

    const sp = finalPrice !== null && finalPrice !== undefined ? Number(finalPrice) : (offeredPrice || product.targetPrice);
    const qty = quantity !== null && quantity !== undefined ? Number(quantity) : defQty;

    const result = await dataService.recordClosedWonDeal({
      customerId: customer.id,
      productId: product.id,
      finalPrice: sp,
      quantity: qty,
      conversationId,
      source: 'WhatsApp Desk'
    });

    const status = this.isLiveAvailable ? 'sent' : 'simulated';
    await dataService.addMessageToConversation(conversationId, {
      sender: 'salesperson',
      text: `🏆 DEAL CLOSED & WON! Finalized order for ${qty} units of ${product.name} at ₹${sp.toLocaleString('en-IN')}/unit (Total: ₹${(sp * qty).toLocaleString('en-IN')}). Pro-forma invoice issued.`,
      status,
      isAiGenerated: true,
      tacticApplied: 'Deal Closed & Pro-Forma Finalized',
      evaluatedPrice: sp
    });

    return result;
  }

  /**
   * Initialize or retrieve conversation for a customer.
   */
  async createOrGetConversationForCustomer({ customerId, productId = null }) {
    let conv = dataService.getConversationByCustomerId(customerId);
    const customer = dataService.getCustomerById(customerId);

    if (!customer) {
      const err = new Error(`Customer ${customerId} not found.`);
      err.status = 404;
      throw err;
    }

    let resolvedProdId = productId || customer?.interestedProducts?.[0]?.productId || customer?.interestedProducts?.[0]?.id || null;
    if (!resolvedProdId && customer?.interestedProducts?.[0]) {
      const matched = dataService.getAllProducts().find(p =>
        p.sku === customer.interestedProducts[0].sku ||
        p.name.toLowerCase() === customer.interestedProducts[0].name?.toLowerCase()
      );
      if (matched) resolvedProdId = matched.id;
    }
    if (!resolvedProdId && dataService.getAllProducts().length > 0) {
      resolvedProdId = dataService.getAllProducts()[0].id;
    }

    if (!conv) {
      const convId = `conv-${Date.now()}`;
      conv = {
        id: convId,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone || "+91 98000 00000",
        productId: resolvedProdId,
        unreadCount: 0,
        lastMessage: "Conversation initiated",
        lastMessageTimestamp: new Date().toISOString(),
        messages: []
      };
      dataService.conversations.unshift(conv);
      dataService.saveLocalDB();
    } else if (resolvedProdId && !conv.productId) {
      conv.productId = resolvedProdId;
      dataService.saveLocalDB();
    }

    return conv;
  }

  async sendMessage({ conversationId, text, sender = "salesperson", isAiGenerated = false }) {
    if (!text || !text.trim()) {
      const err = new Error("Message text is required.");
      err.status = 400;
      throw err;
    }

    const conversation = dataService.getConversationById(conversationId);
    if (!conversation) {
      const err = new Error(`Conversation ${conversationId} not found.`);
      err.status = 404;
      throw err;
    }

    const status = this.isLiveAvailable ? 'sent' : 'simulated';

    const result = await dataService.addMessageToConversation(conversationId, {
      sender,
      text: text.trim(),
      status,
      isAiGenerated
    });

    return {
      ...result,
      isLiveDelivered: this.isLiveAvailable,
      modeNotice: this.isLiveAvailable ? 'Delivered via WhatsApp API' : 'Simulated locally (Demo Mode)'
    };
  }

  receiveIncomingMessage({ phone, text, customerName }) {
    if (!text || !text.trim()) {
      const err = new Error("Message text is required.");
      err.status = 400;
      throw err;
    }

    const allCustomers = dataService.getAllCustomers();
    let customer = null;

    if (phone) {
      const cleaned = phone.replace(/[\s\-\+]/g, '');
      customer = allCustomers.find(c => {
        const cCleaned = (c.phone || '').replace(/[\s\-\+]/g, '');
        return cCleaned && (cleaned.includes(cCleaned) || cCleaned.includes(cleaned));
      });
    }

    let conversation;
    if (customer) {
      conversation = dataService.getConversationByCustomerId(customer.id);
    }

    if (!conversation) {
      const convId = `conv-${Date.now()}`;
      conversation = {
        id: convId,
        customerId: customer?.id || null,
        customerName: customer?.name || customerName || "Prospective Buyer",
        customerPhone: phone || "+91 98000 00000",
        unreadCount: 1,
        lastMessage: text.trim(),
        lastMessageTimestamp: new Date().toISOString(),
        messages: []
      };
      dataService.conversations.unshift(conversation);
    } else {
      conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      text: text.trim(),
      timestamp: new Date().toISOString(),
      status: 'delivered'
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage = newMessage.text;
    conversation.lastMessageTimestamp = newMessage.timestamp;

    return {
      conversation,
      message: newMessage,
      matchedCustomer: customer
    };
  }

  async generateAIReply(conversationId, tone = 'relationship') {
    const conversation = dataService.getConversationById(conversationId);
    if (!conversation) {
      const err = new Error(`Conversation ${conversationId} not found.`);
      err.status = 404;
      throw err;
    }

    const { customer, product, offeredPrice, quantity } = this.resolveProductAndCustomer(conversation);

    const evaluation = negotiationService.evaluateBoundaries(product, offeredPrice, quantity);
    const aiResponse = await negotiationService.generateResponseText({
      customer,
      product,
      offerPrice: offeredPrice,
      quantity,
      evaluation,
      tone
    });

    const lastCustomerMsg = [...conversation.messages].reverse().find(m => m.sender === 'customer');

    return {
      suggestedReply: aiResponse.primaryReply || aiResponse.text,
      alternativeReplies: aiResponse.alternatives || [],
      mode: aiResponse.isLiveAI ? 'Gemini 1.5 Flash (Live AI)' : 'Demo AI Heuristics Mode',
      productRecommended: product?.name || 'Wholesale Stock',
      lastCustomerMessage: lastCustomerMsg?.text || ""
    };
  }
}

export const whatsappService = new WhatsAppService();
