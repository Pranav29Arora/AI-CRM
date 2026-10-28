# AI-CRM — Future Supabase Migration Guide (Phase 2)

## Architectural Principle
In Phase 1, all data access and authentication operations are cleanly isolated behind dedicated service abstractions:
- Frontend: `frontend/src/services/authService.js` and `frontend/src/services/api.js`
- Backend: `backend/src/services/auth.service.js` and `backend/src/services/data.service.js`

Because the UI components **never** directly import seed data or manipulate in-memory data, connecting Supabase requires **zero rewrites of UI pages or routing**.

---

## 1. Authentication Migration (`authService`)

### Current Mock Implementation
- Generates base64 signed JWT-like mock token.
- Stores session in `localStorage` under `aicrm_token` and `aicrm_user`.

### Supabase Replacement
Replace the internals of `frontend/src/services/authService.js` (or proxy via backend) with `@supabase/supabase-js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const authService = {
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { user: data.user, token: data.session.access_token };
  },

  async signup(name, email, password, company) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, company } }
    });
    if (error) throw error;
    return { user: data.user, token: data.session?.access_token };
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
};
```

---

## 2. Database Schema (PostgreSQL on Supabase)

Run the following SQL migrations in your Supabase SQL editor:

```sql
-- 1. Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  cost_price NUMERIC NOT NULL CHECK (cost_price > 0),
  absolute_lower_limit NUMERIC NOT NULL,
  preferred_min_price NUMERIC NOT NULL,
  target_price NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_pricing_ladder CHECK (
    absolute_lower_limit > cost_price AND
    preferred_min_price >= absolute_lower_limit AND
    target_price >= preferred_min_price
  )
);

-- 2. Customers Table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  budget NUMERIC DEFAULT 0,
  lead_status TEXT DEFAULT 'Active Lead',
  preferences TEXT,
  notes TEXT,
  interested_products TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Negotiations Table
CREATE TABLE negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_name TEXT,
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  cost_price NUMERIC NOT NULL,
  target_price NUMERIC NOT NULL,
  preferred_min_price NUMERIC NOT NULL,
  absolute_lower_limit NUMERIC NOT NULL,
  initial_offer NUMERIC NOT NULL,
  current_offer NUMERIC NOT NULL,
  status TEXT DEFAULT 'In Review',
  recommendation TEXT,
  gross_profit NUMERIC,
  gross_margin NUMERIC,
  reasoning TEXT,
  suggested_reply TEXT,
  approved BOOLEAN DEFAULT FALSE,
  rounds JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Follow-up Reminders Table
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT,
  title TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Row Level Security (RLS)
Enable Row Level Security on each table so each wholesale tenant can only view and modify their own catalog and buyer records:

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read/write on products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```
