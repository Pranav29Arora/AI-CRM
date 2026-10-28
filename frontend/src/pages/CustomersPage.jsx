import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../services/customerService';
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
  FileText
} from 'lucide-react';

export const CustomersPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
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
    interestedProductsInput: '',
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
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setFormData(initialCustomerForm);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setActiveCustomer(customer);
    setFormData({
      name: customer.name,
      company: customer.company || '',
      phone: customer.phone || '',
      email: customer.email || '',
      budget: customer.budget || '',
      leadStatus: customer.leadStatus || 'Active Lead',
      preferences: customer.preferences || '',
      notes: customer.notes || '',
      interestedProductsInput: Array.isArray(customer.interestedProducts) ? customer.interestedProducts.join(', ') : '',
    });
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

      const interestedProducts = formData.interestedProductsInput
        ? formData.interestedProductsInput.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      await customerService.createCustomer({
        ...formData,
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

      const interestedProducts = formData.interestedProductsInput
        ? formData.interestedProductsInput.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      await customerService.updateCustomer(activeCustomer.id, {
        ...formData,
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-brand-400" />
              Customers & Wholesale Accounts
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {customers.length} Accounts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage buyer profiles, credit preferences, order inquiries, and trigger WhatsApp negotiations.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/25 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
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
            className="glass-input block w-full pl-10 pr-4 py-2 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
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
      </div>

      {/* Customers List / Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-2" />
          <p className="text-xs">Loading customer directory...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center max-w-md mx-auto my-8 border border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No customers found</h3>
          <p className="text-xs text-slate-400 mb-5">
            {search || statusFilter !== 'All'
              ? 'Try adjusting your search query or status filter.'
              : 'Add your first customer account to begin negotiations.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all"
          >
            Add Customer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {customer.name}
                    </h3>
                    {customer.company && (
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {customer.company}
                      </p>
                    )}
                  </div>

                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${getStatusBadge(customer.leadStatus)}`}>
                    {customer.leadStatus}
                  </span>
                </div>

                {/* Contact & Budget grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 mb-3.5">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span>{customer.phone || 'No phone recorded'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{customer.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 sm:col-span-2">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Estimated Budget: <strong className="font-mono text-emerald-400">₹{Number(customer.budget).toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Interested products tags */}
                {customer.interestedProducts && customer.interestedProducts.length > 0 && (
                  <div className="mb-3.5 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase mr-1">Products:</span>
                    {customer.interestedProducts.map((prod, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-[10px] bg-brand-500/10 text-brand-300 border border-brand-500/20 rounded-md font-medium"
                      >
                        {prod}
                      </span>
                    ))}
                  </div>
                )}

                {/* Notes preview */}
                {customer.notes && (
                  <p className="text-xs text-slate-400 line-clamp-2 italic mb-4 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-600/30 hover:bg-brand-600/50 text-brand-200 border border-brand-500/30 rounded-lg transition-colors"
                    title="Start Negotiation"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                    Negotiate
                  </button>

                  {/* Send WhatsApp */}
                  <button
                    onClick={() => navigate(`/conversations?customerId=${customer.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors"
                    title="Open WhatsApp Chat"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    WhatsApp
                  </button>

                  {/* Schedule Followup */}
                  <button
                    onClick={() => handleOpenReminder(customer)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    title="Schedule Reminder"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Follow-up
                  </button>
                </div>

                {/* Standard edit / view / delete */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenView(customer)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="View Customer"
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
              </div>
            </div>
          ))}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company / Retail Store</label>
                  <input
                    type="text"
                    placeholder="e.g. Chandra Electronics Surat"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estimated Budget (INR ₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500000"
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

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Interested Products (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Samsung 65 Neo QLED, Daikin 1.5T AC"
                  value={formData.interestedProductsInput}
                  onChange={(e) => setFormData({ ...formData, interestedProductsInput: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Wholesale Preferences & Terms</label>
                <input
                  type="text"
                  placeholder="e.g. 15-day credit terms, expects free transit insurance, GST billing"
                  value={formData.preferences}
                  onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Internal Notes & Context</label>
                <textarea
                  rows="2"
                  placeholder="Deal background, negotiation stance, decision maker details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estimated Budget (INR ₹)</label>
                  <input
                    type="number"
                    min="0"
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

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Interested Products (comma separated)</label>
                <input
                  type="text"
                  value={formData.interestedProductsInput}
                  onChange={(e) => setFormData({ ...formData, interestedProductsInput: e.target.value })}
                  className="glass-input block w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>

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

                {/* Interested Products */}
                {customerDetails?.interestedProducts && customerDetails.interestedProducts.length > 0 && (
                  <div className="text-xs">
                    <strong className="text-slate-400 block mb-1.5">Interested Product Lines:</strong>
                    <div className="flex flex-wrap gap-1.5">
                      {customerDetails.interestedProducts.map((p, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs">
                          {p}
                        </span>
                      ))}
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
