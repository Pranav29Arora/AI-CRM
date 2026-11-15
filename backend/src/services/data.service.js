import { db } from '../config/firebase.js';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import {
  seedUsers,
  seedProducts,
  seedCustomers,
  seedNegotiations,
  seedConversations,
  seedReminders
} from '../data/seedData.js';

/**
 * DataService - Cloud Firestore Storage Layer for AI-CRM.
 * Connected to Firebase project: ai-crm-f73a5
 */

class DataService {
  constructor() {
    this.users = JSON.parse(JSON.stringify(seedUsers));
    this.products = JSON.parse(JSON.stringify(seedProducts));
    this.customers = JSON.parse(JSON.stringify(seedCustomers));
    this.negotiations = JSON.parse(JSON.stringify(seedNegotiations));
    this.conversations = JSON.parse(JSON.stringify(seedConversations));
    this.reminders = JSON.parse(JSON.stringify(seedReminders));
    this.isInitialized = false;

    // Initialize & sync with Cloud Firestore
    this.initFirestore().catch(err => {
      console.warn('[Firestore Init Warning] Running with local cache fallback:', err.message);
    });
  }

  async initFirestore() {
    try {
      console.log('[Firestore] Checking collections in ai-crm-f73a5...');
      await this.syncFromFirestore();
      this.isInitialized = true;
      console.log(`[Firestore] Ready. Active catalog: ${this.products.length}, customers: ${this.customers.length}`);
    } catch (err) {
      console.error('[Firestore Sync Error]:', err.message);
    }
  }

  async seedAllToFirestore() {
    try {
      await this.syncFromFirestore();
    } catch (err) {
      console.error('[Firestore Seeding Failed]:', err.message);
    }
  }

