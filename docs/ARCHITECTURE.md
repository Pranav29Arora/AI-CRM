# AI-CRM Architecture & Design Specifications

## Overview
AI-CRM is a sales intelligence platform engineered specifically for high-volume wholesale distributors and retail merchants. Unlike generic CRMs that treat product pricing as static catalog numbers, AI-CRM introduces **Negotiable Pricing Boundaries** and **Margin Guardrails** that protect dealer gross margins while closing deals on WhatsApp.

---

## 1. Mathematical Pricing Constraint Engine

The backend enforces strict pricing bounds for every product catalog record and deal offer:

```
Cost Price (CP) < Absolute Lower Limit (Floor) <= Preferred Minimum (Pref) <= Target Price (Target)
```

### Business Rules
1. **Rule 1 — Hard Loss Guard**: `Cost Price > 0` and `Absolute Lower Limit > Cost Price`. A dealer can never sell below the cost price or at the cost price.
2. **Rule 2 — Tiered Structure**: `Preferred Minimum >= Absolute Lower Limit` and `Target Price >= Preferred Minimum`.
3. **Rule 3 — Hard Approval Rejection**: If a customer's offer is `< Absolute Lower Limit`, the deal **CANNOT be authorized or approved**. The system strictly blocks approval and returns HTTP 400.
4. **Rule 4 — Counter Negotiation**: If `Absolute Lower Limit <= Offer < Preferred Minimum`, the system recommends `COUNTER` and suggests a counter-price toward the preferred minimum. It can only be approved if the buyer refuses to increase the offer after negotiation.
5. **Rule 5 — Instant Acceptance**: If `Offer >= Preferred Minimum`, the system recommends `ACCEPT`.

### Formulas
- **Gross Profit**:
  $$\text{Gross Profit} = (\text{Selling Price} - \text{Cost Price}) \times \text{Quantity}$$
- **Gross Margin Percentage**:
  $$\text{Gross Margin} = \left(\frac{\text{Selling Price} - \text{Cost Price}}{\text{Selling Price}}\right) \times 100$$

---

## 2. Gemini AI Integration with Deterministic Guardrails

### Model Roles
- **Natural Language Fluency**: Gemini generates culturally tuned, respectful B2B negotiation replies (in English and Indian B2B trade idioms).
- **Zero Hallucination Guarantee**: The AI model is **never allowed to make financial decisions or change pricing boundaries**. The backend calculates the recommendation (`ACCEPT`, `COUNTER`, `REJECT`) and passes the mathematical parameters to Gemini.
- **Fallback Demo Mode**: When `GEMINI_API_KEY` is not present, the system automatically uses a deterministic, rule-bound demo heuristics response generator.

---

## 3. WhatsApp Integration Architecture

### Two-Tier Design
1. **Live Adapter (WAKit / WhatsApp Cloud API)**: Dispatches live messages via webhook and API when configured.
2. **Simulation Mode**: Clearly marked as simulated in the UI. Incoming inquiries can be simulated by the evaluator, and outgoing messages are recorded in the conversation stream without fake network delivery claims.

---

## 4. Background Reminder Scheduler
A non-blocking background worker (`ReminderWorker`) runs periodically every 30 seconds to evaluate pending follow-up deadlines and flag due reminders.
