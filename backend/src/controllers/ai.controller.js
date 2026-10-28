import { aiService } from '../services/ai.service.js';
import { dataService } from '../services/data.service.js';
import { negotiationService } from '../services/negotiation.service.js';

export const getAIStatus = (req, res) => {
  res.json({
    success: true,
    data: aiService.getAIStatus()
  });
};

export const updateAIConfig = async (req, res, next) => {
  try {
    const { apiKey } = req.body;
    const result = await aiService.updateApiKey(apiKey);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const testAIConnection = async (req, res, next) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ success: false, error: "API key is required for testing." });
    }
    const result = await aiService.testApiKey(apiKey);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const generateReplies = async (req, res, next) => {
  try {
    const { customerId, productId, offerPrice, quantity = 1, tone = 'relationship' } = req.body;

    const product = dataService.getProductById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: `Product ${productId} not found.` });
    }

    const customer = customerId ? dataService.getCustomerById(customerId) : null;
    const evaluation = negotiationService.evaluateBoundaries(product, offerPrice, quantity);

    const responses = await aiService.generateNegotiationResponses({
      customer,
      product,
      offerPrice: Number(offerPrice),
      quantity: Number(quantity),
      evaluation,
      tone
    });

    res.json({
      success: true,
      data: {
        evaluation,
        aiResponses: responses
      }
    });
  } catch (error) {
    next(error);
  }
};

export const summarizeThread = async (req, res, next) => {
  try {
    const { conversationId, customerId } = req.body;

    let customerName = "Prospective Buyer";
    let customerCompany = "Retail Store";
    let messages = [];

    if (conversationId) {
      const conv = dataService.getConversationById(conversationId);
      if (conv) {
        customerName = conv.customerName || customerName;
        messages = conv.messages || [];
        if (conv.customerId) {
          const cust = dataService.getCustomerById(conv.customerId);
          if (cust) customerCompany = cust.company || customerCompany;
        }
      }
    } else if (customerId) {
      const cust = dataService.getCustomerById(customerId);
      if (cust) {
        customerName = cust.name;
        customerCompany = cust.company || customerCompany;
        const conv = dataService.getConversationByCustomerId(customerId);
        if (conv) messages = conv.messages || [];
      }
    }

    const summary = await aiService.summarizeConversation({
      customerName,
      customerCompany,
      messages
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

export const getBuyerProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = dataService.getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ success: false, error: `Customer ${id} not found.` });
    }

    const allNegotiations = dataService.getAllNegotiations();
    const customerNegotiations = allNegotiations.filter(n => n.customerId === id);

    const profile = await aiService.analyzeBuyerProfile({
      customer,
      negotiations: customerNegotiations
    });

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
