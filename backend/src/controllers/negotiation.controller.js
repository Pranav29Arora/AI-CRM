import { negotiationService } from '../services/negotiation.service.js';
import { dataService } from '../services/data.service.js';

export const evaluateOffer = async (req, res, next) => {
  try {
    const { customerId, productId, offerPrice, quantity, currentRound, tone } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: "Product selection is required." });
    }
    if (!offerPrice || Number(offerPrice) <= 0) {
      return res.status(400).json({ success: false, error: "A valid customer offer price is required." });
    }

    const result = await negotiationService.evaluateOffer({
      customerId,
      productId,
      offerPrice: Number(offerPrice),
      quantity: Number(quantity) || 1,
      currentRound: Number(currentRound) || 1,
      tone: tone || 'relationship'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getAllNegotiations = (req, res, next) => {
  try {
    const list = dataService.getAllNegotiations();
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

export const getNegotiationById = (req, res, next) => {
  try {
    const { id } = req.params;
    const neg = dataService.getNegotiationById(id);
    if (!neg) {
      return res.status(404).json({ success: false, error: `Negotiation ${id} not found.` });
    }
    res.json({
      success: true,
      data: neg
    });
  } catch (error) {
    next(error);
  }
};

export const saveNegotiationRound = async (req, res, next) => {
  try {
    const {
      negotiationId,
      customerId,
      customerName,
      productId,
      productName,
      quantity,
      costPrice,
      targetPrice,
      preferredMinPrice,
      absoluteLowerLimit,
      currentOffer,
      status,
      recommendation,
      grossProfit,
      grossMargin,
      reasoning,
      suggestedReply,
      roundNote,
      roundSender = "salesperson"
    } = req.body;

    let neg;
    if (negotiationId) {
      neg = dataService.getNegotiationById(negotiationId);
    }

    const newRound = {
      roundNumber: neg ? neg.rounds.length + 1 : 1,
      sender: roundSender,
      price: Number(currentOffer),
      quantity: Number(quantity) || 1,
      note: roundNote || suggestedReply || "Round recorded",
      timestamp: new Date().toISOString()
    };

    if (neg) {
      const updated = await dataService.updateNegotiation(negotiationId, {
        rounds: [...neg.rounds, newRound],
        currentOffer: Number(currentOffer),
        quantity: Number(quantity),
        status: status || neg.status,
        recommendation: recommendation || neg.recommendation,
        grossProfit: grossProfit !== undefined ? Number(grossProfit) : neg.grossProfit,
        grossMargin: grossMargin !== undefined ? Number(grossMargin) : neg.grossMargin,
        reasoning: reasoning || neg.reasoning,
        suggestedReply: suggestedReply || neg.suggestedReply,
        updatedAt: new Date().toISOString()
      });
      return res.json({ success: true, message: "Negotiation round saved to Cloud Firestore.", data: updated });
    }

    // Create new negotiation
    const created = await dataService.createNegotiation({
      customerId,
      customerName,
      productId,
      productName,
      quantity: Number(quantity) || 1,
      costPrice: Number(costPrice),
      targetPrice: Number(targetPrice),
      preferredMinPrice: Number(preferredMinPrice),
      absoluteLowerLimit: Number(absoluteLowerLimit),
      initialOffer: Number(currentOffer),
      currentOffer: Number(currentOffer),
      status: status || "In Review",
      recommendation: recommendation || "COUNTER",
      grossProfit: Number(grossProfit) || 0,
      grossMargin: Number(grossMargin) || 0,
      reasoning: reasoning || "",
      suggestedReply: suggestedReply || "",
      approved: false,
      rounds: [newRound]
    });

    res.status(201).json({
      success: true,
      message: "Negotiation workspace saved in Cloud Firestore.",
      data: created
    });
  } catch (error) {
    next(error);
  }
};

export const approveNegotiation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { finalPrice } = req.body;

    const neg = dataService.getNegotiationById(id);
    if (!neg) {
      return res.status(404).json({ success: false, error: `Negotiation ${id} not found.` });
    }

    const priceToCheck = finalPrice !== undefined ? Number(finalPrice) : neg.currentOffer;

    // Hard backend pricing rule constraint
    if (priceToCheck < neg.absoluteLowerLimit) {
      return res.status(400).json({
        success: false,
        error: `Deal CANNOT be approved. Price ₹${priceToCheck.toLocaleString()} violates absolute floor limit of ₹${neg.absoluteLowerLimit.toLocaleString()}.`
      });
    }

    const updated = await dataService.updateNegotiation(id, {
      approved: true,
      status: "Accepted",
      currentOffer: priceToCheck,
      grossProfit: (priceToCheck - neg.costPrice) * neg.quantity,
      grossMargin: Number((((priceToCheck - neg.costPrice) / priceToCheck) * 100).toFixed(2))
    });

    res.json({
      success: true,
      message: "Deal approved successfully in Cloud Firestore.",
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
