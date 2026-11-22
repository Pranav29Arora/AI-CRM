import { whatsappService } from '../services/whatsapp.service.js';

export const getConnectionStatus = (req, res) => {
  const status = whatsappService.getConnectionStatus();
  res.json({
    success: true,
    data: status
  });
};

export const getAllConversations = (req, res, next) => {
  try {
    const list = whatsappService.getAllConversations();
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationById = (req, res, next) => {
  try {
    const { id } = req.params;
    const conv = whatsappService.getConversationById(id);
    if (!conv) {
      return res.status(404).json({ success: false, error: `Conversation ${id} not found.` });
    }
    // Mark unread as read when opened
    conv.unreadCount = 0;
    res.json({
      success: true,
      data: conv
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationContext = (req, res, next) => {
  try {
    const { id } = req.params;
    const context = whatsappService.getConversationContext(id);
    res.json({
      success: true,
      data: context
    });
  } catch (error) {
    next(error);
  }
};

export const getOpeningOutreach = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tone } = req.query;
    const result = await whatsappService.getOpeningOutreach(id, tone || 'formal');
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const sendOpeningOutreach = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tone, text } = req.body || {};
    const result = await whatsappService.sendOpeningOutreach(id, {
      tone: tone || 'formal',
      text
    });
    res.status(201).json({
      success: true,
      message: "Opening outreach dispatched via AI Sales Agent.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const processBuyerMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, tone, autoReply } = req.body || {};
    const result = await whatsappService.processBuyerMessage({
      conversationId: id,
      text,
      tone: tone || 'relationship',
      autoReply: autoReply !== undefined ? autoReply : true
    });
    res.status(201).json({
      success: true,
      message: result.aiReply ? "Buyer message processed and AI sales response generated." : "Buyer message recorded.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const initiateConversation = async (req, res, next) => {
  try {
    const { customerId, productId } = req.body;
    if (!customerId) {
      return res.status(400).json({ success: false, error: "customerId is required." });
    }
    const conv = await whatsappService.createOrGetConversationForCustomer({ customerId, productId });
    res.status(200).json({
      success: true,
      data: conv
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, sender } = req.body;
    const result = await whatsappService.sendMessage({
      conversationId: id,
      text,
      sender: sender || "salesperson"
    });
    res.status(201).json({
      success: true,
      message: "Message dispatched (Simulation Mode).",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const simulateIncoming = (req, res, next) => {
  try {
    const { phone, text, customerName } = req.body;
    const result = whatsappService.receiveIncomingMessage({
      phone,
      text,
      customerName
    });
    res.status(201).json({
      success: true,
      message: "Incoming WhatsApp message simulated.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const generateAIReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tone } = req.body || {};
    const result = await whatsappService.generateAIReply(id, tone || 'relationship');
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const closeDeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { finalPrice, quantity } = req.body || {};
    const result = await whatsappService.closeDeal({
      conversationId: id,
      finalPrice,
      quantity
    });
    res.json({
      success: true,
      message: "Deal successfully finalized and marked Closed Won! Reflected on Customers page and Dashboard.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
