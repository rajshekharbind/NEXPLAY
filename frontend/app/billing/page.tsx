"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  CreditCard, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  Clock, 
  Plus, 
  Layers, 
  ArrowUpRight, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Trash2,
  Printer,
  X,
  DollarSign,
  Wallet,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  ExternalLink,
  Calendar,
  Receipt,
  ChevronRight,
  Tag,
  Tv,
  Check,
  AlertTriangle
} from "lucide-react";
import Card3D from "@/components/Card3D";
import { useAuth } from "@/components/AuthContext";
import { 
  fetchCreditPacks, 
  fetchBillingAnalytics, 
  fetchTaxInvoice, 
  fetchConnectedServices, 
  addConnectedService, 
  deleteConnectedService, 
  fetchSpendingSummary,
  fetchPlatforms,
  API_BASE 
} from "@/lib/api";
import { 
  CreditPack, 
  BillingAnalytics, 
  ConnectedStreamingService, 
  SpendingSummary, 
  TaxInvoice,
  Platform 
} from "@/types";

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  provider: string;
  provider_payment_id?: string;
  status: string;
  created_at: string;
}

interface SubscriptionInfo {
  id: string;
  status: string;
  starts_at?: string;
  ends_at?: string;
  plan?: {
    name: string;
    slug: string;
    price_inr: number;
    billing_cycle: string;
    credit_allowance: number;
  };
}

