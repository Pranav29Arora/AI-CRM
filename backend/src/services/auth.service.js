import { dataService } from './data.service.js';

/**
 * AuthService - Mock authentication service.
 *
 * NOTE FOR FUTURE SUPABASE MIGRATION:
 * When migrating to Supabase, this service will wrap:
 * - supabase.auth.signInWithPassword({ email, password })
 * - supabase.auth.signUp({ email, password, options: { data: { name, company } } })
 * - supabase.auth.signOut()
 * - supabase.auth.getUser()
 *
 * The API endpoints and frontend will not need to change their method contracts.
 */

class AuthService {
  // Simple token generation for development demonstration
  generateMockToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  verifyMockToken(token) {
    try {
      if (!token) return null;

      // Handle Firebase ID Token (JWT with 3 dot-separated parts)
      if (token.split('.').length === 3) {
        const payloadBase64 = token.split('.')[1];
        const json = Buffer.from(payloadBase64, 'base64').toString('utf8');
        const payload = JSON.parse(json);

        // Check JWT expiration (exp is in seconds)
        const isExpired = payload.exp && (payload.exp * 1000 < Date.now());
        if (isExpired) {
          if (process.env.NODE_ENV === 'production') {
            return null;
          }
          console.warn(`[Auth Warning] Firebase token expired for ${payload.email}, but session permitted in development mode.`);
        }

        return {
          id: payload.user_id || payload.sub,
          email: payload.email,
          name: payload.name || payload.email?.split('@')[0] || "Wholesale Director",
          role: "Wholesale & Retail Director"
        };
      }

      // Handle base64 fallback token
      const json = Buffer.from(token, 'base64').toString('utf8');
      const payload = JSON.parse(json);
      const isExpired = payload.exp && (payload.exp < Date.now());
      if (isExpired) {
        if (process.env.NODE_ENV === 'production') {
          return null;
        }
        console.warn(`[Auth Warning] Fallback token expired for ${payload.email}, but session permitted in development mode.`);
      }
      return payload;
    } catch {
      return null;
    }
  }

  async login(email, password) {
    if (!email || !password) {
      const err = new Error("Email and password are required.");
      err.status = 400;
      throw err;
    }

    const user = dataService.findUserByEmail(email.trim());
    if (!user) {
      const err = new Error("Invalid email or password.");
      err.status = 401;
      throw err;
    }

    // Check mock password
    if (user.password !== password.trim()) {
      const err = new Error("Invalid email or password.");
      err.status = 401;
      throw err;
    }

    const { password: _, ...safeUser } = user;
    const token = this.generateMockToken(safeUser);

    return {
      user: safeUser,
      token,
      message: "Login successful (Demo Mode)"
    };
  }

  async signup(name, email, password, company = "") {
    if (!name || !email || !password) {
      const err = new Error("Name, email, and password are required.");
      err.status = 400;
      throw err;
    }

    if (password.length < 6) {
      const err = new Error("Password must be at least 6 characters long.");
      err.status = 400;
      throw err;
    }

    const existing = dataService.findUserByEmail(email.trim());
    if (existing) {
      const err = new Error("An account with this email already exists.");
      err.status = 409;
      throw err;
    }

    const newUser = dataService.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      company: company.trim() || "Retail & Wholesale Enterprise",
      role: "Sales Executive"
    });

    const { password: _, ...safeUser } = newUser;
    const token = this.generateMockToken(safeUser);

    return {
      user: safeUser,
      token,
      message: "Account created successfully (Demo Mode)"
    };
  }

  async getCurrentUser(token) {
    const payload = this.verifyMockToken(token);
    if (!payload) {
      const err = new Error("Invalid or expired session.");
      err.status = 401;
      throw err;
    }

    let user = dataService.findUserById(payload.id);
    if (!user && payload.email) {
      user = dataService.findUserByEmail(payload.email);
    }
    if (!user) {
      user = {
        id: payload.id,
        email: payload.email,
        name: payload.name || "Wholesale Director",
        role: payload.role || "Wholesale & Retail Director",
        company: "Apex Wholesale & Retail Enterprises",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
      };
    }

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  getDemoCredentials() {
    return {
      email: "demo@aicrm.com",
      password: "demo123",
      role: "Wholesale & Retail Director",
      description: "Pre-configured account with existing product catalog, customers, and active negotiations."
    };
  }
}

export const authService = new AuthService();
