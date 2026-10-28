# AI-CRM — Smart Wholesale & Retail Sales Intelligence

> AI-CRM is a specialized B2B sales intelligence CRM designed for wholesale distributors and retail merchants. It automates pricing negotiations, strictly guards gross margins against loss-making quotes, and drives deal closing on WhatsApp.

---

## Evaluation Quick Start

### 1. Running the System
Both the backend and frontend are already running locally:
- **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:5001](http://localhost:5001) (Health Check: [http://localhost:5001/api/health](http://localhost:5001/api/health))

To run from a fresh terminal:
```bash
# Start Backend (Port 5001)
cd backend
npm install
npm run dev

# In a second terminal, start Frontend (Port 3000)
cd frontend
npm install
npm run dev
```

### 2. Demo Evaluation Account
A pre-configured demo account with seed catalog items, customers, and negotiations is available. You can also click the **"1-Click Auto-Fill Demo Credentials"** button on the Login page:

| Field | Value |
|---|---|
| **Email** | `demo@aicrm.com` |
| **Password** | `demo123` |
| **Role** | Wholesale & Retail Director |
| **Company** | Apex Wholesale & Retail Enterprises |

---

## Key Features & Verified Workflows

### 1. Landing Page (`/`)
- Modern SaaS aesthetic with glassmorphism, gradient accents, and dark mode.
- Interactive live pricing guard simulator on the hero section.
- Feature showcases: Hard Floor Protection, WhatsApp Deal Desk, Gemini AI Strategist, Real-Time Analytics.
- Interactive FAQ accordion and responsive footer.

### 2. Mock Authentication & Route Protection
- Protected workspace routes (`/dashboard`, `/products`, `/customers`, `/negotiations`, `/conversations`).
- Public routes (`/login`, `/signup`, `/`) with automatic redirects.
- Session persistence in `localStorage` with mock Bearer token authorization header.
- Reset seed data button available across the app.

### 3. Products Catalog & Inventory Management (`/products`)
- Search by product name or SKU, filter by category.
- Add, Edit, View Details, and Delete products.
- **Backend Pricing Boundary Validation**:
  $$\text{Cost Price} < \text{Absolute Lower Limit} \le \text{Preferred Minimum} \le \text{Target Price}$$
- Visual Pricing Ladder bar verifying rule compliance in real-time.
- Gross margin percentages calculated at target, preferred, and floor prices.

### 4. Customers & Wholesale Accounts (`/customers`)
- Search and filter by lead status (`Active Lead`, `Qualified`, `Under Negotiation`, `Closed Won`, `Inactive`).
- Full CRUD operations with phone, email, budget (₹), commercial preferences, and internal notes.
- Interested product tags and previous negotiation count.
- Direct quick actions: **"Negotiate"**, **"WhatsApp"**, and **"Schedule Follow-up"**.

### 5. Dynamic Dashboard & Analytics (`/dashboard`)
- 8 KPI cards derived live from mock database: Total Customers, Catalog Products, Active Leads, Pending Reminders, Realized Revenue, Realized Gross Profit, Completed Deals, Conversion Rate.
- Recharts visualizations: Monthly sales & profit trends (Area/Bar chart) and Category distribution (Pie chart).
- Recent negotiations table with AI recommendations.
- Upcoming follow-up reminders list with 1-click completion toggle.

### 6. Rule-Bound AI Negotiation Desk (`/negotiations`)
- Customer and Product selectors with quantity inputs and customer offer price.
- **Strict Pricing Guardrail**:
  - `Offer < Absolute Lower Limit` $\rightarrow$ **REJECT** (Approve button disabled, deal strictly blocked).
  - `Absolute Lower Limit <= Offer < Preferred Minimum` $\rightarrow$ **COUNTER** (Suggests counter towards preferred target).
  - `Offer >= Preferred Minimum` $\rightarrow$ **ACCEPT** (Healthy profit & margin).
- Real-time Gross Profit and Gross Margin calculations:
  $$\text{Gross Profit} = (\text{Selling Price} - \text{Cost Price}) \times \text{Quantity}$$
  $$\text{Gross Margin} = \left(\frac{\text{Selling Price} - \text{Cost Price}}{\text{Selling Price}}\right) \times 100$$
- AI suggested counter-reply powered by Gemini 1.5 Flash (or deterministic Demo AI Heuristics mode).
- Editable suggested reply and multi-round negotiation timeline audit.

### 7. WhatsApp Integration Workspace (`/conversations`)
- Dedicated WhatsApp Web-style interface.
- Clear **Simulation Mode** badge: simulated messages are marked explicitly without fake network delivery claims.
- Incoming message simulator allowing evaluators to inject customer inquiries.
- Automated phone number matching to existing customer accounts.
- AI reply drafter with salesperson approval button before sending.
- Background `ReminderWorker` running periodically to check due follow-ups.

---

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS v3.4, React Router v6, Lucide React, Recharts.
- **Backend**: Node.js, Express.js (ES Modules), In-memory `dataService`, REST API.
- **AI Engine**: Gemini 1.5 Flash API with fallback to rule-bound Demo Heuristics mode.
- **WhatsApp**: Clean service abstraction supporting simulation mode and live adapters.

---

## Future Supabase Migration (Phase 2)
The entire codebase is structured to swap mock services for Supabase with **zero UI rewrites**:
- See [`docs/SUPABASE_MIGRATION.md`](docs/SUPABASE_MIGRATION.md) for PostgreSQL schema, RLS policies, and service implementation details.
- See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for architectural specifications.
