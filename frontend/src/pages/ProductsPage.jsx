import React, { useState, useEffect, useMemo } from 'react';
import { productService } from '../services/productService';
import {
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  X,
  TrendingUp,
  ShieldAlert,
  Loader2,
  ArrowRight,
  DollarSign,
  Tag,
  Layers,
  Sparkles,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { BulkImportModal } from '../components/products/BulkImportModal';

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active product for edit / view / delete
  const [activeProduct, setActiveProduct] = useState(null);

  // Form state
  const initialFormState = {
    name: '',
    sku: '',
    category: 'Consumer Electronics',
    stock: 20,
    costPrice: '',
    absoluteLowerLimit: '',
    preferredMinPrice: '',
    targetPrice: '',
    description: '',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const defaultCategories = [
    'All',
    'Consumer Electronics',
    'Laptops & Computing',
    'Photography & Video',
    'Commercial Appliances',
    'Tablets & Handhelds',
    'Audio & HiFi'
  ];

  const categories = useMemo(() => {
    const set = new Set(defaultCategories);
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts({
        search,
        category: selectedCategory,
      });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  // Pricing rule checks
  const validateForm = () => {
    const cp = Number(formData.costPrice);
    const floor = Number(formData.absoluteLowerLimit);
    const pref = Number(formData.preferredMinPrice);
    const target = Number(formData.targetPrice);

    if (!formData.name.trim()) return "Product title is required.";
    if (isNaN(cp) || cp <= 0) return "Cost price must be strictly greater than 0.";
    if (isNaN(floor) || floor <= cp) return "Absolute lower selling limit must be strictly greater than cost price.";
    if (isNaN(pref) || pref < floor) return "Preferred minimum price must be greater than or equal to the absolute lower limit.";
    if (isNaN(target) || target < pref) return "Target selling price must be greater than or equal to the preferred minimum price.";
    return null;
  };

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setActiveProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      stock: product.stock,
      costPrice: product.costPrice,
      absoluteLowerLimit: product.absoluteLowerLimit,
      preferredMinPrice: product.preferredMinPrice,
      targetPrice: product.targetPrice,
      description: product.description || '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenView = (product) => {
    setActiveProduct(product);
    setIsViewModalOpen(true);
  };

  const handleOpenDelete = (product) => {
    setActiveProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) {
      setFormError(errorMsg);
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      await productService.createProduct(formData);
      setIsAddModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.message || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) {
      setFormError(errorMsg);
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      await productService.updateProduct(activeProduct.id, formData);
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.message || "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      setSubmitting(true);
      await productService.deleteProduct(activeProduct.id);
      setIsDeleteModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert("Failed to delete product: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Pricing Rule Live Visualizer in Modals
  const renderPricingLadder = () => {
    const cp = Number(formData.costPrice) || 0;
    const floor = Number(formData.absoluteLowerLimit) || 0;
    const pref = Number(formData.preferredMinPrice) || 0;
    const target = Number(formData.targetPrice) || 0;

    const floorValid = floor > cp && cp > 0;
    const prefValid = pref >= floor && floorValid;
    const targetValid = target >= pref && prefValid;

    return (
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-brand-400" />
            Pricing Boundary Verification Ladder
          </span>
          <span>Cost &lt; Floor ≤ Preferred ≤ Target</span>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-1">
          <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
            <p className="text-[10px] text-slate-400 uppercase">Cost Price</p>
            <p className="font-mono font-bold text-slate-200 mt-0.5">₹{cp.toLocaleString()}</p>
            <span className="text-[9px] text-slate-500">Base</span>
          </div>

          <div className={`p-2 rounded-lg border ${floorValid ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-slate-800/50 border-rose-500/40 text-slate-400'}`}>
            <p className="text-[10px] uppercase font-semibold">Abs. Floor</p>
            <p className="font-mono font-bold mt-0.5 text-rose-400">₹{floor.toLocaleString()}</p>
            <span className="text-[9px] flex items-center gap-0.5 mt-0.5">
              {floorValid ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> : <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />}
              &gt; Cost
            </span>
          </div>

          <div className={`p-2 rounded-lg border ${prefValid ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-slate-800/50 border-amber-500/40 text-slate-400'}`}>
            <p className="text-[10px] uppercase font-semibold">Pref. Min</p>
            <p className="font-mono font-bold mt-0.5 text-amber-300">₹{pref.toLocaleString()}</p>
            <span className="text-[9px] flex items-center gap-0.5 mt-0.5">
              {prefValid ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> : <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />}
              ≥ Floor
            </span>
          </div>

          <div className={`p-2 rounded-lg border ${targetValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-800/50 border-emerald-500/40 text-slate-400'}`}>
            <p className="text-[10px] uppercase font-semibold">Target</p>
            <p className="font-mono font-bold mt-0.5 text-emerald-400">₹{target.toLocaleString()}</p>
            <span className="text-[9px] flex items-center gap-0.5 mt-0.5">
              {targetValid ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> : <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />}
              ≥ Pref
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Package className="w-6 h-6 text-brand-400" />
              Products & Inventory Catalog
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforce tiered wholesale price boundaries: Cost &lt; Absolute Floor ≤ Preferred Min ≤ Target Selling Price.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl transition-all hover:scale-105 shadow-sm group"
          >
            <Upload className="w-4 h-4 text-brand-400 group-hover:scale-110 transition-transform" />
            Bulk Import CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/25 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input block w-full pl-10 pr-4 py-2 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Category:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="glass-input px-3 py-2 text-xs rounded-xl bg-slate-900 border-slate-700 text-slate-200"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-slate-900 text-white">
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-2" />
          <p className="text-xs">Loading products catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center max-w-md mx-auto my-8 border border-slate-800">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No products found</h3>
          <p className="text-xs text-slate-400 mb-5">
            {search || selectedCategory !== 'All'
              ? 'Try adjusting your search criteria or category filter.'
              : 'Add your first inventory product with price guardrails.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all"
          >
            Add New Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => {
            const marginAtTarget = (((product.targetPrice - product.costPrice) / product.targetPrice) * 100).toFixed(1);
            const marginAtFloor = (((product.absoluteLowerLimit - product.costPrice) / product.absoluteLowerLimit) * 100).toFixed(1);

            return (
              <div
                key={product.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Category & Stock */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-brand-300 border border-slate-700/80">
                      {product.category}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      product.stock > 15
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : product.stock > 0
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {product.stock} in stock
                    </span>
                  </div>

                  {/* Title & SKU */}
                  <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 mb-4">SKU: {product.sku}</p>

                  {/* Pricing Boundary Matrix */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Cost Price</span>
                      <span className="font-mono font-semibold text-slate-300">₹{product.costPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-400/80 block">Absolute Floor</span>
                      <span className="font-mono font-bold text-rose-400">₹{product.absoluteLowerLimit.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400/80 block">Preferred Min</span>
                      <span className="font-mono font-semibold text-amber-300">₹{product.preferredMinPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400/80 block">Target Price</span>
                      <span className="font-mono font-bold text-emerald-400">₹{product.targetPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Profit Margins Strip */}
                  <div className="flex items-center justify-between text-[11px] px-1 text-slate-400 mb-4">
                    <span>Target Margin: <strong className="text-emerald-400">{marginAtTarget}%</strong></span>
                    <span>Floor Margin: <strong className="text-rose-400">{marginAtFloor}%</strong></span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenView(product)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                    title="View Product Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(product)}
                      className="p-1.5 text-slate-400 hover:text-brand-300 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(product)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-400" />
                Add Product with Price Guardrails
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sony WH-1000XM5 Headphones"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">SKU Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SNY-WH1000-XM5"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border-slate-700 text-white"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Initial Stock Units</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Price Boundaries Input Grid */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-brand-300 mb-2 uppercase tracking-wider">
                  Pricing Boundaries (in INR ₹)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">1. Cost Price</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 57000"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      className="glass-input block w-full px-3 py-2 text-xs rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-rose-300 mb-1">2. Absolute Floor</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 58000"
                      value={formData.absoluteLowerLimit}
                      onChange={(e) => setFormData({ ...formData, absoluteLowerLimit: e.target.value })}
                      className="glass-input block w-full px-3 py-2 text-xs rounded-xl font-mono text-rose-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-amber-300 mb-1">3. Preferred Min</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 60000"
                      value={formData.preferredMinPrice}
                      onChange={(e) => setFormData({ ...formData, preferredMinPrice: e.target.value })}
                      className="glass-input block w-full px-3 py-2 text-xs rounded-xl font-mono text-amber-300 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-emerald-300 mb-1">4. Target Price</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 65000"
                      value={formData.targetPrice}
                      onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                      className="glass-input block w-full px-3 py-2 text-xs rounded-xl font-mono text-emerald-400 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Ladder Visualizer */}
              {renderPricingLadder()}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Product Description / Notes</label>
                <textarea
                  rows="2"
                  placeholder="Key wholesale specifications, warranty notes, distributor pack sizes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/25 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Product to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-brand-400" />
                Edit Product & Boundaries
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border-slate-700 text-white"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Stock Units</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Price Boundaries */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-brand-300 mb-2 uppercase tracking-wider">
                  Pricing Boundaries (in INR ₹)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Cost Price</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      className="glass-input block w-full px-3 py-2 text-xs rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-rose-300 mb-1">Abs. Floor</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.absoluteLowerLimit}
                      onChange={(e) => setFormData({ ...formData, absoluteLowerLimit: e.target.value })}
                      className="glass-input block w-full px-3 py-2 text-xs rounded-xl font-mono text-rose-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-amber-300 mb-1">Pref. Min</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.preferredMinPrice}
                      onChange={(e) => setFormData({ ...formData, preferredMinPrice: e.target.value })}
                      className="glass-input block w-full px-3 py-2 text-xs rounded-xl font-mono text-amber-300 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-emerald-300 mb-1">Target Price</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.targetPrice}
                      onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                      className="glass-input block w-full px-3 py-2 text-xs rounded-xl font-mono text-emerald-400 font-bold"
                    />
                  </div>
                </div>
              </div>

              {renderPricingLadder()}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description / Notes</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/25 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PRODUCT DETAILS MODAL */}
      {isViewModalOpen && activeProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                  {activeProduct.category}
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">{activeProduct.name}</h2>
                <p className="text-xs font-mono text-slate-400">SKU: {activeProduct.sku}</p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Detailed Pricing Ladder Card */}
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Wholesale Margin Analysis
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Cost Price (Landing):</span>
                    <span className="font-mono font-bold text-slate-200">₹{activeProduct.costPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <div>
                      <span className="text-rose-400 font-semibold">Absolute Lower Limit (Floor):</span>
                      <p className="text-[10px] text-slate-500">Gross profit: ₹{(activeProduct.absoluteLowerLimit - activeProduct.costPrice).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-400">₹{activeProduct.absoluteLowerLimit.toLocaleString()}</span>
                      <span className="block text-[10px] text-rose-400 font-mono">
                        {(((activeProduct.absoluteLowerLimit - activeProduct.costPrice) / activeProduct.absoluteLowerLimit) * 100).toFixed(1)}% margin
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <div>
                      <span className="text-amber-300 font-semibold">Preferred Minimum Price:</span>
                      <p className="text-[10px] text-slate-500">Gross profit: ₹{(activeProduct.preferredMinPrice - activeProduct.costPrice).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-300">₹{activeProduct.preferredMinPrice.toLocaleString()}</span>
                      <span className="block text-[10px] text-amber-300 font-mono">
                        {(((activeProduct.preferredMinPrice - activeProduct.costPrice) / activeProduct.preferredMinPrice) * 100).toFixed(1)}% margin
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <span className="text-emerald-400 font-semibold">Target Selling Price (Catalog):</span>
                      <p className="text-[10px] text-slate-500">Gross profit: ₹{(activeProduct.targetPrice - activeProduct.costPrice).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400">₹{activeProduct.targetPrice.toLocaleString()}</span>
                      <span className="block text-[10px] text-emerald-400 font-mono">
                        {(((activeProduct.targetPrice - activeProduct.costPrice) / activeProduct.targetPrice) * 100).toFixed(1)}% margin
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock and Notes */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Warehouse Stock</span>
                  <span className="font-bold text-white text-base mt-0.5">{activeProduct.stock} Units</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Enforcement Status</span>
                  <span className="font-bold text-emerald-400 text-xs mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Guard Active
                  </span>
                </div>
              </div>

              {activeProduct.description && (
                <div className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                  <strong className="text-slate-300 block mb-1">Description:</strong>
                  {activeProduct.description}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && activeProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-rose-500/30 shadow-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Product</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to remove <strong className="text-white">"{activeProduct.name}"</strong>? This will remove it from the catalog.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK IMPORT CSV MODAL */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          setIsBulkModalOpen(false);
          fetchProducts();
        }}
      />
    </div>
  );
};
