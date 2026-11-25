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
6. Official target catalog price: ₹${target.toLocaleString()}
7. Suggested counter price to quote: ₹${counterPrice.toLocaleString()}
8. Absolute lower floor: ₹${floor.toLocaleString()} (DO NOT MENTION COST OR FLOOR NUMBERS DIRECTLY).
9. Commercial negotiation strategy:
   - If REJECT: Politely but firmly reject the price. Explain that this price violates authorized distributor minimums. Counter at ₹${counterPrice.toLocaleString()}.
   - If COUNTER:
     * If counter price equals target catalog price (₹${target.toLocaleString()}): Firmly anchor at the exact target rate ₹${target.toLocaleString()}. DO NOT give any discount on early attempts. Emphasize 100% genuine factory warranty, full GST input invoice, priority warehouse loading, and trade credibility.
     * If counter price is below target price (₹${counterPrice.toLocaleString()}): Concede minimally, explaining that we are extending a special commercial concession to ₹${counterPrice.toLocaleString()} to support our partnership while strictly retaining our wholesale margin. Emphasize value.
   - If ACCEPT: Enthusiastically confirm approval at ₹${offer.toLocaleString()}, reserve inventory, and ask for billing details for pro-forma issuance.

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
      const isTargetQuote = counterPrice >= target;
      if (isTargetQuote) {
        if (tone === 'assertive') {
          primaryReply = `Dear ${customerFirstName} ji, thank you for your offer of ₹${offer.toLocaleString()} on ${quantity} units of ${product.name}. Our official wholesale catalog rate is ₹${target.toLocaleString()} per unit. All units carry genuine manufacturer warranty, 100% GST input billing, and factory seal. We invite you to confirm your allocation at ₹${target.toLocaleString()}.`;
        } else if (tone === 'urgent') {
          primaryReply = `Namaste ${customerFirstName} ji, stock for ${product.name} is moving fast through our central hub. Our official catalog rate is ₹${target.toLocaleString()} per unit with same-day loading. Confirm at ₹${target.toLocaleString()} today so we can secure your consignment immediately.`;
        } else if (tone === 'hinglish') {
          primaryReply = `Namaste ${customerFirstName} ji, aapka ₹${offer.toLocaleString()} ka offer mila. Lekin ${product.name} ka official wholesale rate ₹${target.toLocaleString()} per unit chal raha hai with 100% GST bill aur brand warranty. Ready stock hai, ₹${target.toLocaleString()} pe confirm kijiye taaki turant dispatch nikalwa sakein.`;
        } else {
          primaryReply = `Namaste ${customerFirstName} ji, thank you for reaching out regarding ${quantity} units of ${product.name}. Our authorized distributor catalog rate is ₹${target.toLocaleString()} per unit with full brand warranty and priority warehouse dispatch. Let us finalize this lot at ₹${target.toLocaleString()} and dispatch today!`;
        }
      } else {
        if (tone === 'assertive') {
          primaryReply = `Dear ${customerFirstName} ji, regarding your offer of ₹${offer.toLocaleString()} on ${quantity} units of ${product.name}: to support our business relationship, we can make a special commercial concession and meet you at ₹${counterPrice.toLocaleString()} per unit. This includes full factory warranty and 100% GST billing.`;
        } else if (tone === 'urgent') {
          primaryReply = `Namaste ${customerFirstName} ji, our warehouse is preparing dispatch. To close this deal today, we can offer an exclusive counter of ₹${counterPrice.toLocaleString()} per unit for your ${quantity} units of ${product.name} if confirmed within the hour.`;
        } else if (tone === 'hinglish') {
          primaryReply = `Namaste ${customerFirstName} ji, aapke sath long-term business dekh kar hum special concession dete hue deal ₹${counterPrice.toLocaleString()} per unit pe close karne ko taiyar hain. Full GST bill aur factory warranty milegi. Bataiye invoice bhej dein?`;
        } else {
          primaryReply = `Namaste ${customerFirstName} ji, we appreciate your continued business. While ₹${offer.toLocaleString()} is below our standard wholesale margin corridor, we value our partnership and can extend a special dealer concession to ₹${counterPrice.toLocaleString()} per unit. Shall I generate the pro-forma invoice at this rate?`;
        }
      }

      altA = `Namaste ${customerFirstName} ji, let us close at ₹${counterPrice.toLocaleString()} per unit. We will include complimentary transit insurance and priority warehouse batching.`;
      altB = `Dear ${customerFirstName} ji, counter-offering ₹${counterPrice.toLocaleString()} per unit for ${quantity} pcs of ${product.name}. If approved today, dispatched first thing tomorrow morning.`;
      tactics = [
        isTargetQuote
          ? `Anchor firmly at exact target catalog rate of ₹${target.toLocaleString()} to capture maximum profit.`
          : `Counter at ₹${counterPrice.toLocaleString()} (strictly retaining majority of surplus above customer offer).`,
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

  /**
   * Generates a formal Indian B2B wholesale opening message to initiate WhatsApp deal outreach.
   * "hello Name, you enquired about this product and whatsover offers"
   */
  /**
   * Generates a formal Indian B2B wholesale opening message to initiate WhatsApp deal outreach.
   * Quotes the distributor's official target catalog price as the opening benchmark to begin negotiations.
   */
  async generateOpeningOutreach({ customer, product, offeredPrice, quantity = 1, tone = 'formal' }) {
    const customerFirstName = customer?.name ? customer.name.split(' ')[0] : 'Partner';
    const customerFullName = customer?.name || 'Valued Partner';
    const productName = product?.name || 'Wholesale Lot';
    const qty = Number(quantity) || 1;

    // The distributor ALWAYS anchors the opening outreach at the target catalog price
    const targetRate = Number(product?.targetPrice || product?.preferredMinPrice || 0);
    const formattedTargetRate = targetRate.toLocaleString('en-IN');
    const customerBudget = Number(offeredPrice) || Number(customer?.budget) || 0;

    // Attempt Live Gemini generation
    if (this.client) {
      try {
        const prompt = `You are a professional B2B wholesale account executive representing an authorized electronics and technology distributor in India.
Formulate a formal, respectful, and engaging WhatsApp opening outreach message to a retail client who enquired about stock.

IMPORTANT COMMERCIAL RULE:
The distributor ALWAYS opens negotiations by quoting the official wholesale catalog TARGET PRICE (₹${formattedTargetRate}/unit).
DO NOT accept or confirm any discounted inquiry budget on this first outreach! This opening message sets our target rate as the official commercial benchmark, after which bilateral negotiations begin.

BUYER CONTEXT:
- Buyer Name: ${customerFullName} (First Name: ${customerFirstName})
- Buyer Company: ${customer?.company || 'Retail Partner'}
- Inquired Product: ${productName} (SKU: ${product?.sku || 'N/A'})
- Requested Lot Quantity: ${qty} units
${customerBudget > 0 ? `- Buyer Initial Inquired Budget: ₹${customerBudget.toLocaleString('en-IN')}/unit (Do not accept this yet)` : ''}
- Official Wholesale Catalog Target Rate to Quote: ₹${formattedTargetRate} per unit
- Tone Style: ${tone} (Options: formal, relationship, assertive, urgent, hinglish)

INSTRUCTIONS:
1. Address the buyer politely with "ji" (e.g., "Dear ${customerFirstName} ji" or "Namaste ${customerFirstName} ji").
2. Reference their inquiry for ${qty} units of ${productName}.
3. Firmly state our official wholesale distributor rate of ₹${formattedTargetRate} per unit for this consignment.
4. Highlight authentic value propositions: 100% genuine factory-sealed stock, valid manufacturer warranty, full GST input tax invoice, and priority hub dispatch across India.
5. Conclude with a clear, courteous call to action inviting them to review this rate or let us know how they wish to proceed with the lot allocation.
6. 3-4 concise, high-impact sentences suitable for WhatsApp B2B trade.

Return ONLY a valid JSON object in this exact format:
{
  "openingMessage": "Complete formal WhatsApp message quoting ₹${formattedTargetRate}/unit",
  "tactics": ["Tactic 1", "Tactic 2"],
  "headline": "Brief 1-sentence descriptor of this outreach"
}`;

        const gen = await this.generateWithFallback(prompt, {
          temperature: 0.5,
          maxOutputTokens: 800
        });

        if (gen && gen.text) {
          const jsonMatch = gen.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              isLiveAI: true,
              model: gen.model,
              tone,
              openingMessage: parsed.openingMessage,
              tactics: parsed.tactics || [],
              headline: parsed.headline || 'Formal Wholesale Target Outreach'
            };
          }
        }
      } catch (err) {
        console.warn('[Gemini Opener Warning]:', err.message, 'Using deterministic fallback.');
      }
    }

    // High-fidelity Deterministic Heuristics Fallback (Zero Hallucination Guaranteed)
    let openingMessage = '';
    let headline = 'Formal B2B Wholesale Target Outreach';
    const tactics = [
      `Anchor initial discussion at official catalog target rate (₹${formattedTargetRate}) to protect gross margin.`,
      'Lead with authorized distributor backing, 100% GST input tax credit, and brand warranty.',
      'Invite retailer commercial feedback to commence negotiation from a strong margin foundation.'
    ];

    if (tone === 'formal') {
      headline = 'Executive Formal B2B Opening';
      openingMessage = `Dear ${customerFirstName} ji, thank you for reaching out to us regarding your requirement for ${qty} units of ${productName} (SKU: ${product?.sku || 'N/A'}). Our official wholesale distributor rate for this consignment is ₹${formattedTargetRate} per unit, which includes 100% genuine factory-sealed stock, valid manufacturer warranty, and full GST input tax invoice. Please let us know if you would like us to reserve this lot for priority dispatch.`;
    } else if (tone === 'assertive') {
      headline = 'Firm Commercial Target Outreach';
      openingMessage = `Dear ${customerFirstName} ji, regarding your wholesale inquiry for ${qty} units of ${productName}: our standard authorized distributor rate is ₹${formattedTargetRate} per unit with immediate allocation from our central hub. This quote includes full brand warranty and 100% GST input credit. Please let us know how you would like to proceed with this consignment.`;
    } else if (tone === 'urgent') {
      headline = 'Priority Warehouse Allocation Outreach';
      openingMessage = `Namaste ${customerFirstName} ji, regarding your wholesale inquiry for ${qty} units of ${productName}: central hub allocation is currently open at our official catalog rate of ₹${formattedTargetRate} per unit with same-day dispatch. As warehouse cutoffs approach, please confirm if we should lock this allocation with GST invoice for you today.`;
    } else if (tone === 'hinglish') {
      headline = 'B2B Trade Hinglish Outreach';
      openingMessage = `Namaste ${customerFirstName} ji, aapka ${productName} ke ${qty} units ka inquiry mila. Hamara official wholesale distributor rate ₹${formattedTargetRate}/unit hai, with 100% brand warranty, GST billing aur fast hub delivery. Batayein is rate par consignment book karein?`;
    } else {
      // Default: Trade / Relationship
      headline = 'Relationship Trade Target Outreach';
      openingMessage = `Namaste ${customerFirstName} ji, hope you are doing well. We noted your wholesale requirement for ${qty} units of ${productName}. Our official distributor rate is ₹${formattedTargetRate} per unit with 100% genuine factory-sealed stock and compliant GST input invoice. Please let us know your thoughts so we can begin processing your allocation.`;
    }

    return {
      isLiveAI: false,
      model: 'Demo AI Heuristics (Deterministic Engine)',
      tone,
      openingMessage,
      tactics,
      headline
    };
  }

  /**
   * Autonomous AI Sales Agent reply for multi-turn roleplay threads.
   * Evaluates buyer messages against deterministic margin guardrails.
   */
  async generateAutonomousChatReply({
    customer,
    product,
    threadMessages = [],
    latestBuyerMessage = '',
    evaluation,
    tone = 'relationship'
  }) {
    const customerFirstName = customer?.name ? customer.name.split(' ')[0] : 'Partner';
    const customerFullName = customer?.name || 'Valued Partner';
    const productName = product?.name || 'Wholesale Lot';
    const quantity = evaluation?.quantity || 1;

    const floor = evaluation?.boundaries?.absoluteLowerLimit || product?.absoluteLowerLimit || 0;
    const pref = evaluation?.boundaries?.preferredMinPrice || product?.preferredMinPrice || 0;
    const target = evaluation?.boundaries?.targetPrice || product?.targetPrice || 0;
    let counterPrice = evaluation?.suggestedCounterPrice || pref;
    const recommendation = evaluation?.recommendation || 'COUNTER';
    const evaluatedOffer = evaluation?.evaluatedOffer || pref;

    // Extract lowest previous distributor quote from thread messages to prevent reverse price escalation
    let lowestPreviousQuote = target;
    for (const msg of threadMessages) {
      if (msg.sender === 'salesperson' || msg.sender === 'assistant' || msg.isAiGenerated) {
        const text = msg.text || '';
        // Match phrases where salesperson actually quoted their rate/counter/offer
        // e.g. "rate is ₹X", "counter... ₹X", "meet you at ₹X", "can offer is ₹X", "quote is ₹X", "at ₹X per unit"
        const quotedMatches = [...text.matchAll(/(?:rate|counter|price|quote|concession|meet you at|lock at|offer is|can offer is|allocation at|consignments? at|per unit at|rate of)\s*(?:is|of|a)?\s*₹\s*([0-9,]+)/gi)];
        for (const m of quotedMatches) {
          const num = Number(m[1].replace(/[^0-9]/g, ''));
          if (num >= floor && num <= target + 5000) {
            if (num < lowestPreviousQuote) {
              lowestPreviousQuote = num;
            }
          }
        }
      }
    }

    // Never raise counter price higher than an earlier distributor quote in this thread
    if (counterPrice > lowestPreviousQuote) {
      counterPrice = lowestPreviousQuote;
    }

    // Detect intent keywords from latestBuyerMessage
    const lowerMsg = (latestBuyerMessage || '').toLowerCase().trim();
    let detectedIntent = 'PRICE_NEGOTIATION';

    // Strict Buyer Refusal / Rejection Detection
    const isBuyerRefusal = /^(no|nah|nahi|nope|never|not interested|deal off|cancel|drop it|leave it)\b|(\bno\b|\bnah\b|\bnahi\b|\bnot interested\b|\bcancel\b|\bdrop it\b|\bleave it\b|\bcan't do\b|\bcant do\b|\bwon't buy\b|\bwont buy\b|\bdon't want\b|\bdont want\b|\bmat bhejo\b|\bnahi chahiye\b)/i.test(lowerMsg);

    // Natural Deal Acceptance & Affirmation Detection
    const hasAcceptanceWords = /(deal done|confirm deal|agree|agreed|accept|accepted|send invoice|proforma|pro-forma|pi bhejo|deal lock|pack karo|confirm karo|deal pakki|order confirm|done deal|deal final|finalise|finalize|lock kar do|lock it in|book it|book kar do|proceed|go ahead|lets do it|let's do it|done hai|theek hai|chalega|bhej do|le lunga|aa raha hu)/i.test(lowerMsg);
    const hasPickupIntent = /(collect|pickup|pick up|take delivery|collection|coming to pick|be there to collect)/i.test(lowerMsg);
    const isAffirmative = /^(yes|sure|ok|okay|yep|yeah|fine|perfect|great|super|alright|done|haan|ha ji|yes sure|sure thing|sounds good)[\s!.,]*$/i.test(lowerMsg) ||
      /^(yes|sure|okay|ok|alright|perfect),?\s*(i will|i'll|we will|we'll|let's|lets|please|proceed|send|issue|generate|can collect|will collect|there to collect)/i.test(lowerMsg);
    const isAffirmativeWithPickup = hasPickupIntent && /(sure|yes|ok|okay|will|ready|soon|coming|i am|i will|be there)/i.test(lowerMsg);
    const hasCounterOfferOrCondition = /(\bbut\b|\bhowever\b|\bif you can\b|\bcan you do\b|\bdiscount\b|\bkam\b|\bless\b)/i.test(lowerMsg);

    const lastSalesMsg = [...threadMessages].reverse().find(m => m.sender === 'salesperson' || m.sender === 'assistant' || m.isAiGenerated);
    const salesAskedToClose = lastSalesMsg && /(pro-forma|invoice|lock|proceed|book|confirm|shall we|shall i|let me know if we can lock|at ₹)/i.test(lastSalesMsg.text || '');

    const isDealAcceptance = !isBuyerRefusal && !hasCounterOfferOrCondition && (
      hasAcceptanceWords ||
      isAffirmative ||
      isAffirmativeWithPickup ||
      (salesAskedToClose && (hasPickupIntent || /^(yes|sure|ok|okay|done|yep|yeah|fine|proceed|sounds good|great|alright)/i.test(lowerMsg)))
    );

    if (isBuyerRefusal) {
      detectedIntent = 'BUYER_REFUSAL';
    } else if (isDealAcceptance) {
      detectedIntent = 'DEAL_ACCEPTANCE';
    } else if (/(competitor|market rate|dusra dealer|cheaper|doosre)/i.test(lowerMsg)) {
      detectedIntent = 'COMPETITOR_PRESSURE';
    } else if (/(free delivery|shipping|freight|transport|delivery free)/i.test(lowerMsg)) {
      detectedIntent = 'SHIPPING_REQUEST';
    } else if (/(credit|udhaar|15 days|30 days|payment terms|advance)/i.test(lowerMsg)) {
      detectedIntent = 'PAYMENT_TERMS';
    } else if (/(discount|kam karo|rate kam|best rate|concession|less)/i.test(lowerMsg)) {
      detectedIntent = 'DISCOUNT_REQUEST';
    }

    // Call Gemini if configured
    if (this.client) {
      try {
        const transcript = threadMessages
          .slice(-6)
          .map(m => `${m.sender.toUpperCase()}: ${m.text}`)
          .join('\n');

        const isTargetCounter = counterPrice >= target;

        const prompt = `You are an expert wholesale distributor sales agent in India negotiating on WhatsApp.
Your job is to respond to the buyer's latest message while STRICTLY defending margin guardrails.

STRICT PRICING RULES (CANNOT BE OVERRIDDEN):
- Product: ${productName} (Qty: ${quantity} units)
- Hard Floor Limit: ₹${floor.toLocaleString('en-IN')} (NEVER sell below this. Selling below floor is an absolute loss).
- Preferred Distributor Tier: ₹${pref.toLocaleString('en-IN')}
- Target Catalog Price: ₹${target.toLocaleString('en-IN')}
- System Recommendation: ${recommendation}
- Mandatory Counter Price to Quote: ₹${counterPrice.toLocaleString('en-IN')}

BUYER CONTEXT:
- Buyer: ${customerFullName} (First Name: ${customerFirstName})
- Buyer's Latest Message: "${latestBuyerMessage}"
- Detected Buyer Intent: ${detectedIntent}

RECENT CHAT TRANSCRIPT:
${transcript}

GUARDRAIL ENFORCEMENT & COMMERCIAL STRATEGY:
1. CRITICAL: If the buyer explicitly REFUSES or says "NO", "not interested", "nahi", "cancel" (Detected Intent: BUYER_REFUSAL):
   - Under NO CIRCUMSTANCES should you accept, confirm, or finalize the deal! Do NOT generate pro-forma invoices or celebrate acceptance.
   - Respectfully acknowledge their decision: "Namaste ji, we understand and respect your decision. If our rate doesn't fit your procurement right now, no problem at all..."
   - Leave the door open for future requirements or ask if they have another requirement in mind.
2. If recommendation is REJECT (offer is strictly below floor limit ₹${floor.toLocaleString('en-IN')}):
   - Politely but firmly reject the price. Explain that this price is below our authorized floor threshold. (Never claim it is below landed cost unless offer is literally below cost ₹${(product?.costPrice || floor).toLocaleString('en-IN')}).
   - Counter firmly at ₹${counterPrice.toLocaleString('en-IN')}.
   - Emphasize factory-sealed brand warranty, genuine GST input tax credit, and zero gray-market risk.
3. If recommendation is COUNTER (offer is below target catalog price ₹${target.toLocaleString('en-IN')}):
   - Acknowledge their message respectfully.
   ${isTargetCounter
     ? `- MANDATORY RULE: The counter price to quote is our official target catalog price of ₹${target.toLocaleString('en-IN')}. Firmly defend this full rate. DO NOT give any discount on early attempts. Explain that ₹${target.toLocaleString('en-IN')} is our official authorized rate with 100% genuine factory warranty, compliant GST input tax credit, and priority hub dispatch. Ask if they can confirm at ₹${target.toLocaleString('en-IN')}.`
     : `- MANDATORY RULE: Counter at EXACTLY ₹${counterPrice.toLocaleString('en-IN')}. Note that while their offer of ₹${evaluatedOffer.toLocaleString('en-IN')} is below our standard wholesale margin corridor, to support our business relationship, we are making a special commercial concession to meet them at ₹${counterPrice.toLocaleString('en-IN')} (retaining the majority of margin while granting a real concession). Emphasize full GST invoice and official brand warranty.`
   }
   - NEVER quote a price lower than ₹${counterPrice.toLocaleString('en-IN')} or higher than ₹${lowestPreviousQuote.toLocaleString('en-IN')}.
4. If buyer EXPLICITLY and ACTIVELY confirms/accepts the deal (Intent is DEAL_ACCEPTANCE, and buyer did NOT say no/refuse):
   - Enthusiastically confirm at ₹${(lowestPreviousQuote < target ? lowestPreviousQuote : evaluatedOffer).toLocaleString('en-IN')}.
   - If buyer states they will pick up or collect the product, warmly confirm that the factory-sealed lot is held ready for pickup/collection at the central warehouse/hub with 100% GST invoice and official warranty.
   - Request company GSTIN and billing address to issue official pro-forma invoice.
5. Tone: ${tone}. Use natural, professional Indian B2B trade conversational style with "ji". 2-4 sentences max.

Return ONLY a valid JSON object:
{
  "replyText": "Complete response message for WhatsApp",
  "intent": "${detectedIntent}",
  "tacticApplied": "1-sentence summary of commercial strategy used",
  "marginProtected": true
}`;

        const gen = await this.generateWithFallback(prompt, {
          temperature: 0.6,
          maxOutputTokens: 800
        });

        if (gen && gen.text) {
          const jsonMatch = gen.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              isLiveAI: true,
              model: gen.model,
              replyText: parsed.replyText,
              intent: parsed.intent || detectedIntent,
              tacticApplied: parsed.tacticApplied || (isTargetCounter ? `Defended Official Catalog Target Rate (₹${target.toLocaleString('en-IN')})` : `Commercial Concession Counter (₹${counterPrice.toLocaleString('en-IN')})`),
              recommendation,
              counterPrice,
              marginProtected: true
            };
          }
        }
      } catch (err) {
        console.warn('[Gemini Autonomous Chat Error]:', err.message, 'Falling back to deterministic engine.');
      }
    }

    // High-fidelity Deterministic Engine Fallback
    let replyText = '';
    let tacticApplied = '';
    const finalAgreedPrice = (detectedIntent === 'DEAL_ACCEPTANCE' && lowestPreviousQuote < target)
      ? lowestPreviousQuote
      : (evaluatedOffer >= floor ? evaluatedOffer : counterPrice);

    if (detectedIntent === 'BUYER_REFUSAL' || isBuyerRefusal) {
      tacticApplied = 'Respectful Refusal Acknowledgement';
      replyText = `Namaste ${customerFirstName} ji, we completely understand and respect your decision. If our rate of ₹${counterPrice.toLocaleString('en-IN')} doesn't fit your procurement budget right now, no problem at all. We will keep you updated on upcoming inventory allocations. Please feel free to reach out whenever you have fresh requirements!`;
    } else if (detectedIntent === 'DEAL_ACCEPTANCE' && !isBuyerRefusal) {
      if (hasPickupIntent) {
        tacticApplied = 'Deal Finalized & Central Hub Pickup Scheduled';
        replyText = `Namaste ${customerFirstName} ji, wonderful! We have confirmed and finalized your order for ${quantity} unit${quantity > 1 ? 's' : ''} of ${productName} at ₹${finalAgreedPrice.toLocaleString('en-IN')}. Your factory-sealed unit with 100% GST invoice and official brand warranty is being kept ready for collection at our central hub. Please share your billing details/GSTIN or let us know your estimated arrival time so we can have everything prepared for you!`;
      } else {
        tacticApplied = 'Deal Confirmation & Pro-forma Issuance';
        replyText = `Namaste ${customerFirstName} ji, wonderful! We are delighted to finalize this order for ${quantity} unit${quantity > 1 ? 's' : ''} of ${productName} at ₹${finalAgreedPrice.toLocaleString('en-IN')}/unit. We have earmarked this consignment in our central hub with 100% GST invoice and official brand warranty. Please share your delivery address and GSTIN so we can issue your pro-forma invoice immediately!`;
      }
    } else if (recommendation === 'REJECT') {
      tacticApplied = 'Floor Defense & Policy Rejection';
      if (detectedIntent === 'COMPETITOR_PRESSURE') {
        replyText = `Dear ${customerFirstName} ji, we understand other sources might quote aggressive rates, but please be cautious of unauthorized gray-market stocks without official brand warranty or valid GST input credit. Our lot is 100% factory-sealed with official manufacturer support. The absolute best commercial concession we can authorize is ₹${counterPrice.toLocaleString('en-IN')}/unit.`;
      } else {
        replyText = `Dear ${customerFirstName} ji, thank you for your counter. However, ₹${evaluatedOffer.toLocaleString('en-IN')} falls below our minimum authorized wholesale floor limit for factory-sealed stock, so we cannot authorize it. The lowest possible rate we can release this batch for is ₹${counterPrice.toLocaleString('en-IN')}/unit with full GST invoice and express hub dispatch. Let me know if we can lock this in today.`;
      }
    } else if (detectedIntent === 'SHIPPING_REQUEST') {
      tacticApplied = 'Value Bundle (Transit Insurance & Priority Loading)';
      replyText = `Namaste ${customerFirstName} ji, our wholesale margin is already factored at razor-thin distributor pricing. While we cannot absorb full freight on this lot, if we finalize at ₹${counterPrice.toLocaleString('en-IN')}/unit today, we will include complimentary transit insurance and priority warehouse loading at no extra cost.`;
    } else if (detectedIntent === 'PAYMENT_TERMS') {
      tacticApplied = 'Credit Policy Governance & Advance Concession';
      replyText = `Dear ${customerFirstName} ji, our standard wholesale policy requires 50% advance bank wire to lock the consignment with the balance due against lorry receipt (LR). On consistent monthly order volume, we will be glad to review formal credit terms with our finance desk. Let us close this lot at ₹${counterPrice.toLocaleString('en-IN')}.`;
    } else if (detectedIntent === 'COMPETITOR_PRESSURE') {
      tacticApplied = 'Authorized Channel Differentiation';
      replyText = `Namaste ${customerFirstName} ji, we fully respect market comparisons, but our stock carries direct manufacturer warranty, zero transit damage liability, and 100% compliant GST input tax credit. To respect our business relationship, we can meet you at ₹${counterPrice.toLocaleString('en-IN')}/unit for immediate dispatch.`;
    } else {
      // General Counter
      if (counterPrice >= target) {
        tacticApplied = `Defended Official Catalog Target Rate (₹${target.toLocaleString('en-IN')})`;
        replyText = `Namaste ${customerFirstName} ji, thank you for your offer of ₹${evaluatedOffer.toLocaleString('en-IN')}. However, our official authorized distributor catalog rate for ${productName} is ₹${target.toLocaleString('en-IN')} per unit. As an authorized distributor, all units come factory-sealed with full 100% GST input tax credit, direct manufacturer warranty, and same-day priority dispatch. Shall we proceed to book your consignment at ₹${target.toLocaleString('en-IN')}?`;
      } else {
        const retainedSurplus = counterPrice - evaluatedOffer;
        const concessionGiven = target - counterPrice;
        tacticApplied = `Commercial Concession Counter (₹${counterPrice.toLocaleString('en-IN')} - Retained ₹${retainedSurplus.toLocaleString('en-IN')} surplus above offer)`;
        replyText = `Namaste ${customerFirstName} ji, we appreciate your continued interest. While ₹${evaluatedOffer.toLocaleString('en-IN')} is below our standard wholesale margin corridor, to support our business relationship, we can make a special commercial concession and meet you at ₹${counterPrice.toLocaleString('en-IN')}/unit with 100% GST invoice and official brand warranty. Shall I generate the pro-forma invoice at ₹${counterPrice.toLocaleString('en-IN')}?`;
      }
    }

    return {
      isLiveAI: false,
      model: 'Demo AI Heuristics (Deterministic Engine)',
      replyText,
      intent: detectedIntent,
      tacticApplied,
      recommendation,
      counterPrice,
      marginProtected: true
    };
  }
}

export const aiService = new AIService();
