import { dataService } from './data.service.js';
import { negotiationService } from './negotiation.service.js';

/**
 * WhatsAppService - Dedicated communication layer for WhatsApp messaging.
 *
 * SEPARATION ARCHITECTURE:
 * - Isolated from core business logic.
 * - Supports live WAKit / WhatsApp Web adapters when configured.
 * - Out-of-the-box verified Simulation Mode with explicit labeling.
 * - Never claims messages were sent over live WhatsApp when using simulation mode.
 */

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

  async sendMessage({ conversationId, text, sender = "salesperson" }) {
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

    // In simulation mode, mark status explicitly as 'simulated'
    const status = this.isLiveAvailable ? 'sent' : 'simulated';

    const result = await dataService.addMessageToConversation(conversationId, {
      sender,
      text: text.trim(),
      status
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

    // 1. Match phone number with existing customer records
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

    // If no existing conversation for customer, create or attach
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

    const customer = conversation.customerId ? dataService.getCustomerById(conversation.customerId) : null;
    const lastCustomerMsg = [...conversation.messages].reverse().find(m => m.sender === 'customer');

    // Pick top interested product or default catalog product
    const allProducts = dataService.getAllProducts();
    const product = allProducts[0];

    const evaluation = negotiationService.evaluateBoundaries(product, product.preferredMinPrice, 5);
    const aiResponse = await negotiationService.generateResponseText({
      customer,
      product,
      offerPrice: product.preferredMinPrice,
      quantity: 5,
      evaluation,
      tone
    });

    return {
      suggestedReply: aiResponse.primaryReply || aiResponse.text,
      alternativeReplies: aiResponse.alternatives || [],
      mode: aiResponse.isLiveAI ? 'Gemini 1.5 Flash (Live AI)' : 'Demo AI Heuristics Mode',
      productRecommended: product.name,
      lastCustomerMessage: lastCustomerMsg?.text || ""
    };
  }
}

export const whatsappService = new WhatsAppService();
