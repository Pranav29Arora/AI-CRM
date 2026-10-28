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
