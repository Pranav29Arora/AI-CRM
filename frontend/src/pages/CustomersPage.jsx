import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { reminderService } from '../services/reminderService';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Building2,
  DollarSign,
  Edit2,
  Trash2,
  Eye,
  MessageSquare,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ArrowRight,
  Tag,
  FileText,
  Package,
  Layers,
  Table,
  LayoutGrid,
  Check,
  ChevronDown
} from 'lucide-react';

export const CustomersPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // Selected customer
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states
  const initialCustomerForm = {
    name: '',
    company: '',
    phone: '',
    email: '',
    budget: '',
    leadStatus: 'Active Lead',
    preferences: '',
    notes: '',
    selectedProducts: [], // array of { id, name, sellingPrice, sku, category }
    customProductInput: '',
  };
  const [formData, setFormData] = useState(initialCustomerForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reminder form state
  const [reminderData, setReminderData] = useState({
    title: '',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    priority: 'Medium',
    notes: '',
  });
  const [reminderNotice, setReminderNotice] = useState('');

  const statuses = [
    'All',
    'Active Lead',
    'Qualified',
    'Under Negotiation',
    'Closed Won',
    'Inactive',
  ];

  const fetchProducts = async () => {
    try {
      const prods = await productService.getProducts();
      setAvailableProducts(prods);
    } catch (err) {
      console.warn('Failed to load catalog products for customer form:', err.message);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers({
        search,
        status: statusFilter,
      });
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // Helper to resolve product name, selling price, and SKU from object or catalog lookup
  const resolveProductInfo = (prod, custBudget = 0) => {
    if (typeof prod === 'object' && prod !== null) {
      const sellingPrice = Number(prod.sellingPrice || prod.targetPrice || 0);
      let catalogMatch = null;
      if (prod.id || prod.name) {
        catalogMatch = availableProducts.find(p => (prod.id && p.id === prod.id) || p.name.toLowerCase() === (prod.name || '').toLowerCase());
      }
      const finalSellingPrice = sellingPrice > 0 ? sellingPrice : Number(catalogMatch?.targetPrice || catalogMatch?.preferredMinPrice || 0);
      const explicitOffer = Number(prod.offeredPrice || prod.offerPrice || 0);
      const finalOfferPrice = explicitOffer > 0 ? explicitOffer : (Number(custBudget) > 0 ? Number(custBudget) : 0);

      return {
        id: prod.id || catalogMatch?.id || '',
        name: prod.name || catalogMatch?.name || 'Catalog Product',
        sellingPrice: finalSellingPrice,
        offeredPrice: finalOfferPrice,
        sku: prod.sku || catalogMatch?.sku || '',
        category: prod.category || catalogMatch?.category || ''
      };
    }
    const str = String(prod || '').trim();
    const match = availableProducts.find(p => p.id === str || p.name.toLowerCase() === str.toLowerCase());
    if (match) {
      return {
        id: match.id,
        name: match.name,
        sellingPrice: Number(match.targetPrice || match.preferredMinPrice || 0),
        offeredPrice: Number(custBudget) || 0,
        sku: match.sku || '',
        category: match.category || ''
      };
    }
    return {
      id: '',
      name: str,
      sellingPrice: 0,
      offeredPrice: Number(custBudget) || 0,
      sku: '',
      category: ''
    };
  };

  const handleOpenAdd = () => {
    setFormData(initialCustomerForm);
    setProductSearch('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setActiveCustomer(customer);
    const existingList = Array.isArray(customer.interestedProducts) ? customer.interestedProducts : [];
    const parsedSelected = existingList.map(item => resolveProductInfo(item, customer.budget));

    setFormData({
      name: customer.name,
      company: customer.company || '',
      phone: customer.phone || '',
      email: customer.email || '',
      budget: customer.budget || '',
      leadStatus: customer.leadStatus || 'Active Lead',
      preferences: customer.preferences || '',
      notes: customer.notes || '',
      selectedProducts: parsedSelected,
      customProductInput: '',
    });
    setProductSearch('');
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenView = async (customer) => {
    setActiveCustomer(customer);
    setIsViewModalOpen(true);
    try {
      setLoadingDetails(true);
      const details = await customerService.getCustomerById(customer.id);
      setCustomerDetails(details);
    } catch (err) {
      console.error("Failed to load customer details:", err);
      setCustomerDetails(customer);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenDelete = (customer) => {
    setActiveCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleOpenReminder = (customer) => {
    setActiveCustomer(customer);
    setReminderData({
      title: `Follow up with ${customer.name} on quotes`,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      priority: 'Medium',
      notes: customer.notes || '',
    });
    setReminderNotice('');
    setIsReminderModalOpen(true);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Customer name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      // Build structured interestedProducts list with catalog selling prices and customer offered prices
      let interestedProducts = (formData.selectedProducts || []).map(p => ({
        id: p.id || '',
        name: p.name,
        sellingPrice: Number(p.sellingPrice) || 0,
        offeredPrice: Number(p.offeredPrice !== undefined && p.offeredPrice !== '' ? p.offeredPrice : (formData.budget || 0)),
        sku: p.sku || '',
        category: p.category || ''
      }));

      // If user typed something into customProductInput
      if (formData.customProductInput?.trim()) {
        const customName = formData.customProductInput.trim();
        const match = availableProducts.find(p => p.name.toLowerCase() === customName.toLowerCase());
        const defaultOffer = Number(formData.budget) || (match ? Number(match.preferredMinPrice || match.targetPrice || 0) : 0);
        interestedProducts.push({
          id: match?.id || '',
          name: customName,
          sellingPrice: match ? Number(match.targetPrice || match.preferredMinPrice || 0) : 0,
          offeredPrice: defaultOffer,
          sku: match?.sku || 'CUSTOM',
          category: match?.category || 'Custom'
        });
      }

      await customerService.createCustomer({
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        email: formData.email,
        budget: formData.budget,
        leadStatus: formData.leadStatus,
        preferences: formData.preferences,
        notes: formData.notes,
        interestedProducts,
      });

      setIsAddModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setFormError(err.message || 'Failed to create customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Customer name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      let interestedProducts = (formData.selectedProducts || []).map(p => ({
        id: p.id || '',
        name: p.name,
        sellingPrice: Number(p.sellingPrice) || 0,
        offeredPrice: Number(p.offeredPrice !== undefined && p.offeredPrice !== '' ? p.offeredPrice : (formData.budget || 0)),
        sku: p.sku || '',
        category: p.category || ''
      }));

      if (formData.customProductInput?.trim()) {
        const customName = formData.customProductInput.trim();
        const match = availableProducts.find(p => p.name.toLowerCase() === customName.toLowerCase());
        const defaultOffer = Number(formData.budget) || (match ? Number(match.preferredMinPrice || match.targetPrice || 0) : 0);
        interestedProducts.push({
          id: match?.id || '',
          name: customName,
          sellingPrice: match ? Number(match.targetPrice || match.preferredMinPrice || 0) : 0,
          offeredPrice: defaultOffer,
          sku: match?.sku || 'CUSTOM',
          category: match?.category || 'Custom'
        });
      }

      await customerService.updateCustomer(activeCustomer.id, {
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        email: formData.email,
        budget: formData.budget,
        leadStatus: formData.leadStatus,
        preferences: formData.preferences,
        notes: formData.notes,
        interestedProducts,
      });

      setIsEditModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setFormError(err.message || 'Failed to update customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      setSubmitting(true);
      await customerService.deleteCustomer(activeCustomer.id);
      setIsDeleteModalOpen(false);
      fetchCustomers();
    } catch (err) {
      alert("Failed to delete customer: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await reminderService.createReminder({
        customerId: activeCustomer.id,
        customerName: activeCustomer.name,
        title: reminderData.title,
        dueDate: new Date(reminderData.dueDate).toISOString(),
        priority: reminderData.priority,
        notes: reminderData.notes,
      });
      setReminderNotice('Follow-up reminder successfully scheduled!');
      setTimeout(() => {
        setIsReminderModalOpen(false);
      }, 1000);
    } catch (err) {
      alert("Failed to schedule reminder: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Under Negotiation':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/25';
      case 'Active Lead':
        return 'bg-brand-500/10 text-brand-300 border-brand-500/25';
      case 'Qualified':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25';
      case 'Closed Won':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const totalBudget = customers.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
  const activeLeadsCount = customers.filter(c => c.leadStatus === 'Active Lead' || c.leadStatus === 'Under Negotiation').length;
  const closedWonCount = customers.filter(c => c.leadStatus === 'Closed Won').length;

  // Interactive Product Selector with Catalog database items and Selling Prices
  const renderProductSelector = () => {
    const filteredAvailable = availableProducts.filter(p => {
      if (!productSearch) return true;
      const term = productSearch.toLowerCase();
      return (
        p.name?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term)
      );
    });

    const isSelected = (prodId, prodName) => {
      return (formData.selectedProducts || []).some(sp => (sp.id && sp.id === prodId) || sp.name === prodName);
    };

    const toggleProduct = (prod) => {
      const exists = isSelected(prod.id, prod.name);
      if (exists) {
        setFormData(prev => ({
          ...prev,
          selectedProducts: (prev.selectedProducts || []).filter(sp => (sp.id ? sp.id !== prod.id : sp.name !== prod.name))
        }));
      } else {
        const defaultOffer = Number(formData.budget) || Number(prod.preferredMinPrice || prod.targetPrice || 0);
        setFormData(prev => ({
          ...prev,
          selectedProducts: [
            ...(prev.selectedProducts || []),
            {
              id: prod.id,
              name: prod.name,
              sellingPrice: Number(prod.targetPrice || prod.preferredMinPrice || 0),
              offeredPrice: defaultOffer,
              sku: prod.sku || '',
              category: prod.category || ''
            }
          ]
        }));
      }
    };

    const removeSelected = (index) => {
      setFormData(prev => ({
        ...prev,
        selectedProducts: (prev.selectedProducts || []).filter((_, i) => i !== index)
      }));
    };

    const handleAddCustom = (e) => {
      if (e) e.preventDefault();
      if (!formData.customProductInput?.trim()) return;
      const customName = formData.customProductInput.trim();
      const match = availableProducts.find(p => p.name.toLowerCase() === customName.toLowerCase());
      const defaultOffer = Number(formData.budget) || (match ? Number(match.preferredMinPrice || match.targetPrice || 0) : 0);
      setFormData(prev => ({
        ...prev,
        selectedProducts: [
          ...(prev.selectedProducts || []),
          {
            id: match?.id || '',
            name: customName,
            sellingPrice: match ? Number(match.targetPrice || match.preferredMinPrice || 0) : 0,
            offeredPrice: defaultOffer,
            sku: match?.sku || 'CUSTOM',
            category: match?.category || 'Custom'
          }
        ],
        customProductInput: ''
      }));
    };

    const totalSelectedValue = (formData.selectedProducts || []).reduce((sum, p) => sum + (Number(p.sellingPrice) || 0), 0);

    return (
      <div className="space-y-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-1.5">
          <div>
            <label className="block text-xs font-bold text-white flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-brand-400" />
              Interested Products & Customer Offered Rates
            </label>
            <p className="text-[11px] text-slate-400">
              Select products from database catalog. Specify customer offered rates to power the AI Margin Guard.
            </p>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono font-bold self-start sm:self-auto px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
            {(formData.selectedProducts || []).length} Selected {totalSelectedValue > 0 ? `(₹${totalSelectedValue.toLocaleString()})` : ''}
          </span>
        </div>

        {/* Selected Products Deck */}
        {(formData.selectedProducts || []).length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Selected Products (Catalog Price & Customer Offer):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {formData.selectedProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-brand-500/30 text-xs text-white"
                >
                  <div className="min-w-0 pr-1">
                    <span className="font-semibold text-slate-100 truncate block max-w-[140px]" title={p.name}>
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Catalog: ₹{Number(p.sellingPrice || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-1 rounded-lg border border-slate-700">
                      <span className="text-[10px] text-amber-300 font-bold uppercase">Offer: ₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Offer ₹"
                        value={p.offeredPrice !== undefined ? p.offeredPrice : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          const updated = [...formData.selectedProducts];
                          updated[idx] = { ...updated[idx], offeredPrice: val };
                          setFormData({ ...formData, selectedProducts: updated });
                        }}
                        className="w-20 px-1 py-0.5 text-xs font-mono bg-transparent text-emerald-300 font-bold focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSelected(idx)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
                      title="Remove item"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Catalog Search & Dropdown Picker */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search available products from database by name, category, or SKU..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="glass-input block w-full pl-9 pr-3 py-2 text-xs rounded-xl"
            />
          </div>

          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/70 p-1.5 space-y-1 divide-y divide-slate-850">
            {availableProducts.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center">
                No products found in database catalog. Add products in Catalog first or add custom unlisted product below.
              </p>
            ) : filteredAvailable.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center">
                No catalog products matching "{productSearch}".
              </p>
            ) : (
              filteredAvailable.map((prod) => {
                const selected = isSelected(prod.id, prod.name);
                return (
                  <div
                    key={prod.id}
                    onClick={() => toggleProduct(prod)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                      selected
                        ? 'bg-brand-600/20 border border-brand-500/40'
                        : 'hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                        selected ? 'bg-brand-600 border-brand-500 text-white' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {selected && <Check className="w-3 h-3" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{prod.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {prod.category} {prod.sku ? `• SKU: ${prod.sku}` : ''} {prod.stock ? `• Stock: ${prod.stock}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        ₹{Number(prod.targetPrice || prod.preferredMinPrice || 0).toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-500 block">Selling Price</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Custom Unlisted Product Input */}
        <div className="pt-1.5 flex items-center gap-2">
          <input
            type="text"
            placeholder="Or type custom product name not in catalog..."
            value={formData.customProductInput || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, customProductInput: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            className="glass-input block flex-1 px-3 py-1.5 text-xs rounded-xl"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors flex-shrink-0"
          >
            + Add Custom
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                Customer & Lead Accounts
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Wholesale buyer profiles, purchase budgets, and multi-turn negotiation history
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 rounded-xl shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Customer Directory Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accounts</span>
            <span className="text-xl font-black text-white font-mono">{customers.length}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Leads</span>
            <span className="text-xl font-black text-amber-300 font-mono">{activeLeadsCount}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Tag className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Closed Won</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{closedWonCount}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pipeline Budget</span>
            <span className="text-xl font-black text-white font-mono">₹{totalBudget.toLocaleString()}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, company, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input block w-full pl-10 pr-4 py-2.5 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
              <Filter className="w-3.5 h-3.5" /> Lead Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input px-3 py-2 text-xs rounded-xl bg-slate-900 border-slate-700 text-slate-200"
            >
              {statuses.map((status) => (
                <option key={status} value={status} className="bg-slate-900 text-white">
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle: Cards vs Table with Dedicated Column */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                viewMode === 'cards'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                viewMode === 'table'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table View with Interested Products & Selling Price Column"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customers List / Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-2" />
          <p className="text-xs">Loading customer directory...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center max-w-lg mx-auto my-8 border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1.5">No customers in directory</h3>
          <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
            {search || statusFilter !== 'All'
              ? 'Try adjusting your search query or status filter.'
              : 'Add your first wholesale buyer or retail merchant to start pricing negotiations.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-brand-500/25 transition-all"
          >
            + Add Customer Account
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW WITH DEDICATED COLUMN: Interested Products & Selling Price */
        <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Customer & Merchant</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Budget</th>
                  <th className="py-3.5 px-4 min-w-[320px]">
                    <div className="flex items-center gap-1.5 text-brand-300 font-black">
                      <Package className="w-3.5 h-3.5 text-brand-400" />
                      Interested Products & Selling Price
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customers.map((customer) => {
                  const initials = customer.name
                    ? customer.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'CU';

                  return (
                    <tr key={customer.id} className="hover:bg-slate-900/40 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-brand-300 transition-colors">
                              {customer.name}
                            </p>
                            {customer.company && (
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-slate-500" /> {customer.company}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <p className="text-slate-300 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" /> {customer.phone || 'No phone recorded'}
                          </p>
                          <p className="text-slate-400 truncate max-w-[150px] flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" /> {customer.email || 'No email'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(customer.leadStatus)}`}>
                          {customer.leadStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-emerald-400 text-xs">
                        ₹{Number(customer.budget || 0).toLocaleString()}
                      </td>

                      {/* DEDICATED COLUMN: Interested Products with Selling Prices */}
                      <td className="py-4 px-4">
                        {(!customer.interestedProducts || customer.interestedProducts.length === 0) ? (
                          <span className="text-slate-500 italic text-[11px]">No products selected</span>
                        ) : (
                          <div className="space-y-1.5 max-w-sm">
                            {customer.interestedProducts.map((prod, idx) => {
                              const pInfo = resolveProductInfo(prod);
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs transition-colors"
                                >
                                  <div className="min-w-0 pr-2">
                                    <span className="font-medium text-slate-200 truncate block max-w-[180px]" title={pInfo.name}>
                                      {pInfo.name}
                                    </span>
                                    {pInfo.sku && <span className="text-[9px] text-slate-500 font-mono">SKU: {pInfo.sku}</span>}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <div className="flex flex-col items-end">
                                      {pInfo.offeredPrice > 0 && (
                                        <span className="font-mono font-bold text-amber-300 text-[11px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20" title="Customer Offered Price">
                                          Offer: ₹{pInfo.offeredPrice.toLocaleString()}
                                        </span>
                                      )}
                                      <span className="font-mono text-slate-400 text-[10px]" title="Catalog Selling Price">
                                        Catalog: {pInfo.sellingPrice > 0 ? `₹${pInfo.sellingPrice.toLocaleString()}` : 'Custom'}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => navigate(`/negotiations?customerId=${customer.id}${pInfo.id ? `&productId=${pInfo.id}` : ''}`)}
                                      className="text-[10px] text-brand-400 hover:text-brand-300 font-bold px-1.5 py-0.5 rounded bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition-colors"
                                      title="Open Deal Desk Quote"
                                    >
                                      Quote →
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/negotiations?customerId=${customer.id}`)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-lg shadow-sm transition-all"
                            title="Start Negotiation"
                          >
                            Quote
                          </button>
                          <button
                            onClick={() => navigate(`/conversations?customerId=${customer.id}`)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="WhatsApp Chat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenView(customer)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="View Customer Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(customer)}
                            className="p-1.5 text-slate-400 hover:text-brand-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(customer)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS GRID VIEW WITH DEDICATED INTERESTED PRODUCTS & SELLING PRICE SECTION */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {customers.map((customer) => {
            const initials = customer.name
              ? customer.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
              : 'CU';

            return (
              <div
                key={customer.id}
                className="glass-panel p-6 rounded-3xl border border-slate-800/80 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  {/* Header row with Avatar & Status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-brand-500/20 flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                          {customer.name}
                        </h3>
                        {customer.company && (
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            {customer.company}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${getStatusBadge(customer.leadStatus)}`}>
                      {customer.leadStatus}
                    </span>
                  </div>

                  {/* Contact & Budget grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800/80 mb-3.5">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="font-mono">{customer.phone || 'No phone recorded'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{customer.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 sm:col-span-2 pt-1 border-t border-slate-800/60 mt-0.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Budget: <strong className="font-mono text-emerald-400 font-bold">₹{Number(customer.budget || 0).toLocaleString()}</strong></span>
                    </div>
                  </div>

                  {/* Dedicated Interested Products & Database Selling Price Section */}
                  <div className="mb-3.5 bg-slate-900/90 rounded-2xl p-3 border border-slate-800/80">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-brand-400" />
                        Interested Products & Selling Price
                      </span>
                      <span className="text-emerald-400 font-mono text-[10px]">
                        {customer.interestedProducts?.length || 0} Listed
                      </span>
                    </div>

                    {(!customer.interestedProducts || customer.interestedProducts.length === 0) ? (
                      <p className="text-[11px] text-slate-500 italic py-1">No interested products recorded</p>
                    ) : (
                      <div className="space-y-1.5">
                        {customer.interestedProducts.map((prod, idx) => {
                          const pInfo = resolveProductInfo(prod);
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 transition-colors"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-medium text-slate-200 truncate block max-w-[200px]" title={pInfo.name}>
                                  {pInfo.name}
                                </span>
                                {pInfo.sku && <span className="text-[9px] text-slate-500 font-mono">SKU: {pInfo.sku}</span>}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex flex-col items-end">
                                  {pInfo.offeredPrice > 0 && (
                                    <span className="font-mono font-bold text-amber-300 text-[11px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20" title="Customer Offered Price">
                                      Offer: ₹{pInfo.offeredPrice.toLocaleString()}
                                    </span>
                                  )}
                                  <span className="font-mono text-slate-400 text-[10px]" title="Catalog Selling Price">
                                    Catalog: {pInfo.sellingPrice > 0 ? `₹${pInfo.sellingPrice.toLocaleString()}` : 'Custom'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => navigate(`/negotiations?customerId=${customer.id}${pInfo.id ? `&productId=${pInfo.id}` : ''}`)}
                                  className="text-[10px] font-semibold text-brand-400 hover:text-brand-300 transition-colors px-1.5 py-0.5 rounded bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30"
                                  title="Open Deal Desk Quote"
                                >
                                  Quote →
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Notes preview */}
                  {customer.notes && (
                    <p className="text-xs text-slate-400 line-clamp-2 italic mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                      "{customer.notes}"
                    </p>
                  )}
                </div>

                {/* Action buttons strip */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Start negotiation */}
                    <button
                      onClick={() => navigate(`/negotiations?customerId=${customer.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
                      title="Start Negotiation"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Negotiate</span>
                    </button>

                    {/* Send WhatsApp */}
                    <button
                      onClick={() => navigate(`/conversations?customerId=${customer.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl transition-all"
                      title="Open WhatsApp Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Schedule Followup */}
                    <button
                      onClick={() => handleOpenReminder(customer)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700/80"
                      title="Schedule Reminder"
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Follow-up</span>
                    </button>
                  </div>

                  {/* Standard edit / view / delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenView(customer)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                      title="View Customer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(customer)}
                      className="p-1.5 text-slate-400 hover:text-brand-300 hover:bg-slate-800 rounded-xl transition-colors"
                      title="Edit Customer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(customer)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-400" />
                Add New Customer Account
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 mt-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Customer / Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number (WhatsApp)</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="ramesh@chandrastore.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Customer Offered Price / Budget (INR ₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 86500"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl font-mono"
                />
              </div>

              {/* Interactive Product Selector from Database with Selling Prices */}
              {renderProductSelector()}

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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-brand-400" />
                Edit Customer Account
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCustomer} className="space-y-4 mt-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Customer / Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company / Retail Store</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number (WhatsApp)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Customer Offered Price / Budget (INR ₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 86500"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Lead Status</label>
                  <select
                    value={formData.leadStatus}
                    onChange={(e) => setFormData({ ...formData, leadStatus: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border-slate-700 text-white"
                  >
                    {statuses.filter(s => s !== 'All').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Interactive Product Selector from Database with Selling Prices */}
              {renderProductSelector()}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Wholesale Preferences & Terms</label>
                <input
                  type="text"
                  value={formData.preferences}
                  onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Internal Notes</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW CUSTOMER DETAILS MODAL */}
      {isViewModalOpen && activeCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(activeCustomer.leadStatus)}`}>
                  {activeCustomer.leadStatus}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{activeCustomer.name}</h2>
                <p className="text-xs text-slate-400">{activeCustomer.company}</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
              </div>
            ) : (
              <div className="py-4 space-y-4">
                {/* Contact and Budget Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Phone</span>
                    <span className="font-semibold text-slate-200">{customerDetails?.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Email</span>
                    <span className="font-semibold text-slate-200 truncate block">{customerDetails?.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Budget</span>
                    <span className="font-mono font-bold text-emerald-400">₹{Number(customerDetails?.budget || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Preferences & Notes */}
                {customerDetails?.preferences && (
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                    <strong className="text-brand-300 block mb-1">Commercial Preferences:</strong>
                    <p className="text-slate-300">{customerDetails.preferences}</p>
                  </div>
                )}

                {customerDetails?.notes && (
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                    <strong className="text-slate-400 block mb-1">Account Notes:</strong>
                    <p className="text-slate-300 italic">{customerDetails.notes}</p>
                  </div>
                )}

                {/* Interested Products with Catalog Selling Prices */}
                {customerDetails?.interestedProducts && customerDetails.interestedProducts.length > 0 && (
                  <div className="text-xs space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <strong className="text-slate-300 flex items-center gap-1.5 font-bold">
                        <Package className="w-3.5 h-3.5 text-brand-400" />
                        Interested Products & Catalog Selling Price:
                      </strong>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        {customerDetails.interestedProducts.length} items
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {customerDetails.interestedProducts.map((p, i) => {
                        const pInfo = resolveProductInfo(p);
                        return (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-white truncate">{pInfo.name}</p>
                              {pInfo.sku && <p className="text-[10px] text-slate-500 font-mono">SKU: {pInfo.sku}</p>}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-mono font-bold text-emerald-400 text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                {pInfo.sellingPrice > 0 ? `₹${pInfo.sellingPrice.toLocaleString()}` : 'Custom Rate'}
                              </span>
                              <button
                                onClick={() => {
                                  setIsViewModalOpen(false);
                                  navigate(`/negotiations?customerId=${customerDetails.id}${pInfo.id ? `&productId=${pInfo.id}` : ''}`);
                                }}
                                className="text-[11px] font-bold text-brand-300 hover:text-white px-2.5 py-1 rounded-lg bg-brand-600/30 hover:bg-brand-600/50 border border-brand-500/40 transition-colors"
                              >
                                Deal Desk →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Ongoing Negotiations Strip */}
                {customerDetails?.negotiations && customerDetails.negotiations.length > 0 && (
                  <div className="pt-2">
                    <strong className="text-xs text-white block mb-2">Active & Previous Negotiations ({customerDetails.negotiations.length}):</strong>
                    <div className="space-y-2">
                      {customerDetails.negotiations.map((neg) => (
                        <div key={neg.id} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white">{neg.productName}</p>
                            <p className="text-[11px] text-slate-400">
                              Current offer: <span className="font-mono text-emerald-400">₹{neg.currentOffer.toLocaleString()}</span> • Qty: {neg.quantity}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {neg.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* WhatsApp Conversation Peek */}
                {customerDetails?.conversation && (
                  <div className="pt-2">
                    <strong className="text-xs text-white block mb-2">Recent WhatsApp History:</strong>
                    <div className="bg-[#0b141a] p-3 rounded-xl border border-slate-800 text-xs space-y-2 max-h-40 overflow-y-auto">
                      {customerDetails.conversation.messages.slice(-3).map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-2 rounded-lg text-xs max-w-[85%] ${
                            msg.sender === 'customer'
                              ? 'bg-[#202c33] text-slate-200 mr-auto'
                              : 'bg-[#005c4b] text-white ml-auto'
                          }`}
                        >
                          <p>{msg.text}</p>
                          <span className="block text-[9px] text-slate-400 text-right mt-0.5">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    navigate(`/negotiations?customerId=${activeCustomer.id}`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Start Negotiation
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    navigate(`/conversations?customerId=${activeCustomer.id}`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Desk
                </button>
              </div>

              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE REMINDER MODAL */}
      {isReminderModalOpen && activeCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Schedule Follow-up for {activeCustomer.name}
              </h2>
              <button onClick={() => setIsReminderModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4 mt-4">
              {reminderNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{reminderNotice}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Follow-up Task Title</label>
                <input
                  type="text"
                  required
                  value={reminderData.title}
                  onChange={(e) => setReminderData({ ...reminderData, title: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={reminderData.dueDate}
                    onChange={(e) => setReminderData({ ...reminderData, dueDate: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={reminderData.priority}
                    onChange={(e) => setReminderData({ ...reminderData, priority: e.target.value })}
                    className="glass-input block w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border-slate-700 text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reminder Notes</label>
                <textarea
                  rows="2"
                  value={reminderData.notes}
                  onChange={(e) => setReminderData({ ...reminderData, notes: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg shadow-amber-600/25 flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Schedule Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CUSTOMER CONFIRMATION MODAL */}
      {isDeleteModalOpen && activeCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-rose-500/30 shadow-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Customer Account</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to remove <strong className="text-white">"{activeCustomer.name}"</strong>? This will remove their record from the customer directory.
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
                onClick={handleDeleteCustomer}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
