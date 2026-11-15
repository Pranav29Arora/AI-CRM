import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';
import { reminderService } from '../services/reminderService';
import {
  Users,
  Package,
  Sparkles,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Zap,
  BarChart3,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Flame,
  Check,
  AlertCircle
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

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 p-3 rounded-2xl shadow-2xl text-xs">
          <p className="font-bold text-white mb-2 pb-1 border-b border-slate-800">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 text-slate-300 py-0.5">
              <span className="flex items-center gap-1.5 capitalize text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
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
        <p className="text-sm font-medium">Gathering real-time wholesale analytics from Cloud Firestore...</p>
      </div>
    );
  }

  const m = analytics?.metrics || {
    totalCustomers: 0,
    totalProducts: 0,
    activeLeads: 0,
    pendingReminders: 0,
    completedDeals: 0,
    revenue: 0,
    grossProfit: 0,
    conversionRate: 0
  };

  return (
    <div className="space-y-8">
      {/* 1. Hero Welcoming Banner with Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900/90 via-brand-950/40 to-slate-900/90 border border-slate-800/80 shadow-2xl">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Firestore Active
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs font-medium">Wholesale Pricing Guard Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-brand-300">{user?.name || 'Director'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Real-time margin protection and automated B2B WhatsApp negotiation intelligence. Guarding gross margins across all customer quotes.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/products"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm"
            >
              <Package className="w-4 h-4 text-indigo-400" />
              <span>Catalog</span>
            </Link>

            <Link
              to="/customers"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm"
            >
              <Users className="w-4 h-4 text-brand-400" />
              <span>Customers</span>
            </Link>

            <Link
              to="/negotiations"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02]"
            >
              <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Deal Desk</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. 8 Primary KPI Metric Cards with Modern Glowing Accents */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Closed Revenue */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Closed Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white font-mono tracking-tight">₹{m.revenue.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> From approved deals
          </span>
        </div>

        {/* Realized Profit */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Profit</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono tracking-tight">+₹{m.grossProfit.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">Net wholesale gain</span>
        </div>

        {/* Total Customers */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-brand-500/40 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customers</span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white font-mono tracking-tight">{m.totalCustomers}</p>
          <span className="text-[11px] text-brand-300 font-medium mt-1.5 block">Accounts in directory</span>
        </div>

        {/* Catalog Products */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-purple-500/40 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Catalog SKUs</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white font-mono tracking-tight">{m.totalProducts}</p>
          <span className="text-[11px] text-purple-300 font-medium mt-1.5 block">Floor limits active</span>
        </div>

        {/* Active Leads */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-amber-500/40 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Leads</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-300 font-mono tracking-tight">{m.activeLeads}</p>
          <span className="text-[11px] text-amber-300/80 font-medium mt-1.5 block">Under active negotiation</span>
        </div>

        {/* Follow-ups Due */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-rose-500/40 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Reminders</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-300 font-mono tracking-tight">{m.pendingReminders}</p>
          <span className="text-[11px] text-rose-300/80 font-medium mt-1.5 block">Follow-ups scheduled</span>
        </div>

        {/* Completed Deals */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Closed Deals</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white font-mono tracking-tight">{m.completedDeals}</p>
          <span className="text-[11px] text-emerald-400 font-medium mt-1.5 block">Accepted quotes</span>
        </div>

        {/* Conversion Rate */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lead Win Rate</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-300 font-mono tracking-tight">{m.conversionRate}%</p>
          <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">Leads converted to won</span>
        </div>
      </div>

      {/* 3. Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Trends Chart (2 Columns) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-slate-800/80 gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                Wholesale Revenue & Margin Trajectory
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly realization in Indian Rupees (₹)</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
              <button
                onClick={() => setActiveChartTab('revenue')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  activeChartTab === 'revenue'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Revenue Flow
              </button>
              <button
                onClick={() => setActiveChartTab('profit')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  activeChartTab === 'profit'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gross Profit
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              {activeChartTab === 'revenue' ? (
                <AreaChart data={analytics?.monthlyTrends || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={analytics?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="profit"
                    name="Gross Profit"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Donut (1 Column) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="pb-4 mb-4 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Inventory Category Share
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Calculated by active catalog records</p>
            </div>

            {(analytics?.categoryDistribution || []).length === 0 ? (
              <div className="h-44 w-full flex flex-col items-center justify-center text-slate-500">
                <Layers className="w-9 h-9 text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-400">No inventory products yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Add products in catalog to see breakdown</p>
              </div>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={170}>
                    <PieChart>
                      <Pie
                        data={analytics?.categoryDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(analytics?.categoryDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name) => [`${val}%`, name]}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Legend */}
                <div className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-1">
                  {(analytics?.categoryDistribution || []).map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="truncate max-w-[130px] font-medium">{cat.name}</span>
                      </div>
                      <span className="font-mono text-slate-400 font-semibold">{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Catalog Items: <strong className="text-white font-mono">{m.totalProducts}</strong></span>
            <Link to="/products" className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1">
              Catalog →
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Two Columns: Recent Negotiations & Upcoming Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Negotiations */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Recent AI Negotiations
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Buyer quotes and financial guardrail verdicts</p>
            </div>
            <Link
              to="/negotiations"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
            >
              Deal Desk <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(analytics?.recentNegotiations || []).length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-slate-400">No negotiations recorded yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  Evaluate custom customer offers on the Deal Desk to see real-time margin audits.
                </p>
                <Link
                  to="/negotiations"
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-300 bg-brand-500/10 border border-brand-500/30 rounded-xl hover:bg-brand-500/20 transition-all"
                >
                  <Flame className="w-3.5 h-3.5" /> Open Deal Desk
                </Link>
              </div>
            ) : (
              (analytics?.recentNegotiations || []).map((neg) => {
                const badgeStyle = neg.recommendation === 'ACCEPT'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : neg.recommendation === 'COUNTER'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30';

                return (
                  <div
                    key={neg.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all group"
                  >
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">{neg.customerName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{neg.productName} ({neg.quantity} units)</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                        <span className="text-slate-400">Offer: <strong className="font-mono text-slate-200">₹{(neg.currentOffer || 0).toLocaleString()}</strong></span>
                        <span className="text-slate-400">Profit: <strong className="font-mono text-emerald-400">+₹{(neg.grossProfit || 0).toLocaleString()}</strong></span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${badgeStyle}`}>
                        {neg.recommendation}
                      </span>
                      <Link
                        to="/negotiations"
                        className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold"
                      >
                        Inspect →
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Follow-ups & Reminders */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Upcoming WhatsApp Follow-ups
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Automated task scheduler & customer deadlines</p>
            </div>
            <Link
              to="/conversations"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              WhatsApp Hub <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(analytics?.upcomingFollowups || []).length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-slate-400">No pending follow-ups scheduled</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  Schedule reminders directly from any customer profile to avoid lead churn.
                </p>
                <Link
                  to="/customers"
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl hover:bg-amber-500/20 transition-all"
                >
                  <Users className="w-3.5 h-3.5" /> View Customers
                </Link>
              </div>
            ) : (
              (analytics?.upcomingFollowups || []).map((reminder) => (
                <div
                  key={reminder.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleReminder(reminder)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${
                        reminder.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-600 hover:border-brand-500'
                      }`}
                    >
                      {reminder.status === 'completed' && <Check className="w-3 h-3" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${reminder.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                        {reminder.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{reminder.customerName}</p>
                      <p className="text-[10px] text-amber-400/80 font-mono mt-1">
                        Due: {new Date(reminder.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                    reminder.priority === 'High'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : reminder.priority === 'Low'
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {reminder.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
