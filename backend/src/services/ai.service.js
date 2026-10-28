import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

/**
 * AIService - Google Gemini 1.5 Flash Generative AI & Deal Intelligence Engine.
 *
 * ZERO-HALLUCINATION PRICING RULE:
 * Pricing mathematical boundaries are calculated by the deterministic backend engine.
 * Gemini generates natural language messages, tactical B2B suggestions, and buyer summaries,
 * but can NEVER override floor constraints or authorize sub-floor deals.
 */
class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || null;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.apiVersion = process.env.GEMINI_API_VERSION || 'v1';
    this.client = null;
    if (this.apiKey) {
      this.initClient(this.apiKey, this.modelName, this.apiVersion);
    }
  }

  initClient(key, model = null, apiVersion = null) {
    try {
      this.apiKey = key.trim();
      if (model) this.modelName = model;
      if (apiVersion) this.apiVersion = apiVersion;
      this.client = new GoogleGenerativeAI(this.apiKey);
      console.log(`[Gemini AI] Initialized GoogleGenerativeAI with model: ${this.modelName} (${this.apiVersion})`);
    } catch (err) {
      console.error('[Gemini AI Init Error]:', err.message);
      this.client = null;
    }
  }

  /**
   * Helper to retrieve a configured generative model instance with correct API version.
   */
  getModel(generationConfig = {}) {
    if (!this.client) return null;
    const model = this.modelName || 'gemini-3.5-flash';
    const apiVer = this.apiVersion || 'v1beta';
    return this.client.getGenerativeModel(
      {
        model,
        generationConfig
      },
      {
        apiVersion: apiVer
      }
    );
  }

  /**
   * Resilient content generator that attempts primary model and falls back through
   * active flash variants if a 503/429 spike occurs.
   */
  async generateWithFallback(prompt, generationConfig = {}) {
    if (!this.client) return null;
    const modelCandidates = [
      this.modelName,
      'gemini-3.5-flash',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3-flash-preview'
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const m of modelCandidates) {
      try {
        const model = this.client.getGenerativeModel(
          { model: m, generationConfig },
          { apiVersion: this.apiVersion || 'v1beta' }
        );
        const result = await model.generateContent(prompt);
        if (result?.response) {
          return { text: result.response.text(), model: m };
        }
      } catch (err) {
        console.warn(`[Gemini Model ${m} fallback]:`, err.message?.slice(0, 100));
      }
    }
    return null;
  }

  /**
   * Dynamically inspect Google's ModelService for the provided API key
   * to automatically detect active models and supported endpoint versions (v1 / v1beta).
   */
  async discoverBestModel(apiKey) {
    const key = apiKey.trim();

    // 1. Query ModelService.ListModels for active endpoints
    const endpoints = [
      { ver: 'v1', url: `https://generativelanguage.googleapis.com/v1/models?key=${key}` },
      { ver: 'v1beta', url: `https://generativelanguage.googleapis.com/v1beta/models?key=${key}` }
    ];

    let availableModels = [];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.url);
        if (res.ok) {
          const json = await res.json();
          if (json.models && Array.isArray(json.models)) {
            const valid = json.models
              .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
              .map(m => ({
                id: m.name.replace('models/', ''),
                apiVersion: ep.ver,
                displayName: m.displayName || m.name
              }));
            availableModels.push(...valid);
          }
        }
      } catch {
        // continue
      }
    }

    // Cost & latency priority hierarchy (preferring latest active 3.x and flash-lite models)
    const priority = [
      'gemini-3.5-flash',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3-flash-preview',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ];

    const testClient = new GoogleGenerativeAI(key);

    if (availableModels.length > 0) {
      for (const pref of priority) {
        const found = availableModels.find(m => m.id === pref);
        if (found) {
          try {
            const m = testClient.getGenerativeModel({ model: found.id }, { apiVersion: found.apiVersion });
            const ping = await m.generateContent("ping");
            if (ping?.response) {
              return { model: found.id, apiVersion: found.apiVersion, allModels: availableModels };
            }
          } catch {
            // If model is busy (503) or restricted, try next priority candidate
          }
        }
      }

      // If priority probe didn't resolve, probe first available models
      for (const item of availableModels.slice(0, 10)) {
        try {
          const m = testClient.getGenerativeModel({ model: item.id }, { apiVersion: item.apiVersion });
          const ping = await m.generateContent("ping");
          if (ping?.response) {
            return { model: item.id, apiVersion: item.apiVersion, allModels: availableModels };
          }
        } catch {
          // continue probe
        }
      }
    }

    // 2. Direct probe fallback if ListModels has permission restrictions
    const candidates = [
      { model: 'gemini-3.5-flash', apiVersion: 'v1beta' },
      { model: 'gemini-flash-lite-latest', apiVersion: 'v1beta' },
      { model: 'gemini-3.5-flash-lite', apiVersion: 'v1beta' },
      { model: 'gemini-3.1-flash-lite', apiVersion: 'v1beta' },
      { model: 'gemini-3-flash-preview', apiVersion: 'v1beta' },
      { model: 'gemini-1.5-flash', apiVersion: 'v1' },
      { model: 'gemini-2.0-flash', apiVersion: 'v1beta' }
    ];

    for (const cand of candidates) {
      try {
        const m = testClient.getGenerativeModel({ model: cand.model }, { apiVersion: cand.apiVersion });
        const res = await m.generateContent("ping");
        if (res?.response) {
          return { model: cand.model, apiVersion: cand.apiVersion, allModels: [] };
        }
      } catch {
        // continue probe
      }
    }

    // Default to gemini-3.5-flash
    return { model: 'gemini-3.5-flash', apiVersion: 'v1beta', allModels: [] };
  }

  getAIStatus() {
    return {
      isLive: !!this.client,
      model: this.modelName,
      apiVersion: this.apiVersion || 'v1',
      mode: this.client ? `Google Gemini (${this.modelName} - Live AI)` : 'Demo AI Heuristics Mode (Deterministic Guardrail)',
      apiKeyConfigured: !!this.apiKey,
      capabilities: [
        'Multi-Tone Counter Offer Generation (Assertive, Relationship, Urgency, Hinglish)',
        'Zero-Hallucination Mathematical Guardrail Enforcement',
        'Multi-Turn WhatsApp Thread Summarizer',
        'Buyer Concession Elasticity Profiler',
        'B2B Wholesale Trade Tactics Advisor'
      ]
    };
  }

  async testApiKey(key) {
    try {
      const trimmed = key.trim();
      const discovered = await this.discoverBestModel(trimmed);
      const testClient = new GoogleGenerativeAI(trimmed);
      const model = testClient.getGenerativeModel(
        { model: discovered.model },
        { apiVersion: discovered.apiVersion }
      );
      const result = await model.generateContent("Reply with the word 'OK' if you can read this.");
      const response = await result.response;
      const text = response.text();
      return {
        success: true,
        message: `Gemini API connection verified successfully using model '${discovered.model}' (API: ${discovered.apiVersion}).`,
        model: discovered.model,
        apiVersion: discovered.apiVersion,
        text
      };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to authenticate with Gemini API.' };
    }
  }

  async updateApiKey(newKey) {
    const trimmed = (newKey || '').trim();
    if (!trimmed) {
      this.apiKey = null;
      this.client = null;
      return { success: true, message: 'Gemini API key cleared. Switched to Demo AI Heuristics Mode.' };
    }

    const test = await this.testApiKey(trimmed);
    if (!test.success) {
      throw new Error(`Invalid Gemini API Key: ${test.message}`);
    }

    this.modelName = test.model || 'gemini-1.5-flash';
    this.apiVersion = test.apiVersion || 'v1';
    this.initClient(trimmed, this.modelName, this.apiVersion);

    // Persist to .env file
    try {
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      if (envContent.includes('GEMINI_API_KEY=')) {
        envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${trimmed}`);
      } else {
        envContent += `\nGEMINI_API_KEY=${trimmed}\n`;
      }
      if (envContent.includes('GEMINI_MODEL=')) {
        envContent = envContent.replace(/GEMINI_MODEL=.*/g, `GEMINI_MODEL=${this.modelName}`);
      } else {
        envContent += `GEMINI_MODEL=${this.modelName}\n`;
      }
      if (envContent.includes('GEMINI_API_VERSION=')) {
        envContent = envContent.replace(/GEMINI_API_VERSION=.*/g, `GEMINI_API_VERSION=${this.apiVersion}`);
      } else {
        envContent += `GEMINI_API_VERSION=${this.apiVersion}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
      process.env.GEMINI_API_KEY = trimmed;
      process.env.GEMINI_MODEL = this.modelName;
      process.env.GEMINI_API_VERSION = this.apiVersion;
    } catch (fsErr) {
      console.warn('[Env file update notice]:', fsErr.message);
    }

    return {
      success: true,
      message: `Google Gemini live API activated successfully with model '${this.modelName}' (${this.apiVersion}).`,
      status: this.getAIStatus()
    };
  }

  /**
   * Generate multi-tone counter responses and strategic advice.
   */
  async generateNegotiationResponses({ customer, product, offerPrice, quantity = 1, evaluation, tone = 'relationship' }) {
    const customerName = customer?.name || 'Retail Partner';
    const customerCompany = customer?.company || 'Retail Enterprise';
    const customerFirstName = customerName.split(' ')[0] || 'Partner';
    const offer = Number(offerPrice);
    const cp = Number(evaluation.boundaries.costPrice);
    const floor = Number(evaluation.boundaries.absoluteLowerLimit);
    const pref = Number(evaluation.boundaries.preferredMinPrice);
    const target = Number(evaluation.boundaries.targetPrice);
    const counterPrice = Number(evaluation.suggestedCounterPrice);
    const recommendation = evaluation.recommendation; // 'ACCEPT' | 'COUNTER' | 'REJECT'

    // If Gemini client is active, call Google Generative AI
    if (this.client) {
      try {
        const systemPrompt = `You are an expert AI sales negotiator for an Indian B2B wholesale electronics and appliances distributor.
Your role is to craft persuasive, culturally authentic WhatsApp messages for dealing with retailers.

STRICT BUSINESS & PRICING RULES:
1. Recommendation from pricing engine: ${recommendation}.
2. Product: ${product.name}
3. Customer: ${customerName} (${customerCompany})
4. Quantity: ${quantity} units
5. Customer's current offer: ₹${offer.toLocaleString()}
6. Official target price: ₹${target.toLocaleString()}
7. Suggested counter price: ₹${counterPrice.toLocaleString()}
8. Absolute lower floor: ₹${floor.toLocaleString()} (DO NOT MENTION COST OR FLOOR NUMBERS DIRECTLY).
9. Rule compliance:
   - If REJECT: Politely but firmly reject the price. Explain landed cost/factory tier. Never accept below floor.
   - If COUNTER: Politely counter at ₹${counterPrice.toLocaleString()}. Highlight genuine warranty, GST invoice, quick warehouse dispatch, and trade value.
   - If ACCEPT: Enthusiastically confirm approval, reserve inventory, and ask for billing confirmation.

Requested Primary Tone: ${tone.toUpperCase()}
Tone options meaning:
- ASSERTIVE: Professional, firm on pricing, focuses on factory allocations and warranty authenticity.
- RELATIONSHIP: Warm Indian B2B tone (Namaste ji), emphasizes long-term volume partnership.
- URGENT: Fast closing, today's lot booking, ready-to-dispatch hub inventory.
- HINGLISH: Natural conversational Indian trade idiom (e.g. "Namaste ji, rate factory locked hai lekin aapke liye...").

TASK:
Provide your response in valid JSON with these fields:
{
  "primaryReply": "2-3 sentence message in the requested tone",
  "alternativeReplyA": "Alternative variant focusing on value and warranty",
  "alternativeReplyB": "Alternative quick-closer variant",
  "tactics": ["Bullet point tactic 1", "Bullet point tactic 2", "Bullet point tactic 3"],
  "winProbability": 75
}`;

        const gen = await this.generateWithFallback(systemPrompt, {
          temperature: 0.6,
          maxOutputTokens: 1200
        });

        if (gen && gen.text) {
          const jsonMatch = gen.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              isLiveAI: true,
              model: gen.model,
              tone,
              primaryReply: parsed.primaryReply,
              alternatives: [parsed.alternativeReplyA, parsed.alternativeReplyB].filter(Boolean),
              tactics: parsed.tactics || [],
              winProbability: parsed.winProbability || (recommendation === 'ACCEPT' ? 90 : recommendation === 'COUNTER' ? 65 : 20)
            };
          }
        }
      } catch (err) {
        console.warn('[Gemini Live Generation Error]:', err.message, 'Using deterministic heuristics.');
      }
    }

    // High-fidelity Deterministic Heuristics Fallback (Zero Hallucination Guaranteed)
    let primaryReply = '';
    let altA = '';
    let altB = '';
    let tactics = [];
    let winProbability = 60;

    if (recommendation === 'REJECT') {
      winProbability = 18;
      if (tone === 'assertive') {
        primaryReply = `Dear ${customerFirstName} ji, we have reviewed your offer of ₹${offer.toLocaleString()} for ${quantity} units of ${product.name}. Due to strictly controlled distributor landed costs, we cannot authorize this quote. The absolute best commercial concession we can offer is ₹${counterPrice.toLocaleString()} with official manufacturer warranty and 100% GST billing included.`;
      } else if (tone === 'hinglish') {
        primaryReply = `Namaste ${customerFirstName} ji, ₹${offer.toLocaleString()} me ${product.name} dena factory landed cost ki wajah se possible nahi ho payega. Aapke lot ke liye best rate ₹${counterPrice.toLocaleString()} final nikal sakta hai with proper GST bill aur warranty. Bataiye confirm karein?`;
      } else {
        primaryReply = `Namaste ${customerFirstName} ji, thank you for your inquiry on ${quantity} units of ${product.name}. Unfortunately, ₹${offer.toLocaleString()} is below our authorized distribution tier. The most competitive rate we can release this batch for is ₹${counterPrice.toLocaleString()} per unit with same-day hub dispatch.`;
      }

      altA = `Namaste ${customerFirstName} ji, while ₹${offer.toLocaleString()} cannot be accepted due to margin constraints, we can lock ₹${counterPrice.toLocaleString()} if you can increase the lot size or clear payment on delivery.`;
      altB = `Respected ${customerFirstName} ji, ${product.name} has heavy market demand and tight supply. The minimum clearance price is ₹${counterPrice.toLocaleString()} per unit with factory seal warranty.`;
      tactics = [
        `Do not concede on price below ₹${floor.toLocaleString()} — deal violates absolute floor.`,
        `Offer accessory bundle or free freight rather than cash discount.`,
        `Ask customer to increase order quantity to justify a higher tier.`
      ];
    } else if (recommendation === 'COUNTER') {
      winProbability = 68;
      if (tone === 'assertive') {
        primaryReply = `Dear ${customerFirstName} ji, thank you for your offer of ₹${offer.toLocaleString()} on ${quantity} units of ${product.name}. To maintain genuine distribution backing and transit insurance, we can meet you at ₹${counterPrice.toLocaleString()} per unit. Please confirm so we can allocate stock.`;
      } else if (tone === 'urgent') {
        primaryReply = `Namaste ${customerFirstName} ji, our warehouse is dispatching this afternoon's shipment. If we finalize ₹${counterPrice.toLocaleString()} for your ${quantity} units of ${product.name} within the next hour, I will ensure immediate loading and priority delivery.`;
      } else if (tone === 'hinglish') {
        primaryReply = `Namaste ${customerFirstName} ji, aapka offer dekha. Business relationship ko dekhte hue hum is deal ko ₹${counterPrice.toLocaleString()} per unit pe lock kar sakte hain. Stock ready hai central warehouse me, turant dispatch nikalwa denge.`;
      } else {
        primaryReply = `Namaste ${customerFirstName} ji, we appreciate your continued business. While ₹${offer.toLocaleString()} is slightly tight against our factory tier, we can close this lot immediately at ₹${counterPrice.toLocaleString()} per unit with full GST invoice and express dispatch. Let me know if we can lock this in today.`;
      }

      altA = `Namaste ${customerFirstName} ji, let us close at ₹${counterPrice.toLocaleString()} per unit. We will include complimentary transit insurance and priority warehouse batching.`;
      altB = `Dear ${customerFirstName} ji, counter-offering ₹${counterPrice.toLocaleString()} per unit for ${quantity} pcs of ${product.name}. If approved today, dispatched first thing tomorrow morning.`;
      tactics = [
        `Counter at ₹${counterPrice.toLocaleString()} to preserve gross profit of ₹${evaluation.metrics.grossProfit.toLocaleString()}.`,
        `Highlight fast dispatch and genuine brand warranty as value additions.`,
        `If buyer hesitates, offer 30-day payment term or 50% advance incentive.`
      ];
    } else {
      winProbability = 94;
      primaryReply = `Namaste ${customerFirstName} ji, your offer of ₹${offer.toLocaleString()} for ${quantity} units of ${product.name} is approved. We have reserved the batch in our warehouse with 100% GST billing and manufacturer warranty. Please confirm billing details so we can initiate shipment.`;
      altA = `Dear ${customerFirstName} ji, deal confirmed at ₹${offer.toLocaleString()} for ${quantity} units of ${product.name}. Generating your pro-forma invoice now for instant dispatch.`;
      altB = `Namaste ${customerFirstName} ji, delighted to partner on this order. ${quantity} units of ${product.name} allocated at ₹${offer.toLocaleString()}. Stock leaving our hub today!`;
      tactics = [
        `Instant acceptance recommended: lot margin is healthy at ${evaluation.metrics.grossMargin}%.`,
        `Send pro-forma quotation immediately to prevent buyer second-guessing.`,
        `Cross-sell high-margin complementary accessories or cables.`
      ];
    }

    return {
      isLiveAI: false,
      model: 'Demo AI Heuristics (Deterministic Engine)',
      tone,
      primaryReply,
      alternatives: [altA, altB],
      tactics,
      winProbability
    };
  }

  /**
   * Summarize WhatsApp conversation thread into structured deal briefs.
   */
  async summarizeConversation({ customerName, customerCompany, messages = [] }) {
    const messageHistory = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');

    if (this.client && messages.length > 0) {
      try {
        const prompt = `You are a sales operations analyst for a wholesale distributor.
Analyze this WhatsApp conversation thread between a wholesale salesperson and a retail buyer (${customerName} - ${customerCompany}):

CONVERSATION TRANSCRIPT:
${messageHistory}

Provide a JSON response with:
{
  "executiveSummary": "2 sentence executive summary of current negotiation stage",
  "buyerSentiment": "High Intent / Price Sensitive / Hesitant / Ready to Close",
  "keyObjections": ["List 2-3 key buyer concerns or requests"],
  "recommendedAction": "Single immediate actionable step for the salesperson"
}`;
        const gen = await this.generateWithFallback(prompt, { temperature: 0.4, maxOutputTokens: 1000 });
        if (gen && gen.text) {
          const jsonMatch = gen.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              isLiveAI: true,
              model: gen.model,
              ...parsed
            };
          }
        }
      } catch (err) {
        console.warn('[Gemini Summarizer Warning]:', err.message);
      }
    }

    // Heuristics summary
    const msgCount = messages.length;
    const lastCustomerMsg = [...messages].reverse().find(m => m.sender === 'customer');

    return {
      isLiveAI: false,
      executiveSummary: `${customerName} (${customerCompany}) has exchanged ${msgCount} messages regarding pricing and product availability. Current stage indicates active wholesale bargaining.`,
      buyerSentiment: msgCount > 4 ? 'High Intent & Price Sensitive' : 'Initial Inquiry',
      keyObjections: [
        lastCustomerMsg ? `Latest customer message: "${lastCustomerMsg.text.slice(0, 60)}..."` : 'Seeking volume discounts',
        'Comparing quotes with alternative local distributors'
      ],
      recommendedAction: 'Send structured counter-offer with GST quotation link and 24-hour stock lock.'
    };
  }

  /**
   * Analyze customer concession psychology & elasticity.
   */
  async analyzeBuyerProfile({ customer, negotiations = [] }) {
    const totalDeals = negotiations.length;
    const closedDeals = negotiations.filter(n => n.status === 'Approved').length;
    const winRate = totalDeals > 0 ? Math.round((closedDeals / totalDeals) * 100) : 70;

    let elasticity = 'Medium';
    let concessionSpeed = '2 to 3 rounds';
    let buyerArchetype = 'Relationship Wholesale Partner';

    if (customer?.budget && customer.budget > 1000000) {
      buyerArchetype = 'High-Volume Enterprise Account';
      elasticity = 'Low (Value & SLA focused)';
    } else if (winRate < 50) {
      elasticity = 'High (Strictly price-sensitive bargain hunter)';
      concessionSpeed = '3+ rounds with heavy pushback';
    }

    return {
      customerName: customer?.name || 'Customer',
      company: customer?.company || 'Retailer',
      leadStatus: customer?.leadStatus || 'Active',
      budget: customer?.budget || 0,
      winRate: `${winRate}% (${closedDeals}/${totalDeals} deals closed)`,
      buyerArchetype,
      priceElasticity: elasticity,
      expectedConcessionRounds: concessionSpeed,
      keyRecommendation: `For ${customer?.name || 'this buyer'}, lead with factory warranty and GST billing reliability. When countering, offer payment flexibility (e.g. 50% advance) rather than eroding gross margin.`
    };
  }
}

export const aiService = new AIService();
