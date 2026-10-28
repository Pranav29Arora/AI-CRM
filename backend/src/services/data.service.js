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
      const prodSnap = await getDocs(collection(db, 'products'));

      if (prodSnap.empty) {
        console.log('[Firestore] Database is empty. Seeding initial catalog, customers, and negotiations...');
        await this.seedAllToFirestore();
      } else {
        console.log(`[Firestore] Found ${prodSnap.size} existing products. Syncing local state with Firestore...`);
        await this.syncFromFirestore();
      }
      this.isInitialized = true;
      console.log('[Firestore] Live synchronization active.');
    } catch (err) {
      console.error('[Firestore Sync Error]:', err.message);
    }
  }

  async seedAllToFirestore() {
    try {
      // Products
      for (const p of seedProducts) {
        await setDoc(doc(db, 'products', p.id), p);
      }
      // Customers
      for (const c of seedCustomers) {
        await setDoc(doc(db, 'customers', c.id), c);
      }
      // Negotiations
      for (const n of seedNegotiations) {
        await setDoc(doc(db, 'negotiations', n.id), n);
      }
      // Conversations
      for (const conv of seedConversations) {
        await setDoc(doc(db, 'conversations', conv.id), conv);
      }
      // Reminders
      for (const r of seedReminders) {
        await setDoc(doc(db, 'reminders', r.id), r);
      }
      // Users
      for (const u of seedUsers) {
        await setDoc(doc(db, 'users', u.id), u);
      }

      await this.syncFromFirestore();
      console.log('[Firestore] Initial seed data successfully written to Cloud Firestore.');
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

      if (!prodSnap.empty) {
        this.products = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      if (!custSnap.empty) {
        this.customers = custSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      if (!negSnap.empty) {
        this.negotiations = negSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      if (!convSnap.empty) {
        this.conversations = convSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      if (!remSnap.empty) {
        this.reminders = remSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      if (!userSnap.empty) {
        this.users = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('[Firestore Sync Warning]:', err.message);
    }
  }

  async resetToSeed() {
    console.log('[Firestore] Resetting all collections to seed data...');
    this.users = JSON.parse(JSON.stringify(seedUsers));
    this.products = JSON.parse(JSON.stringify(seedProducts));
    this.customers = JSON.parse(JSON.stringify(seedCustomers));
    this.negotiations = JSON.parse(JSON.stringify(seedNegotiations));
    this.conversations = JSON.parse(JSON.stringify(seedConversations));
    this.reminders = JSON.parse(JSON.stringify(seedReminders));

    await this.seedAllToFirestore();
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
  getAllProducts({ search, category } = {}) {
    let result = [...this.products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (category && category !== 'All') {
      result = result.filter(p => p.category === category);
    }
    return result;
  }

  getProductById(id) {
    return this.products.find(p => p.id === id);
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

    this.products.unshift(newProduct);

    try {
      await setDoc(doc(db, 'products', newProduct.id), newProduct);
    } catch (err) {
      console.warn('[Firestore Product Write Warning]:', err.message);
    }

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
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      const err = new Error(`Product with ID ${id} not found.`);
      err.status = 404;
      throw err;
    }

    const existing = this.products[index];
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

    this.products[index] = {
      ...existing,
      ...productData,
      costPrice,
      absoluteLowerLimit,
      preferredMinPrice,
      targetPrice,
      stock: productData.stock !== undefined ? Number(productData.stock) : existing.stock,
      updatedAt: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, 'products', id), this.products[index]);
    } catch (err) {
      console.warn('[Firestore Product Update Warning]:', err.message);
    }

    return this.products[index];
  }

  async deleteProduct(id) {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      const err = new Error(`Product with ID ${id} not found.`);
      err.status = 404;
      throw err;
    }
    const removed = this.products.splice(index, 1)[0];

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      console.warn('[Firestore Product Delete Warning]:', err.message);
    }

    return removed;
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

    const monthlyTrends = [
      { month: 'Sep', revenue: 420000, profit: 54000, deals: 3 },
      { month: 'Oct', revenue: 680000, profit: 82000, deals: 5 },
      { month: 'Nov', revenue: 890000, profit: 114000, deals: 8 },
      { month: 'Dec', revenue: 1240000, profit: 168000, deals: 11 },
      { month: 'Jan', revenue: 980000, profit: 132000, deals: 9 },
      { month: 'Feb', revenue: Math.max(revenue, 750000), profit: Math.max(grossProfit, 98000), deals: Math.max(completedDeals, 6) }
    ];

    const categoryDistribution = [
      { name: 'Laptops & Computing', count: this.products.filter(p => p.category.includes('Laptop') || p.category.includes('Comput')).length || 1, value: 38 },
      { name: 'Consumer Electronics', count: this.products.filter(p => p.category.includes('Consumer') || p.category.includes('TV')).length || 1, value: 24 },
      { name: 'Appliances', count: this.products.filter(p => p.category.includes('Appliance')).length || 1, value: 18 },
      { name: 'Photography', count: this.products.filter(p => p.category.includes('Photo')).length || 1, value: 12 },
      { name: 'Audio & HiFi', count: this.products.filter(p => p.category.includes('Audio')).length || 1, value: 8 },
    ];

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