  async syncFromFirestore() {
    try {
      const [prodSnap, custSnap, negSnap, convSnap, remSnap, userSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'customers')),
        getDocs(collection(db, 'negotiations')),
        getDocs(collection(db, 'conversations')),
        getDocs(collection(db, 'reminders')),
        getDocs(collection(db, 'users'))
      ]);

      this.products = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.customers = custSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.negotiations = negSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.conversations = convSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.reminders = remSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.users = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn('[Firestore Sync Warning]:', err.message);
    }
  }

  async resetToSeed() {
    console.log('[Firestore] Clearing all collections...');
    const collectionsToClear = ['products', 'customers', 'negotiations', 'conversations', 'reminders'];
    for (const colName of collectionsToClear) {
      try {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (err) {
        console.warn(`[Firestore Clear Warning in ${colName}]:`, err.message);
      }
    }
    this.products = [];
    this.customers = [];
    this.negotiations = [];
    this.conversations = [];
    this.reminders = [];
    return true;
  }

  // --- Users ---
  findUserByEmail(email) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    return this.users.find(u => u.id === id);
  }

  async createUser(userData) {
    const newUser = {
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      role: "Sales Executive",
      ...userData
    };
    this.users.push(newUser);
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (err) {
      console.warn('[Firestore User Write Warning]:', err.message);
    }
    return newUser;
  }

  // --- Products ---
  async syncProducts() {
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (!snap.empty) {
        this.products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('[Firestore Product Sync Warning]:', err.message);
    }
    return this.products;
  }

  getAllProducts({ search, category } = {}) {
    let result = [...this.products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    if (category && category !== 'All') {
      result = result.filter(p => p.category === category);
    }
    return result;
  }

  async getProductById(id) {
    const cached = this.products.find(p => p.id === id);
    if (cached) return cached;

    try {
      const snap = await getDoc(doc(db, 'products', id));
      if (snap.exists()) {
        const prod = { id: snap.id, ...snap.data() };
        const idx = this.products.findIndex(p => p.id === id);
        if (idx >= 0) this.products[idx] = prod;
        else this.products.push(prod);
        return prod;
      }
    } catch (err) {
      console.warn('[Firestore getProductById Warning]:', err.message);
    }
    return this.products.find(p => p.id === id) || null;
  }

  validateProductPricing({ costPrice, absoluteLowerLimit, preferredMinPrice, targetPrice }) {
    const errors = [];
    if (costPrice <= 0) {
      errors.push("Cost price must be strictly greater than zero.");
    }
    if (absoluteLowerLimit <= costPrice) {
      errors.push("Absolute lower selling limit must be strictly greater than cost price.");
    }
    if (preferredMinPrice < absoluteLowerLimit) {
      errors.push("Preferred minimum selling price must be greater than or equal to the absolute lower limit.");
    }
    if (targetPrice < preferredMinPrice) {
      errors.push("Target selling price must be greater than or equal to the preferred minimum price.");
    }
    return errors;
  }

  async createProduct(productData) {
    const costPrice = Number(productData.costPrice);
    const absoluteLowerLimit = Number(productData.absoluteLowerLimit);
    const preferredMinPrice = Number(productData.preferredMinPrice);
    const targetPrice = Number(productData.targetPrice);

    const validationErrors = this.validateProductPricing({
      costPrice,
      absoluteLowerLimit,
      preferredMinPrice,
      targetPrice
    });

    if (validationErrors.length > 0) {
      const err = new Error(validationErrors.join(" "));
      err.status = 400;
      throw err;
    }

    const newProduct = {
      id: `prod-${Date.now()}`,
      name: productData.name.trim(),
      sku: (productData.sku || `SKU-${Date.now().toString().slice(-6)}`).toUpperCase().trim(),
      category: productData.category || "General",
      stock: Number(productData.stock) || 0,
      costPrice,
      absoluteLowerLimit,
      preferredMinPrice,
      targetPrice,
      description: productData.description || "",
      createdAt: new Date().toISOString()
    };

    // Commit to Cloud Firestore directly
    await setDoc(doc(db, 'products', newProduct.id), newProduct);

    // Keep memory cache updated
    this.products.unshift(newProduct);
    console.log(`[Firestore] Successfully created product "${newProduct.name}" (${newProduct.id}) in Cloud Firestore.`);

    return newProduct;
  }

  async bulkImportProducts(rawItems) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      const err = new Error("No products provided for import.");
      err.status = 400;
      throw err;
    }

    const created = [];
    const updated = [];
    const errors = [];

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const rowNum = i + 1;

      // Normalize field names (supports snake_case and camelCase)
      const name = (item.product_name || item.name || "").trim();
      const sku = (item.sku || "").trim().toUpperCase();
      const category = (item.category || "Consumer Electronics").trim();
      const stock = Number(item.quantity !== undefined ? item.quantity : (item.stock !== undefined ? item.stock : 0));
      const costPrice = Number(item.cost_price !== undefined ? item.cost_price : item.costPrice);
      const targetPrice = Number(item.target_price !== undefined ? item.target_price : item.targetPrice);
      const preferredMinPrice = Number(item.preferred_minimum !== undefined ? item.preferred_minimum : item.preferredMinPrice);
      const absoluteLowerLimit = Number(item.absolute_lower_limit !== undefined ? item.absolute_lower_limit : item.absoluteLowerLimit);
      const description = (item.description || "").trim();

      if (!name) {
        errors.push({ row: rowNum, sku, name: "Missing Name", error: "Product name is required." });
        continue;
      }

      if (isNaN(costPrice) || isNaN(targetPrice) || isNaN(preferredMinPrice) || isNaN(absoluteLowerLimit)) {
        errors.push({ row: rowNum, sku, name, error: "Pricing values must be valid numbers." });
        continue;
      }

      const pricingErrors = this.validateProductPricing({
        costPrice,
        absoluteLowerLimit,
        preferredMinPrice,
        targetPrice
      });

      if (pricingErrors.length > 0) {
        errors.push({ row: rowNum, sku, name, error: pricingErrors.join(" ") });
        continue;
      }

      // Check if product with this SKU already exists
      const existingIndex = sku ? this.products.findIndex(p => p.sku && p.sku.toUpperCase() === sku) : -1;

      if (existingIndex !== -1) {
        const existing = this.products[existingIndex];
        const updatedProduct = {
          ...existing,
          name,
          category,
          stock: isNaN(stock) ? existing.stock : stock,
          costPrice,
          absoluteLowerLimit,
          preferredMinPrice,
          targetPrice,
          description: description || existing.description,
          updatedAt: new Date().toISOString()
        };
        this.products[existingIndex] = updatedProduct;
        try {
          await setDoc(doc(db, 'products', updatedProduct.id), updatedProduct);
        } catch (err) {
          console.warn('[Firestore Bulk Update Warning]:', err.message);
        }
        updated.push(updatedProduct);
      } else {
        const newProduct = {
          id: `prod-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          sku: sku || `SKU-${Date.now().toString().slice(-6)}-${i}`,
          category,
          stock: isNaN(stock) ? 0 : stock,
          costPrice,
          absoluteLowerLimit,
          preferredMinPrice,
          targetPrice,
          description,
          createdAt: new Date().toISOString()
        };
        this.products.unshift(newProduct);
        try {
          await setDoc(doc(db, 'products', newProduct.id), newProduct);
        } catch (err) {
          console.warn('[Firestore Bulk Create Warning]:', err.message);
        }
        created.push(newProduct);
      }
    }

    return {
      success: true,
      totalProcessed: rawItems.length,
      createdCount: created.length,
      updatedCount: updated.length,
      errorCount: errors.length,
      created,
      updated,
      errors
    };
  }

  async updateProduct(id, productData) {
    let existing = this.products.find(p => p.id === id);
    if (!existing) {
      try {
        const snap = await getDoc(doc(db, 'products', id));
        if (snap.exists()) {
          existing = { id: snap.id, ...snap.data() };
          this.products.push(existing);
        }
      } catch (e) {
        console.warn('[Firestore Product Lookup Warning]:', e.message);
      }
    }

    if (!existing) {
      const err = new Error(`Product with ID ${id} not found.`);
      err.status = 404;
      throw err;
    }

    const costPrice = productData.costPrice !== undefined ? Number(productData.costPrice) : existing.costPrice;
    const absoluteLowerLimit = productData.absoluteLowerLimit !== undefined ? Number(productData.absoluteLowerLimit) : existing.absoluteLowerLimit;
    const preferredMinPrice = productData.preferredMinPrice !== undefined ? Number(productData.preferredMinPrice) : existing.preferredMinPrice;
    const targetPrice = productData.targetPrice !== undefined ? Number(productData.targetPrice) : existing.targetPrice;

    const validationErrors = this.validateProductPricing({
      costPrice,
      absoluteLowerLimit,
      preferredMinPrice,
      targetPrice
    });

    if (validationErrors.length > 0) {
      const err = new Error(validationErrors.join(" "));
      err.status = 400;
      throw err;
    }

    const updatedProduct = {
      ...existing,
      ...productData,
      costPrice,
      absoluteLowerLimit,
      preferredMinPrice,
      targetPrice,
      stock: productData.stock !== undefined ? Number(productData.stock) : existing.stock,
      updatedAt: new Date().toISOString()
    };

    // Persist directly to Cloud Firestore
    await setDoc(doc(db, 'products', id), updatedProduct, { merge: true });

    // Update in-memory cache
    const index = this.products.findIndex(p => p.id === id);
    if (index >= 0) {
      this.products[index] = updatedProduct;
    } else {
      this.products.unshift(updatedProduct);
    }

    console.log(`[Firestore] Successfully updated product "${updatedProduct.name}" (${id}) in Cloud Firestore.`);
    return updatedProduct;
  }

  async deleteProduct(id) {
    const index = this.products.findIndex(p => p.id === id);
    let removed = null;
    if (index >= 0) {
      removed = this.products.splice(index, 1)[0];
    }

    // Delete directly from Cloud Firestore
    await deleteDoc(doc(db, 'products', id));

    console.log(`[Firestore] Successfully deleted product (${id}) from Cloud Firestore.`);
    return removed || { id, deleted: true };
  }

  // --- Customers ---
  getAllCustomers({ search, status } = {}) {
    let result = [...this.customers];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }
    if (status && status !== 'All') {
      result = result.filter(c => c.leadStatus === status);
    }
    return result;
  }

  getCustomerById(id) {
    return this.customers.find(c => c.id === id);
  }

  async createCustomer(customerData) {
    if (!customerData.name || !customerData.name.trim()) {
      const err = new Error("Customer name is required.");
      err.status = 400;
      throw err;
    }

    const newCustomer = {
      id: `cust-${Date.now()}`,
      name: customerData.name.trim(),
      company: customerData.company || "",
      phone: customerData.phone || "",
      email: customerData.email || "",
      budget: Number(customerData.budget) || 0,
      leadStatus: customerData.leadStatus || "Active Lead",
      preferences: customerData.preferences || "",
      notes: customerData.notes || "",
      interestedProducts: Array.isArray(customerData.interestedProducts) ? customerData.interestedProducts : [],
      previousNegotiations: 0,
      createdAt: new Date().toISOString()
    };

    this.customers.unshift(newCustomer);

    try {
      await setDoc(doc(db, 'customers', newCustomer.id), newCustomer);
    } catch (err) {
      console.warn('[Firestore Customer Write Warning]:', err.message);
    }

    return newCustomer;
  }

  async updateCustomer(id, customerData) {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) {
      const err = new Error(`Customer with ID ${id} not found.`);
      err.status = 404;
      throw err;
    }

    const existing = this.customers[index];
    this.customers[index] = {
      ...existing,
      ...customerData,
      budget: customerData.budget !== undefined ? Number(customerData.budget) : existing.budget,
      updatedAt: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, 'customers', id), this.customers[index]);
    } catch (err) {
      console.warn('[Firestore Customer Update Warning]:', err.message);
    }

    return this.customers[index];
  }

  async deleteCustomer(id) {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) {
      const err = new Error(`Customer with ID ${id} not found.`);
      err.status = 404;
      throw err;
    }
    const removed = this.customers.splice(index, 1)[0];

    try {
      await deleteDoc(doc(db, 'customers', id));
    } catch (err) {
      console.warn('[Firestore Customer Delete Warning]:', err.message);
    }

    return removed;
  }

  // --- Negotiations ---
  getAllNegotiations() {
    return [...this.negotiations];
  }

  getNegotiationById(id) {
    return this.negotiations.find(n => n.id === id);
  }

  async createNegotiation(negData) {
    const newNeg = {
      id: `neg-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...negData
    };
    this.negotiations.unshift(newNeg);

    try {
      await setDoc(doc(db, 'negotiations', newNeg.id), newNeg);
    } catch (err) {
      console.warn('[Firestore Negotiation Write Warning]:', err.message);
    }

    return newNeg;
  }

  async updateNegotiation(id, updateData) {
    const index = this.negotiations.findIndex(n => n.id === id);
    if (index === -1) {
      const err = new Error(`Negotiation with ID ${id} not found.`);
      err.status = 404;
      throw err;
    }
    this.negotiations[index] = {
      ...this.negotiations[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, 'negotiations', id), this.negotiations[index]);
    } catch (err) {
      console.warn('[Firestore Negotiation Update Warning]:', err.message);
    }

    return this.negotiations[index];
  }

  // --- Conversations & Messages ---
  getAllConversations() {
    return [...this.conversations];
  }

  getConversationById(id) {
    return this.conversations.find(c => c.id === id);
  }

  getConversationByCustomerId(customerId) {
    return this.conversations.find(c => c.customerId === customerId);
  }

  async addMessageToConversation(conversationId, messageData) {
    let conversation = this.conversations.find(c => c.id === conversationId);
    if (!conversation) {
      const err = new Error(`Conversation ${conversationId} not found.`);
      err.status = 404;
      throw err;
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: messageData.sender || "salesperson",
      text: messageData.text,
      timestamp: new Date().toISOString(),
      status: messageData.status || "sent"
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage = newMessage.text;
    conversation.lastMessageTimestamp = newMessage.timestamp;

    try {
      await setDoc(doc(db, 'conversations', conversationId), conversation);
    } catch (err) {
      console.warn('[Firestore Conversation Update Warning]:', err.message);
    }

    return { conversation, message: newMessage };
  }

  // --- Reminders ---
  getAllReminders() {
    return [...this.reminders];
  }

  async createReminder(data) {
    const reminder = {
      id: `rem-${Date.now()}`,
      status: "pending",
      priority: data.priority || "Medium",
      createdAt: new Date().toISOString(),
      ...data
    };
    this.reminders.unshift(reminder);

    try {
      await setDoc(doc(db, 'reminders', reminder.id), reminder);
    } catch (err) {
      console.warn('[Firestore Reminder Write Warning]:', err.message);
    }

    return reminder;
  }

  async updateReminder(id, data) {
    const index = this.reminders.findIndex(r => r.id === id);
    if (index === -1) {
      const err = new Error(`Reminder ${id} not found.`);
      err.status = 404;
      throw err;
    }
    this.reminders[index] = { ...this.reminders[index], ...data };

    try {
      await updateDoc(doc(db, 'reminders', id), this.reminders[index]);
    } catch (err) {
      console.warn('[Firestore Reminder Update Warning]:', err.message);
    }

    return this.reminders[index];
  }

  async deleteReminder(id) {
    const index = this.reminders.findIndex(r => r.id === id);
    if (index === -1) {
      const err = new Error(`Reminder ${id} not found.`);
      err.status = 404;
      throw err;
    }
    const removed = this.reminders.splice(index, 1)[0];

    try {
      await deleteDoc(doc(db, 'reminders', id));
    } catch (err) {
      console.warn('[Firestore Reminder Delete Warning]:', err.message);
    }

    return removed;
  }

  // --- Dashboard Analytics ---
  getDashboardAnalytics() {
    const totalCustomers = this.customers.length;
    const totalProducts = this.products.length;
    const activeLeads = this.customers.filter(c => c.leadStatus === "Active Lead" || c.leadStatus === "Under Negotiation").length;
    const pendingReminders = this.reminders.filter(r => r.status === "pending").length;
    const completedDeals = this.negotiations.filter(n => n.status === "Accepted").length;

    const revenue = this.negotiations
      .filter(n => n.status === "Accepted")
      .reduce((sum, n) => sum + (n.currentOffer * n.quantity), 0);

    const grossProfit = this.negotiations
      .filter(n => n.status === "Accepted")
      .reduce((sum, n) => sum + (n.grossProfit || 0), 0);

    const conversionRate = totalCustomers > 0
      ? Math.round((this.customers.filter(c => c.leadStatus === "Closed Won").length / totalCustomers) * 100)
      : 0;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(currentMonthIdx - i);
      const mName = months[d.getMonth()];
      last6Months.push({ month: mName, revenue: 0, profit: 0, deals: 0 });
    }

    this.negotiations
      .filter(n => n.status === "Accepted")
      .forEach(n => {
        const nDate = new Date(n.createdAt || Date.now());
        const mName = months[nDate.getMonth()];
        const match = last6Months.find(m => m.month === mName);
        if (match) {
          match.revenue += (n.currentOffer * n.quantity);
          match.profit += (n.grossProfit || 0);
          match.deals += 1;
        }
      });
    const monthlyTrends = last6Months;

    let categoryDistribution = [];
    if (this.products.length > 0) {
      const categoryCounts = {};
      this.products.forEach(p => {
        const cat = p.category || 'General';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      categoryDistribution = Object.entries(categoryCounts).map(([name, count]) => ({
        name,
        count,
        value: Math.round((count / this.products.length) * 100)
      }));
    }

    return {
      metrics: {
        totalCustomers,
        totalProducts,
        activeLeads,
        pendingReminders,
        completedDeals,
        revenue,
        grossProfit,
        conversionRate
      },
      monthlyTrends,
      categoryDistribution,
      recentNegotiations: this.negotiations.slice(0, 5),
      upcomingFollowups: this.reminders.filter(r => r.status === "pending").slice(0, 5),
      recentCustomers: this.customers.slice(0, 5),
      storageType: "Firebase Cloud Firestore",
      firebaseProjectId: "ai-crm-f73a5"
    };
  }
}

export const dataService = new DataService();
