import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';
import { reminderService } from '../services/reminderService';
import { authService } from '../services/authService';
import {
  Users,
  Package,
  Sparkles,
  MessageSquare,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Zap,
  BarChart3,
  RefreshCw,
  Plus,
  Loader2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChartTab, setActiveChartTab] = useState('revenue');
  const [isResetting, setIsResetting] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getDashboardAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleToggleReminder = async (reminder) => {
    try {
      const nextStatus = reminder.status === 'completed' ? 'pending' : 'completed';
      await reminderService.updateReminder(reminder.id, { status: nextStatus });
      fetchAnalytics();
    } catch (err) {
      alert("Failed to update reminder: " + err.message);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm("Reset mock database to initial seed data?")) return;
    try {
      setIsResetting(true);
      await authService.resetData();
      fetchAnalytics();
    } catch (err) {
      alert("Reset failed: " + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs">
          <p className="font-bold text-white mb-1.5">{label} 2026</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="capitalize">{entry.name}:</span>
              <span className="font-mono font-bold text-white">
                {entry.name === 'deals' ? entry.value : `₹${Number(entry.value).toLocaleString()}`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-9 h-9 animate-spin text-brand-500 mb-3" />
        <p className="text-sm font-medium">Calculating wholesale analytics from mock database...</p>
      </div>
    );
  }

  const m = analytics?.metrics || {
    totalCustomers: 5,
    totalProducts: 6,
    activeLeads: 2,
    pendingReminders: 3,
    completedDeals: 1,
    revenue: 552000,
    grossProfit: 48000,
    conversionRate: 20
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Welcome */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Executive Wholesale Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
              Cloud Firestore: ai-crm-f73a5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong className="text-slate-300">{user?.name}</strong> ({user?.role}) • {user?.company}
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700/80 transition-all"
            title="Reset database to seed records"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isResetting ? 'animate-spin' : ''}`} />
            Reset Cloud Data
          </button>

          <Link
            to="/products"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700/80 transition-all"
          >
            <Package className="w-3.5 h-3.5 text-brand-400" />
            Add Product
          </Link>

          <Link
            to="/customers"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700/80 transition-all"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Add Customer
          </Link>

          <Link
            to="/negotiations"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/25 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4 text-white" />
            Start Negotiation
          </Link>
        </div>
      </div>

      {/* Evaluation Disclaimer Strip */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldAlert className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong className="text-white">Cloud Database Active:</strong> Live data synchronized with Google Cloud Firestore (Project: ai-crm-f73a5). All catalog edits, offers, and follow-ups persist directly to the cloud.
          </span>
        </div>
        <span className="text-[11px] text-emerald-400 font-semibold font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 w-fit">
          100% Margin Guard Active
        </span>
      </div>

      {/* 8 Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Customers</span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{m.totalCustomers}</p>
          <span className="text-[10px] text-brand-300 font-medium mt-1 block">Retail & Wholesale Accounts</span>
        </div>

        {/* Total Products */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Products in Catalog</span>
            <Package className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{m.totalProducts}</p>
          <span className="text-[10px] text-indigo-300 font-medium mt-1 block">With strict floor limits</span>
        </div>

        {/* Active Leads */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Active Leads</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">{m.activeLeads}</p>
          <span className="text-[10px] text-emerald-300/80 font-medium mt-1 block">In negotiation pipeline</span>
        </div>

        {/* Pending Reminders */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Pending Reminders</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">{m.pendingReminders}</p>
          <span className="text-[10px] text-amber-300/80 font-medium mt-1 block">Follow-ups scheduled</span>
        </div>

        {/* Realized Revenue */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Closed Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">₹{m.revenue.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 block">From finalized deals</span>
        </div>

        {/* Gross Profit */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Realized Profit</span>
            <Sparkles className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">+₹{m.grossProfit.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">Net gross wholesale gain</span>
        </div>

        {/* Completed Deals */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Completed Deals</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{m.completedDeals}</p>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 block">Accepted by buyer & sales</span>
        </div>

        {/* Conversion Rate */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Conversion Rate</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 font-mono">{m.conversionRate}%</p>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">Leads converted to won</span>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Trends Chart (2 Columns) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                Wholesale Revenue & Gross Profit Trends
              </h3>
              <p className="text-xs text-slate-400">Monthly breakdown in Indian Rupees (₹)</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveChartTab('revenue')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  activeChartTab === 'revenue' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveChartTab('profit')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  activeChartTab === 'profit' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Gross Profit
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'revenue' ? (
                <AreaChart data={analytics?.monthlyTrends || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={analytics?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="profit"
                    name="Profit"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Pie (1 Column) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="pb-4 mb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Inventory Category Share
            </h3>
            <p className="text-xs text-slate-400">By wholesale value</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.categoryDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(analytics?.categoryDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val}%`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Legend */}
          <div className="space-y-1.5 mt-2">
            {(analytics?.categoryDistribution || []).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate max-w-[130px]">{cat.name}</span>
                </div>
                <span className="font-mono text-slate-400">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Negotiations & Upcoming Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Negotiations */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Recent AI Negotiations
              </h3>
              <p className="text-xs text-slate-400">Buyer offers & profit calculations</p>
            </div>
            <Link
              to="/negotiations"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              View Desk <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(analytics?.recentNegotiations || []).map((neg) => {
              const badgeStyle = neg.recommendation === 'ACCEPT'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : neg.recommendation === 'COUNTER'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/20';

              return (
                <div
                  key={neg.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{neg.customerName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{neg.productName} ({neg.quantity} units)</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                      <span>Offer: <strong className="font-mono text-slate-200">₹{neg.currentOffer.toLocaleString()}</strong></span>
                      <span>Gross Profit: <strong className="font-mono text-emerald-400">+₹{(neg.grossProfit || 0).toLocaleString()}</strong></span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${badgeStyle}`}>
                      {neg.recommendation}: {neg.status}
                    </span>
                    <Link
                      to="/negotiations"
                      className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold"
                    >
                      Review →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Follow-ups & Reminders */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Upcoming WhatsApp Follow-ups
              </h3>
              <p className="text-xs text-slate-400">Scheduled reminders for wholesale accounts</p>
            </div>
            <Link
              to="/conversations"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              WhatsApp Hub <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(analytics?.upcomingFollowups || []).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No pending follow-ups. Schedule one from the Customers page!
              </div>
            ) : (
              (analytics?.upcomingFollowups || []).map((rem) => (
                <div
                  key={rem.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white truncate">{rem.title}</p>
                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                        rem.priority === 'High'
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                          : rem.priority === 'Medium'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {rem.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>Buyer: <strong className="text-slate-300">{rem.customerName}</strong></span>
                      <span>•</span>
                      <span>Due: {new Date(rem.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleReminder(rem)}
                    className="flex-shrink-0 px-2.5 py-1 text-[11px] font-semibold bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors"
                    title="Mark task done"
                  >
                    Done ✓
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