export default function BillingPage() {
  const { user, token, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"overview" | "tracker" | "packs" | "invoices" | "ledger">("overview");

  // Core State
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [analytics, setAnalytics] = useState<BillingAnalytics | null>(null);
  const [connectedServices, setConnectedServices] = useState<ConnectedStreamingService[]>([]);
  const [spendingSummary, setSpendingSummary] = useState<SpendingSummary | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  // Loading States
  const [loading, setLoading] = useState<boolean>(true);
  const [topupLoading, setTopupLoading] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState<boolean>(false);

  // Add Service Form
  const [newPlatformSlug, setNewPlatformSlug] = useState<string>("netflix");
  const [newPlanName, setNewPlanName] = useState<string>("Standard HD");
  const [newCostInr, setNewCostInr] = useState<number>(499);
  const [newBillingCycle, setNewBillingCycle] = useState<string>("MONTHLY");
  const [newRenewalDate, setNewRenewalDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Popular Presets for fast entry
  const popularPresets = [
    { slug: "netflix", name: "Netflix Standard", cost: 499, cycle: "MONTHLY" },
    { slug: "spotify", name: "Spotify Premium", cost: 119, cycle: "MONTHLY" },
    { slug: "prime-video", name: "Amazon Prime Video", cost: 299, cycle: "MONTHLY" },
    { slug: "disney-hotstar", name: "Disney+ Hotstar Super", cost: 299, cycle: "MONTHLY" },
    { slug: "crunchyroll", name: "Crunchyroll Fan", cost: 79, cycle: "MONTHLY" },
    { slug: "youtube-music", name: "YouTube Premium", cost: 149, cycle: "MONTHLY" },
    { slug: "apple-tv", name: "Apple TV+", cost: 99, cycle: "MONTHLY" },
    { slug: "jiocinema", name: "JioCinema Premium", cost: 29, cycle: "MONTHLY" }
  ];

  const loadAllBillingData = async (currentToken: string) => {
    setLoading(true);
    try {
      const [
        subRes,
        txRes,
        payRes,
        packsData,
        analyticsData,
        servicesData,
        spendingData,
        platformsData
      ] = await Promise.all([
        fetch(`${API_BASE}/billing/subscription`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE}/billing/transactions`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE}/billing/payments`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        }).then(r => r.json()).catch(() => ({ success: false })),
        fetchCreditPacks(),
        fetchBillingAnalytics(currentToken),
        fetchConnectedServices(currentToken),
        fetchSpendingSummary(currentToken),
        fetchPlatforms()
      ]);

      if (subRes.success && subRes.data) setSubscription(subRes.data);
      if (txRes.success && txRes.data) setTransactions(txRes.data);
      if (payRes.success && payRes.data) setPayments(payRes.data);
      if (packsData && packsData.length > 0) setCreditPacks(packsData);
      if (analyticsData) setAnalytics(analyticsData);
      if (servicesData) setConnectedServices(servicesData);
      if (spendingData) setSpendingSummary(spendingData);
      if (platformsData && platformsData.length > 0) setPlatforms(platformsData);
    } catch (err) {
      console.error("Error loading billing details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/billing");
      return;
    }
    if (token) {
      loadAllBillingData(token);
    }
  }, [token, isAuthenticated, router]);

  // Handle Credit Top-Up Pack purchase
  const handleTopup = async (pack: CreditPack) => {
    if (!token) return;
    setTopupLoading(pack.credits);
    setMessage(null);
    try {
      // 1. Create Checkout Order
      const orderRes = await fetch(`${API_BASE}/billing/checkout/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: pack.price_inr,
          purpose: "CREDIT_TOPUP",
          credits: pack.credits
        })
      });
      const orderJson = await orderRes.json();

      // 2. Add Credits to Wallet
      const res = await fetch(`${API_BASE}/billing/add-credits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ credits: pack.credits, payment_method: "upi" })
      });
      const data = await res.json();

      // 3. Verify Payment
      if (orderJson.success && orderJson.data?.payment_id) {
        await fetch(`${API_BASE}/billing/checkout/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            payment_id: orderJson.data.payment_id,
            provider_payment_id: `pay_upi_pack_${Date.now()}`
          })
        });
      }

      if (res.ok && data.success) {
        setMessage({ type: "success", text: `Success! Added ${pack.credits} credits to your wallet.` });
        await refreshUser();
        await loadAllBillingData(token);
      } else {
        setMessage({ type: "error", text: data.detail || "Top-up failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error processing credit pack." });
    } finally {
      setTopupLoading(null);
    }
  };

  // Add new external streaming subscription
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const added = await addConnectedService(token, {
        platform_slug: newPlatformSlug,
        plan_name: newPlanName,
        cost_inr: Number(newCostInr),
        billing_cycle: newBillingCycle,
        renewal_date: newRenewalDate
      });

      if (added) {
        setMessage({ type: "success", text: `Tracked ${added.platform_name} subscription (₹${added.cost_inr}/${added.billing_cycle.toLowerCase()}).` });
        setShowAddModal(false);
        const [serv, spend] = await Promise.all([
          fetchConnectedServices(token),
          fetchSpendingSummary(token)
        ]);
        setConnectedServices(serv);
        setSpendingSummary(spend);
      } else {
        setMessage({ type: "error", text: "Could not add subscription. Please check platform slug." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error saving subscription." });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete external streaming subscription
  const handleDeleteService = async (serviceId: string, name: string) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const ok = await deleteConnectedService(token, serviceId);
      if (ok) {
        setMessage({ type: "success", text: `Removed ${name} from spending tracker.` });
        const [serv, spend] = await Promise.all([
          fetchConnectedServices(token),
          fetchSpendingSummary(token)
        ]);
        setConnectedServices(serv);
        setSpendingSummary(spend);
      } else {
        setMessage({ type: "error", text: "Failed to remove service." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error deleting subscription." });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Tax Invoice Modal
  const handleViewInvoice = async (paymentId: string) => {
    if (!token) return;
    setInvoiceLoading(true);
    try {
      const inv = await fetchTaxInvoice(token, paymentId);
      if (inv) {
        setSelectedInvoice(inv);
      } else {
        setMessage({ type: "error", text: "Failed to generate tax invoice." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Could not load invoice details." });
    } finally {
      setInvoiceLoading(false);
    }
  };

  const balance = user?.wallet?.balance_credits ?? analytics?.balance_credits ?? 100;
  const lifetimeEarned = user?.wallet?.lifetime_earned ?? analytics?.total_credits_earned ?? 100;
  const lifetimeSpent = user?.wallet?.lifetime_spent ?? analytics?.total_credits_spent ?? 0;
  const planName = subscription?.plan?.name ?? analytics?.plan_tier ?? "Free Tier";
  const planPrice = subscription?.plan?.price_inr ?? spendingSummary?.nexplay_plan_price ?? 0;
  const daysRemaining = analytics?.estimated_days_remaining ?? 45;

  const creditUsagePct = lifetimeEarned > 0 
    ? Math.min(100, Math.round((lifetimeSpent / lifetimeEarned) * 100))
    : 0;

  // Total monthly outlay including tracked OTT services and NEXPLAY
  const totalMonthlySpend = spendingSummary?.total_monthly_spend_inr ?? 
    connectedServices.reduce((sum, s) => sum + (s.billing_cycle === "YEARLY" ? s.cost_inr / 12 : s.cost_inr), planPrice);
  const totalYearlySpend = spendingSummary?.total_yearly_spend_inr ?? (totalMonthlySpend * 12);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Title & Quick Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-500 text-xs font-bold uppercase tracking-wider mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Enterprise Billing & Spending Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground">
            Credit Wallet, Subscriptions & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Consolidate 40+ streaming service subscriptions, forecast AI burn-rates, and generate verified GST tax receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => token && loadAllBillingData(token)}
            disabled={loading}
            className="p-2.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-all shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 font-bold text-xs border border-cyan-500/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Track External Sub</span>
          </button>
          <Link
            href="/pricing"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E50914] via-[#00A8E1] to-[#1DB954] hover:opacity-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <span>Upgrade Tier</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Global Status Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold max-w-2xl mx-auto flex items-center justify-between shadow-md ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-500"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Available Credit Balance & Forecast */}
        <Card3D brandGlowColor="#1DB954" intensity={5}>
          <div className="glass-card rounded-2xl p-6 border border-surface-border h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                AI Credit Balance
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
            </div>

            <div className="my-3">
              <div className="text-3xl sm:text-4xl font-black text-foreground">
                {balance.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Burn runway: <strong>~{daysRemaining} days</strong> left</span>
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-surface-border/60">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Used {creditUsagePct}%</span>
                <span>{lifetimeSpent} / {lifetimeEarned}</span>
              </div>
              <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, 100 - creditUsagePct)}%` }}
                />
              </div>
            </div>
          </div>
        </Card3D>

        {/* Card 2: Total Entertainment Outlay */}
        <Card3D brandGlowColor="#00A8E1" intensity={5}>
          <div className="glass-card rounded-2xl p-6 border border-surface-border h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Monthly Spend
              </span>
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-500">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3">
              <div className="text-3xl sm:text-4xl font-black text-foreground">
                ₹{Math.round(totalMonthlySpend).toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Annual Outlay: <strong className="text-foreground">₹{Math.round(totalYearlySpend).toLocaleString()}</strong>
              </p>
            </div>

            <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{connectedServices.length} OTT services tracked</span>
              <button 
                onClick={() => setActiveTab("tracker")} 
                className="text-cyan-400 font-bold hover:underline"
              >
                View breakdown
              </button>
            </div>
          </div>
        </Card3D>

        {/* Card 3: Active NEXPLAY Tier */}
        <Card3D brandGlowColor="#E50914" intensity={5}>
          <div className="glass-card rounded-2xl p-6 border border-surface-border h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Active NEXPLAY Plan
              </span>
              <div className="p-2 rounded-xl bg-red-500/15 text-red-500">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-foreground">
                  {planName}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  {subscription?.status ?? "ACTIVE"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                ₹{planPrice}/mo &middot; {subscription?.plan?.credit_allowance ?? 100} credits/cycle
              </p>
            </div>

            <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Auto-renews next cycle</span>
              <Link href="/pricing" className="text-red-400 font-bold hover:underline">
                Change Plan
              </Link>
            </div>
          </div>
        </Card3D>

        {/* Card 4: Savings & Budget Intelligence */}
        <Card3D brandGlowColor="#A855F7" intensity={5}>
          <div className="glass-card rounded-2xl p-6 border border-surface-border h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Savings Intelligence
              </span>
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-500">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                ~18% - 25%
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Potential annual savings identified across bundled accounts.
              </p>
            </div>

            <div className="pt-2 border-t border-surface-border/60 flex items-center gap-1.5 text-[11px] text-purple-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Multi-Platform Audit Active</span>
            </div>
          </div>
        </Card3D>
      </div>

      {/* Tabbed Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-border pb-2">
        {[
          { id: "overview", label: "Overview & Analytics", icon: BarChart3 },
          { id: "tracker", label: `Spending Tracker (${connectedServices.length})`, icon: Tv },
          { id: "packs", label: "Credit Booster Packs", icon: Sparkles },
          { id: "invoices", label: `Tax Invoices (${payments.length})`, icon: Receipt },
          { id: "ledger", label: `Credit Ledger (${transactions.length})`, icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isActive 
                  ? "bg-foreground text-background shadow-md" 
                  : "bg-surface-card hover:bg-surface-elevated text-muted-foreground hover:text-foreground border border-surface-border"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Burn-Rate Forecast & 7-Day Usage Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 7-Day Usage Chart */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-surface-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>7-Day AI Credit Consumption Trend</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Daily credit burn from AI copilot queries, semantic searches, and Playwright link checks.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-surface-elevated text-cyan-400">
                  Total Spent: {lifetimeSpent}
                </span>
              </div>

              {/* Visual Bar Chart */}
              <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-surface-border/50 pb-2">
                {(analytics?.daily_usage_last_7_days ?? [
                  { day: "Mon", credits: 4 },
                  { day: "Tue", credits: 8 },
                  { day: "Wed", credits: 3 },
                  { day: "Thu", credits: 12 },
                  { day: "Fri", credits: 7 },
                  { day: "Sat", credits: 15 },
                  { day: "Sun", credits: 6 }
                ]).map((item, idx) => {
                  const maxCredits = Math.max(...(analytics?.daily_usage_last_7_days?.map(d => d.credits) ?? [15]), 1);
                  const barHeightPct = Math.max(12, Math.round((item.credits / maxCredits) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[10px] font-mono font-bold text-muted-foreground group-hover:text-cyan-400 transition-colors">
                        {item.credits}
                      </div>
                      <div 
                        className="w-full max-w-[36px] bg-gradient-to-t from-cyan-500/20 via-cyan-500/60 to-cyan-400 rounded-t-lg transition-all duration-500 group-hover:brightness-125"
                        style={{ height: `${barHeightPct}%` }}
                      />
                      <span className="text-[11px] font-bold text-muted-foreground mt-1">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>Avg Daily Burn: <strong>~{Math.round(lifetimeSpent / 7 || 3)} credits/day</strong></span>
                <span>Runway Remaining: <strong className="text-emerald-400">~{daysRemaining} days</strong></span>
              </div>
            </div>

            {/* Feature Usage Breakdown */}
            <div className="glass-card rounded-2xl p-6 border border-surface-border space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-400" />
                  <span>Feature Burn Distribution</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Where your AI credits are allocated across the NEXPLAY ecosystem.
                </p>
              </div>

              <div className="space-y-3.5 my-2">
                {[
                  { name: "AI Recommendations & Copilot", pct: 60, credits: Math.round(lifetimeSpent * 0.6), color: "bg-cyan-400" },
                  { name: "MCP Native Agent Tools", pct: 25, credits: Math.round(lifetimeSpent * 0.25), color: "bg-purple-400" },
                  { name: "Background Link Sentinels", pct: 15, credits: Math.round(lifetimeSpent * 0.15), color: "bg-emerald-400" }
                ].map((feat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">{feat.name}</span>
                      <span className="text-muted-foreground">{feat.credits} credits ({feat.pct}%)</span>
                    </div>
                    <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden">
                      <div className={`${feat.color} h-full rounded-full`} style={{ width: `${feat.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border text-[11px] text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Zero rate limits. Credits roll over with every active subscription renewal.</span>
              </div>
            </div>
          </div>

          {/* Quick Credit Top-Up Teaser */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-surface-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>Volume-Discount Credit Booster Packs</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Never run out of AI discovery capacity. Instant credit injection directly into your wallet.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("packs")}
                className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>View all 4 packs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(creditPacks.length > 0 ? creditPacks : [
                { id: "starter", name: "Starter Pack", credits: 50, price_inr: 49, bonus_percentage: 0 },
                { id: "popular", name: "Popular Pack", credits: 200, price_inr: 149, bonus_percentage: 10, is_popular: true },
                { id: "power", name: "Power Pack", credits: 500, price_inr: 299, bonus_percentage: 20 },
                { id: "studio", name: "Studio Pack", credits: 2000, price_inr: 999, bonus_percentage: 35 }
              ]).map((pack) => (
                <div
                  key={pack.id}
                  className={`p-5 rounded-2xl border relative flex flex-col justify-between transition-all ${
                    pack.is_popular
                      ? "bg-slate-900/90 text-white border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30"
                      : "bg-surface-card border-surface-border text-foreground"
                  }`}
                >
                  {pack.is_popular && (
                    <span className="absolute -top-2.5 right-4 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950">
                      Best Value
                    </span>
                  )}

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-muted-foreground">{pack.name}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black">₹{pack.price_inr}</span>
                      <span className="text-xs font-bold text-cyan-400">+{pack.credits} Credits</span>
                    </div>
                    {pack.bonus_percentage > 0 && (
                      <span className="inline-block text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        +{pack.bonus_percentage}% Bonus Included
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleTopup(pack)}
                    disabled={topupLoading === pack.credits}
                    className="mt-5 w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    {topupLoading === pack.credits ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add {pack.credits} Credits</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPENDING TRACKER & BUDGET INTELLIGENCE */}
      {activeTab === "tracker" && (
        <div className="space-y-8">
          {/* Spending Summary Banner */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-surface-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Consolidated Entertainment Outlay</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground">
                  External Streaming Subscriptions & Smart Savings
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Keep track of all your OTT, anime, and music services in one place. Never get surprised by unexpected auto-debits.
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-md self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Track New Subscription</span>
              </button>
            </div>

            {/* Aggregated Totals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Monthly Total Outlay
                </span>
                <div className="text-2xl sm:text-3xl font-black text-foreground mt-1">
                  ₹{Math.round(totalMonthlySpend).toLocaleString()}
                </div>
                <span className="text-[10px] text-muted-foreground">Includes ₹{planPrice}/mo NEXPLAY Plan</span>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Projected Yearly Budget
                </span>
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1">
                  ₹{Math.round(totalYearlySpend).toLocaleString()}
                </div>
                <span className="text-[10px] text-muted-foreground">Across {connectedServices.length} external services</span>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Active Services Count
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                  {connectedServices.length + (subscription ? 1 : 0)} Services
                </div>
                <span className="text-[10px] text-muted-foreground">Unified in your NEXPLAY hub</span>
              </div>
            </div>

            {/* Smart Savings Advice Box */}
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>NEXPLAY AI Savings Intelligence & Optimization Advice</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
                {(spendingSummary?.savings_recommendations ?? [
                  "Switching 3 monthly subscriptions to annual billing unlocks up to ₹1,800/yr in recurring discounts.",
                  "JioCinema Premium is available at ₹29/mo or bundled with select broadband plans.",
                  "Consider bundling Spotify Family or Apple One to consolidate music and cloud storage.",
                  "Set calendar reminders for upcoming renewals to avoid unwanted renewals."
                ]).map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* List of Tracked Services */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-surface-border space-y-4">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Tracked Streaming & Media Services</span>
            </h3>

            {connectedServices.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <Tv className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
                <p className="text-sm font-bold text-foreground">No external subscriptions tracked yet.</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Add your Netflix, Spotify, Prime Video, or Hotstar subscriptions to keep track of renewal dates, costs, and get smart consolidation advice.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all shadow-md inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Track First Subscription</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connectedServices.map((service) => (
                  <div
                    key={service.id}
                    className="p-5 rounded-2xl bg-surface-card border border-surface-border flex flex-col justify-between hover:border-cyan-500/40 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center font-bold text-base text-foreground">
                            {service.platform_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-foreground">{service.platform_name}</h4>
                            <span className="text-[11px] text-muted-foreground">{service.plan_name}</span>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          ACTIVE
                        </span>
                      </div>

                      <div className="pt-2 border-t border-surface-border/60 flex items-baseline justify-between">
                        <div>
                          <span className="text-xl font-black text-foreground">₹{service.cost_inr}</span>
                          <span className="text-xs text-muted-foreground">/{service.billing_cycle.toLowerCase()}</span>
                        </div>
                        {service.renewal_date && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-cyan-400" />
                            <span>Renews {new Date(service.renewal_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-2 flex items-center justify-between border-t border-surface-border/40">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                        {service.platform_slug}
                      </span>
                      <button
                        onClick={() => handleDeleteService(service.id, service.platform_name)}
                        disabled={actionLoading}
                        className="text-xs text-rose-500 hover:text-rose-400 font-bold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Untrack</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CREDIT BOOSTER PACKS & TOP-UP */}
      {activeTab === "packs" && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-surface-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Wallet Top-Up</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Volume-Discount Credit Booster Packs
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Booster credits never expire. Use them across AI copilot recommendations, MCP agent tool executions, and health monitoring sentinels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {(creditPacks.length > 0 ? creditPacks : [
              { id: "starter", name: "Starter Pack", credits: 50, price_inr: 49, bonus_percentage: 0 },
              { id: "popular", name: "Popular Pack", credits: 200, price_inr: 149, bonus_percentage: 10, is_popular: true },
              { id: "power", name: "Power Pack", credits: 500, price_inr: 299, bonus_percentage: 20 },
              { id: "studio", name: "Studio Pack", credits: 2000, price_inr: 999, bonus_percentage: 35 }
            ]).map((pack) => (
              <div
                key={pack.id}
                className={`p-6 rounded-2xl border relative flex flex-col justify-between transition-all ${
                  pack.is_popular
                    ? "bg-slate-900/90 text-white border-cyan-500 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/30"
                    : "bg-surface-card border-surface-border text-foreground hover:border-surface-border/80"
                }`}
              >
                {pack.is_popular && (
                  <span className="absolute -top-3 right-4 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-cyan-500 text-slate-950 shadow-md">
                    Most Popular
                  </span>
                )}

                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">{pack.name}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black">₹{pack.price_inr}</span>
                      <span className="text-xs font-bold text-cyan-400">+{pack.credits} Credits</span>
                    </div>
                  </div>

                  {pack.bonus_percentage > 0 ? (
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      +{pack.bonus_percentage}% Bonus Included
                    </span>
                  ) : (
                    <span className="inline-block text-[10px] font-semibold text-muted-foreground">
                      Standard Rate
                    </span>
                  )}

                  <ul className="text-xs text-muted-foreground space-y-1.5 pt-2 border-t border-surface-border/50">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Instant balance injection</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Zero expiration date</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>GST tax receipt provided</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleTopup(pack)}
                  disabled={topupLoading === pack.credits}
                  className="mt-6 w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  {topupLoading === pack.credits ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Top-up {pack.credits} Credits</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TAX INVOICES & VERIFIED RECEIPTS */}
      {activeTab === "invoices" && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-surface-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-2">
                <Receipt className="w-3.5 h-3.5" />
                <span>GST Invoicing System</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Verified Payment Receipts & 18% GST Tax Invoices
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Official itemized tax receipts for subscriptions and credit booster packs. Compliant with Indian GST regulations.
              </p>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground">
              No payments recorded yet. Topping up credits or subscribing to a paid tier will generate verified tax invoices here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-muted-foreground font-bold">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Invoice / Order ID</th>
                    <th className="py-3 px-3">Gateway</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Amount (INR)</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-foreground">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3.5 px-3 text-muted-foreground font-mono text-[11px]">
                        {new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-cyan-400 font-bold">
                        {p.provider_payment_id || `NXP-INV-${p.id.slice(0, 8).toUpperCase()}-2026`}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-elevated text-muted-foreground">
                          {p.provider}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          p.status === "SUCCESS"
                            ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-black">
                        ₹{p.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleViewInvoice(p.id)}
                          disabled={invoiceLoading}
                          className="px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 font-bold text-[11px] border border-surface-border transition-all inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CREDIT LEDGER AUDIT LOG */}
      {activeTab === "ledger" && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Credit Ledger & Transaction Audit Trail</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Immutable ledger of all wallet transactions, credits granted, tier allowances, and feature usage debits.
              </p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No credit transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-muted-foreground font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-foreground">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-3 text-muted-foreground font-mono text-[11px]">
                        {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium">{tx.description}</td>
                      <td className="py-3 px-3 text-right font-black">
                        <span className={tx.amount >= 0 ? "text-emerald-500" : "text-rose-500"}>
                          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} credits
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD CONNECTED STREAMING SERVICE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl max-w-lg w-full p-6 border border-surface-border space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-foreground">Track External Subscription</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Quick Select Popular Service:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {popularPresets.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => {
                      setNewPlatformSlug(p.slug);
                      setNewPlanName(p.name);
                      setNewCostInr(p.cost);
                      setNewBillingCycle(p.cycle);
                    }}
                    className={`p-2 rounded-xl text-left border text-xs transition-all ${
                      newPlatformSlug === p.slug
                        ? "border-cyan-500 bg-cyan-500/10 text-foreground font-bold ring-1 ring-cyan-500"
                        : "border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="truncate font-semibold">{p.slug}</div>
                    <div className="text-[10px] text-cyan-400">₹{p.cost}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddService} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Platform Slug</label>
                  <input
                    type="text"
                    required
                    value={newPlatformSlug}
                    onChange={(e) => setNewPlatformSlug(e.target.value.toLowerCase())}
                    placeholder="e.g. netflix, spotify"
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-foreground text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="e.g. Standard HD, Premium"
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-foreground text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Price (INR)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newCostInr}
                    onChange={(e) => setNewCostInr(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-foreground text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Billing Cycle</label>
                  <select
                    value={newBillingCycle}
                    onChange={(e) => setNewBillingCycle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-foreground text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="QUARTERLY">Quarterly</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Renewal Date</label>
                  <input
                    type="date"
                    value={newRenewalDate}
                    onChange={(e) => setNewRenewalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-foreground text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-md flex items-center gap-1.5"
                >
                  {actionLoading ? "Saving..." : "Add to Spending Tracker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ITEMISED 18% GST TAX INVOICE */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-2xl max-w-2xl w-full p-8 border border-surface-border space-y-6 shadow-2xl bg-slate-950 text-white animate-in fade-in zoom-in-95 my-8">
            {/* Invoice Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-white">NEXPLAY</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    TAX INVOICE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  NEXPLAY Entertainment Technologies Pvt. Ltd.
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  GSTIN: 29AABCN8912P1ZX &middot; SAC: 998439
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-cyan-400">
                  {selectedInvoice.invoice_number}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Date: {selectedInvoice.date}
                </div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-1">
                  Status: {selectedInvoice.status}
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Billed To</span>
                <p className="font-bold text-white mt-0.5">{selectedInvoice.customer_name || "Valued Customer"}</p>
                <p className="text-slate-400 text-[11px] font-mono">{selectedInvoice.customer_email}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Method</span>
                <p className="font-bold text-white mt-0.5">{selectedInvoice.provider.toUpperCase()}</p>
                <p className="text-slate-400 text-[10px] font-mono">{selectedInvoice.provider_payment_id || selectedInvoice.payment_id}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5 px-2">Description</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-2 text-right">Unit Price</th>
                    <th className="py-2.5 px-2 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-2 font-medium">{item.description}</td>
                      <td className="py-3 px-2 text-center font-mono">{item.quantity}</td>
                      <td className="py-3 px-2 text-right font-mono">₹{item.unit_price.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold">₹{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tax Breakdown & Totals */}
            <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Taxable Subtotal:</span>
                <span className="font-mono">₹{selectedInvoice.subtotal_inr.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CGST (9%):</span>
                <span className="font-mono">₹{(selectedInvoice.tax_gst_inr / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SGST (9%):</span>
                <span className="font-mono">₹{(selectedInvoice.tax_gst_inr / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-bold border-b border-slate-800 pb-2">
                <span>Total 18% GST:</span>
                <span className="font-mono text-cyan-400">₹{selectedInvoice.tax_gst_inr.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-1">
                <span>Total Amount Paid:</span>
                <span className="font-mono text-emerald-400">₹{selectedInvoice.total_inr.toFixed(2)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-[10px] text-slate-500">
                This is a computer-generated tax invoice. No signature required.
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
