import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initBackendAuth } from '../config/firebase.js';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import {
  seedUsers,
  seedProducts,
  seedCustomers,
  seedNegotiations,
  seedConversations,
  seedReminders
} from '../data/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DB_PATH = path.join(__dirname, '../data/db_local.json');

/**
 * DataService - Cloud Firestore Storage Layer for AI-CRM with Persistent Disk Backup.
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

    this.firestoreStatus = {
      connected: false,
      error: null,
      lastSync: null,
      projectId: 'ai-crm-f73a5',
      rulesUrl: 'https://console.firebase.google.com/project/ai-crm-f73a5/firestore/rules'
    };

    // Load persistent disk cache first so existing customers are never lost
    this.loadFromDisk();

    // Initialize & sync with Cloud Firestore
    this.initFirestore().catch(err => {
      console.warn('[Firestore Init Warning] Running with persistent local cache fallback:', err.message);
    });
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(LOCAL_DB_PATH)) {
        const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.customers) && data.customers.length > 0) {
          this.customers = data.customers;
        }
        if (Array.isArray(data.products) && data.products.length > 0) {
          this.products = data.products;
        }
        if (Array.isArray(data.negotiations) && data.negotiations.length > 0) {
          this.negotiations = data.negotiations;
        }
        if (Array.isArray(data.conversations) && data.conversations.length > 0) {
          this.conversations = data.conversations;
        }
        if (Array.isArray(data.reminders) && data.reminders.length > 0) {
          this.reminders = data.reminders;
        }
        console.log(`[Persistent Cache] Loaded ${this.customers.length} customers and ${this.products.length} products from disk.`);
      }
    } catch (e) {
      console.warn('[Persistent Cache Notice] Could not read db_local.json:', e.message);
    }
  }

  saveToDisk() {
    try {
      const payload = {
        customers: this.customers,
        products: this.products,
        negotiations: this.negotiations,
        conversations: this.conversations,
        reminders: this.reminders,
        lastSaved: new Date().toISOString()
      };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(payload, null, 2), 'utf8');
    } catch (e) {
      console.warn('[Persistent Cache Notice] Could not write db_local.json:', e.message);
    }
  }

  saveLocalDB() {
    this.saveToDisk();
  }

  getFirestoreStatus() {
    return {
      ...this.firestoreStatus,
      recordCounts: {
        customers: this.customers.length,
        products: this.products.length,
        negotiations: this.negotiations.length
      }
    };
  }

  async initFirestore() {
    try {
      console.log('[Firestore] Checking connection to project ai-crm-f73a5...');
      await initBackendAuth();
      await this.syncFromFirestore();
      await this.syncLocalToFirestore();
      this.setupRealtimeListeners();
      this.isInitialized = true;
      console.log(`[Firestore] Ready. Active catalog: ${this.products.length}, customers: ${this.customers.length}`);
    } catch (err) {
      this.firestoreStatus.connected = false;
      this.firestoreStatus.error = err.message;
      console.error('[Firestore Sync Error]:', err.message);
    }
  }

  // Safe non-destructive merge of remote Firestore documents and local cache
  mergeCollections(localList, remoteDocs) {
    if (!Array.isArray(localList)) localList = [];
    if (!remoteDocs || (Array.isArray(remoteDocs) && remoteDocs.length === 0)) return localList;

    const remoteMap = new Map();
    remoteDocs.forEach(d => {
      const data = typeof d.data === 'function' ? { id: d.id, ...d.data() } : d;
      if (data && data.id) {
        remoteMap.set(data.id, data);
      }
    });

    const merged = [];
    const processedIds = new Set();

    // 1. Process all remote items (updating if local is newer)
    for (const [id, remoteItem] of remoteMap.entries()) {
      const localItem = localList.find(x => x && x.id === id);
      if (!localItem) {
        merged.push(remoteItem);
      } else {
        const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt || 0).getTime();
        const localTime = new Date(localItem.updatedAt || localItem.createdAt || 0).getTime();
        merged.push(localTime > remoteTime ? localItem : remoteItem);
      }
      processedIds.add(id);
    }

    // 2. Preserve any local-only items that do not yet exist in remote Firestore
    for (const localItem of localList) {
      if (localItem && localItem.id && !processedIds.has(localItem.id)) {
        merged.push(localItem);
      }
    }

    return merged;
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

      if (!prodSnap.empty) {
        this.products = this.mergeCollections(this.products, prodSnap.docs);
      }
      if (!custSnap.empty) {
        this.customers = this.mergeCollections(this.customers, custSnap.docs);
      }
      if (!negSnap.empty) {
        this.negotiations = this.mergeCollections(this.negotiations, negSnap.docs);
      }
      if (!convSnap.empty) {
        this.conversations = this.mergeCollections(this.conversations, convSnap.docs);
      }
      if (!remSnap.empty) {
        this.reminders = this.mergeCollections(this.reminders, remSnap.docs);
      }
      if (!userSnap.empty) {
        this.users = this.mergeCollections(this.users, userSnap.docs);
      }

      this.saveToDisk();
      this.firestoreStatus.connected = true;
      this.firestoreStatus.error = null;
      this.firestoreStatus.lastSync = new Date().toISOString();
    } catch (err) {
      this.firestoreStatus.connected = false;
      this.firestoreStatus.error = err.message;
      if (err.code === 'permission-denied') {
        console.warn('\n========================================================================');
        console.warn('⚠️  [FIRESTORE PERMISSION DENIED]');
        console.warn('Cloud Firestore Security Rules on project "ai-crm-f73a5" are blocking access.');
        console.warn('To enable real-time Cloud Firestore updates:');
        console.warn('1. Open: https://console.firebase.google.com/project/ai-crm-f73a5/firestore/rules');
        console.warn('2. Paste the rules from firestore.rules and click Publish.');
        console.warn('Running safely in persistent disk fallback mode (zero data loss).');
        console.warn('========================================================================\n');
      } else {
        console.warn('[Firestore Sync Warning]:', err.message);
      }
    }
  }

  async syncLocalToFirestore() {
    if (!this.firestoreStatus.connected) return;
    try {
      console.log(`[Firestore] Syncing ${this.customers.length} local customers to Cloud Firestore...`);
      for (const cust of this.customers) {
        await setDoc(doc(db, 'customers', cust.id), cust, { merge: true });
      }
      console.log(`[Firestore] Synced ${this.customers.length} customers to Cloud Firestore.`);

      console.log(`[Firestore] Syncing ${this.products.length} local products to Cloud Firestore...`);
      for (const prod of this.products) {
        await setDoc(doc(db, 'products', prod.id), prod, { merge: true });
      }
      console.log(`[Firestore] Synced ${this.products.length} products to Cloud Firestore.`);
    } catch (err) {
      console.warn('[Firestore Local-to-Cloud Sync Notice]:', err.message);
    }
  }

  setupRealtimeListeners() {
    try {
      onSnapshot(collection(db, 'customers'), (snapshot) => {
        if (!snapshot.empty) {
          this.customers = this.mergeCollections(this.customers, snapshot.docs);
          this.saveToDisk();
          this.firestoreStatus.connected = true;
          this.firestoreStatus.error = null;
          this.firestoreStatus.lastSync = new Date().toISOString();
        }
      }, (err) => {
        this.firestoreStatus.connected = false;
        this.firestoreStatus.error = err.message;
      });

      onSnapshot(collection(db, 'products'), (snapshot) => {
        if (!snapshot.empty) {
          this.products = this.mergeCollections(this.products, snapshot.docs);
          this.saveToDisk();
          this.firestoreStatus.connected = true;
          this.firestoreStatus.error = null;
          this.firestoreStatus.lastSync = new Date().toISOString();
        }
      }, (err) => {
        this.firestoreStatus.connected = false;
        this.firestoreStatus.error = err.message;
      });
    } catch (e) {
      console.warn('[Firestore Realtime Setup Notice]:', e.message);
    }
  }

  async retryFirestoreSync() {
    console.log('[Firestore] Retrying connection and sync with Cloud Firestore...');
    await initBackendAuth();
    await this.syncFromFirestore();
    if (this.firestoreStatus.connected) {
      await this.syncLocalToFirestore();
      this.setupRealtimeListeners();
    }
    return this.getFirestoreStatus();
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

    this.saveToDisk();

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
    this.saveToDisk();

    console.log(`[Firestore] Successfully updated product "${updatedProduct.name}" (${id}) in Cloud Firestore.`);
    return updatedProduct;
  }

  async deleteProduct(id) {
    const index = this.products.findIndex(p => p.id === id);
    let removed = null;
    if (index >= 0) {
      removed = this.products.splice(index, 1)[0];
    }
    this.saveToDisk();

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
    this.saveToDisk();

    try {
      await setDoc(doc(db, 'customers', newCustomer.id), newCustomer);
      this.firestoreStatus.connected = true;
      this.firestoreStatus.error = null;
      this.firestoreStatus.lastSync = new Date().toISOString();
    } catch (err) {
      this.firestoreStatus.connected = false;
      this.firestoreStatus.error = err.message;
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
    this.saveToDisk();

    try {
      await updateDoc(doc(db, 'customers', id), this.customers[index]);
      this.firestoreStatus.connected = true;
      this.firestoreStatus.error = null;
      this.firestoreStatus.lastSync = new Date().toISOString();
    } catch (err) {
      this.firestoreStatus.connected = false;
      this.firestoreStatus.error = err.message;
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
    this.saveToDisk();

    try {
      await deleteDoc(doc(db, 'customers', id));
      this.firestoreStatus.connected = true;
      this.firestoreStatus.error = null;
      this.firestoreStatus.lastSync = new Date().toISOString();
    } catch (err) {
      this.firestoreStatus.connected = false;
      this.firestoreStatus.error = err.message;
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

  /**
   * Finalizes and records a Closed Won deal from WhatsApp Desk or Deal Desk.
   * Updates customer leadStatus, appends deal summary to customer notes,
   * records the accepted negotiation, marks conversation closed, and syncs to Firestore.
   */
  async recordClosedWonDeal({
    customerId,
    productId,
    finalPrice,
    quantity = 1,
    conversationId = null,
    source = 'WhatsApp Desk'
  }) {
    const customer = this.customers.find(c => c.id === customerId);
    const product = this.products.find(p => p.id === productId);

    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found.`);
    }

    const prodName = product ? product.name : (customer.interestedProducts?.[0]?.name || 'Wholesale Lot');
    const prodSku = product?.sku || customer.interestedProducts?.[0]?.sku || '';
    const sp = Number(finalPrice) > 0 ? Number(finalPrice) : Number(customer.budget || 0);
    const qty = Math.max(1, Number(quantity) || Number(customer.interestedProducts?.[0]?.quantity) || 1);
    const cp = product ? Number(product.costPrice || 0) : 0;
    const totalDealValue = sp * qty;
    const grossProfit = (sp - cp) * qty;
    const grossMargin = sp > 0 ? Number((((sp - cp) / sp) * 100).toFixed(2)) : 0;
    const timestamp = new Date().toISOString();

    // 1. Create or Update Negotiation with status "Accepted"
    let neg = this.negotiations.find(n => n.customerId === customerId && (n.productId === productId || n.productName === prodName));
    if (!neg) {
      neg = {
        id: `neg-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        productId: product ? product.id : (productId || ''),
        productName: prodName,
        currentOffer: sp,
        quantity: qty,
        costPrice: cp,
        grossProfit,
        grossMargin,
        status: "Accepted",
        recommendation: "ACCEPT",
        rounds: 3,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      this.negotiations.unshift(neg);
    } else {
      neg.status = "Accepted";
      neg.recommendation = "ACCEPT";
      neg.currentOffer = sp;
      neg.quantity = qty;
      neg.grossProfit = grossProfit;
      neg.grossMargin = grossMargin;
      neg.updatedAt = timestamp;
    }

    // 2. Update Customer Record: leadStatus -> "Closed Won" and append deal description
    const dateFormatted = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const dealSummary = `🏆 Closed Won via ${source}: ${qty} units of ${prodName} ${prodSku ? `(${prodSku}) ` : ''}@ ₹${sp.toLocaleString('en-IN')}/unit. Total Deal Value: ₹${totalDealValue.toLocaleString('en-IN')}. Lot Gross Profit: ₹${grossProfit.toLocaleString('en-IN')} (${grossMargin}% margin). Pro-forma invoice issued on ${dateFormatted}.`;

    customer.leadStatus = "Closed Won";
    customer.budget = sp;
    customer.previousNegotiations = Math.max(1, (customer.previousNegotiations || 0) + 1);

    // Append deal summary cleanly to notes
    if (!customer.notes || !customer.notes.trim()) {
      customer.notes = dealSummary;
    } else if (!customer.notes.includes(prodName) || !customer.notes.includes('Closed Won')) {
      customer.notes = `${customer.notes.trim()}\n\n${dealSummary}`;
    }
    customer.updatedAt = timestamp;

    // 3. Update Conversation if applicable
    let conversation = null;
    if (conversationId) {
      conversation = this.conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.isDealClosed = true;
        conversation.dealStatus = "Closed Won";
        conversation.closedDealDetails = {
          finalPrice: sp,
          quantity: qty,
          totalDealValue,
          grossProfit,
          grossMargin,
          productName: prodName,
          closedAt: timestamp
        };
      }
    }

    // 4. Save to Disk and sync to Cloud Firestore
    this.saveToDisk();

    try {
      const syncOps = [
        setDoc(doc(db, 'customers', customer.id), customer, { merge: true }),
        setDoc(doc(db, 'negotiations', neg.id), neg, { merge: true })
      ];
      if (conversation) {
        syncOps.push(setDoc(doc(db, 'conversations', conversation.id), conversation, { merge: true }));
      }
      await Promise.all(syncOps);
    } catch (err) {
      console.warn('[Firestore Record Closed Won Sync Notice]:', err.message);
    }

    return {
      success: true,
      customer,
      negotiation: neg,
      conversation,
      dealDetails: {
        customerName: customer.name,
        productName: prodName,
        quantity: qty,
        unitPrice: sp,
        totalDealValue,
        grossProfit,
        grossMargin,
        dealSummary
      }
    };
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
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: messageData.sender || "salesperson",
      text: messageData.text,
      timestamp: new Date().toISOString(),
      status: messageData.status || "sent",
      isAiGenerated: !!messageData.isAiGenerated,
      intent: messageData.intent || null,
      tacticApplied: messageData.tacticApplied || null,
      evaluatedPrice: messageData.evaluatedPrice || null
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage = newMessage.text;
    conversation.lastMessageTimestamp = newMessage.timestamp;

    this.saveLocalDB();

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
