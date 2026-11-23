"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  CreditCard,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Cpu
} from "lucide-react";
import Card3D from "@/components/Card3D";
import { useAuth } from "@/components/AuthContext";
import { API_BASE } from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_inr: number;
  billing_cycle: string;
  credit_allowance: number;
  features: Record<string, any>;
  is_active: boolean;
}

export default function PricingPage() {
  const { user, token, isAuthenticated, refreshUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanSlug, setCurrentPlanSlug] = useState<string>("free");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  // Fetch plans from backend
  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch(`${API_BASE}/billing/plans`);
        const json = await res.json();
        if (json.success && json.data) {
          setPlans(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch billing plans", err);
      }
    }

    async function fetchSubscription() {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/billing/subscription`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data?.plan?.slug) {
          setCurrentPlanSlug(json.data.plan.slug);
        }
      } catch (err) {
        console.error("Failed to fetch user subscription", err);
      }
    }

    fetchPlans();
    fetchSubscription();
  }, [token]);

  const handleSubscribe = async (planSlug: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/pricing`);
      return;
    }

    setLoading(planSlug);
    setMessage(null);

    try {
      const selectedPlan = plans.find((p) => p.slug === planSlug);
      const amount = selectedPlan ? selectedPlan.price_inr : 0;

      // 1. Create Checkout Order
      let paymentId: string | null = null;
      if (amount > 0) {
        const orderRes = await fetch(`${API_BASE}/billing/checkout/order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: amount,
            purpose: "SUBSCRIPTION",
            plan_slug: planSlug
          })
        });
        const orderJson = await orderRes.json();
        if (orderJson.success && orderJson.data?.payment_id) {
          paymentId = orderJson.data.payment_id;
        }
      }

      // 2. Process Subscription Plan Update
      const res = await fetch(`${API_BASE}/billing/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan_slug: planSlug })
      });
      const data = await res.json();

      // 3. Verify Payment Record if order was created
      if (paymentId) {
        await fetch(`${API_BASE}/billing/checkout/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            payment_id: paymentId,
            provider_payment_id: `pay_rzp_sim_${Date.now()}`
          })
        });
      }

      if (res.ok && data.success) {
        setMessage({ type: "success", text: data.message });
        setCurrentPlanSlug(planSlug);
        await refreshUser();
      } else {
        setMessage({ type: "error", text: data.detail || "Subscription update failed." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error connecting to payment service." });
    } finally {
      setLoading(null);
    }
  };

  const planTiers = [
    {
      name: "Free",
      slug: "free",
      price: 0,
      period: "forever",
      description: "Essential entertainment discovery across all 40+ platforms.",
      credits: 50,
      badge: "Base Tier",
      glowColor: "#64748b",
      features: [
        "Account creation & profile",
        "Full 40+ platform directory",
        "Direct verified platform deep links",
        "Universal content search",
        "Basic genre & mood recommendations",
        "50 AI Discovery Credits / mo"
      ],
      cta: "Current Free Tier",
      highlight: false
    },
    {
      name: "Starter",
      slug: "starter",
      price: 49,
      period: "month",
      description: "Personalized dashboard, multi-device watchlists & enhanced discovery.",
      credits: 250,
      badge: "Popular Starter",
      glowColor: "#00A8E1",
      features: [
        "Everything in Free Tier",
        "Personalized multi-category dashboard",
        "Up to 5 custom watchlists & sync",
        "Track unwatched episodes & releases",
        "250 AI Discovery & Search Credits / mo",
        "Zero 3rd party ad banners"
      ],
      cta: "Upgrade to Starter",
      highlight: false
    },
    {
      name: "Plus",
      slug: "plus",
      price: 149,
      period: "month",
      description: "Advanced semantic AI discovery, copilot assistant & subscription tracking.",
      credits: 750,
      badge: "Most Recommended",
      glowColor: "#E50914",
      features: [
        "Everything in Starter Tier",
        "Semantic vector AI recommendation engine",
        "NEXPLAY AI Entertainment Copilot chat",
        "Real-time platform availability tracking",
        "750 AI Credits / mo",
        "Priority customer support"
      ],
      cta: "Upgrade to Plus",
      highlight: true
    },
    {
      name: "Pro",
      slug: "pro",
      price: 299,
      period: "month",
      description: "Maximum AI power, MCP external agent protocol & automated Playwright monitoring.",
      credits: 2000,
      badge: "Power Connoisseur",
      glowColor: "#1DB954",
      features: [
        "Everything in Plus Tier",
        "2,000 AI Credits / mo allowance",
        "Direct NEXPLAY MCP server tool access",
        "Playwright automated stream health checks",
        "Multi-profile household family sharing",
        "Early VIP beta access to new integrations"
      ],
      cta: "Upgrade to Pro",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Transparent & Usage-Based Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          One Account. Every Destination. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#E50914] via-[#00A8E1] to-[#1DB954]">
            Predictable, Fair Plans.
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          NEXPLAY aggregates 40+ premier streaming, music, video, anime, and podcast services into a single unified hub. Choose the tier that matches your entertainment habits.
        </p>

        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold max-w-md mx-auto ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Model B: Premium Plans Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500 dark:text-cyan-400" />
            <span>NEXPLAY Subscription Plans (Model B)</span>
          </h2>
          {isAuthenticated && (
            <Link
              href="/billing"
              className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>View My Credit Wallet & Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {planTiers.map((tier) => {
            const isCurrent = currentPlanSlug === tier.slug;
            return (
              <Card3D
                key={tier.slug}
                brandGlowColor={tier.glowColor}
                intensity={8}
                className="h-full"
              >
                <div
                  className={`h-full flex flex-col justify-between p-6 rounded-2xl border transition-all ${
                    tier.highlight
                      ? "bg-slate-900/95 dark:bg-slate-900/90 text-white border-red-500/50 shadow-2xl shadow-red-500/10 ring-1 ring-red-500/30"
                      : "glass-card border-surface-border text-slate-900 dark:text-white"
                  }`}
                >
                  <div className="space-y-5">
                    {/* Tier Header & Badge */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                          {tier.badge}
                        </span>
                        <h3 className="text-2xl font-black mt-2">{tier.name}</h3>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {tier.description}
                    </p>

                    {/* Price in INR */}
                    <div className="pt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black">
                          ₹{tier.price}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          / {tier.period}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-indigo-500 dark:text-cyan-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Includes {tier.credits} AI credits/mo</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                        What&apos;s Included:
                      </p>
                      <ul className="space-y-2 text-xs">
                        {tier.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-slate-600 dark:text-slate-300">
                              {feat}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => handleSubscribe(tier.slug)}
                      disabled={isCurrent || loading === tier.slug}
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                        isCurrent
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700"
                          : tier.highlight
                          ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white hover:scale-[1.02]"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02]"
                      }`}
                    >
                      {loading === tier.slug ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : (
                        <>
                          <span>{tier.cta}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Card3D>
            );
          })}
        </div>
      </div>

      {/* Model A vs Model B Comprehensive Feature Breakdown Table */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-surface-border space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-500 dark:text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Model A vs Model B Matrix</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Feature Comparison Table
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare all features across free discovery and premium utility tiers.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-bold">Platform Feature</th>
                <th className="py-3 px-4 font-bold">Model A — Free Plan</th>
                <th className="py-3 px-4 font-bold text-indigo-500 dark:text-cyan-400">
                  Model B — Starter (₹49)
                </th>
                <th className="py-3 px-4 font-bold text-red-500">
                  Model B — Plus (₹149)
                </th>
                <th className="py-3 px-4 font-bold text-emerald-500">
                  Model B — Pro (₹299)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-3 px-4 font-semibold">Account Creation & Sync</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Free</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Included</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Included</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Multi-profile Family</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">40+ Platform Directory</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Full Access</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Full Access</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Full Access</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Full Access</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">External Platform Deep Links</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Unlimited</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Unlimited</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Unlimited</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Instant Launch</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Personalized Watchlists</td>
                <td className="py-3 px-4 text-slate-400">1 Default List</td>
                <td className="py-3 px-4">Up to 5 Lists</td>
                <td className="py-3 px-4">Unlimited Lists</td>
                <td className="py-3 px-4">Unlimited + Smart Tags</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">AI Monthly Credit Allowance</td>
                <td className="py-3 px-4 font-bold">50 Credits</td>
                <td className="py-3 px-4 font-bold text-indigo-400">250 Credits</td>
                <td className="py-3 px-4 font-bold text-red-400">750 Credits</td>
                <td className="py-3 px-4 font-bold text-emerald-400">2,000 Credits</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Semantic Vector Search</td>
                <td className="py-3 px-4 text-slate-400">Keyword Only</td>
                <td className="py-3 px-4 text-slate-400">Keyword + Basic Tag</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Full pgvector RAG</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Full pgvector RAG</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Playwright Stream Audits</td>
                <td className="py-3 px-4 text-slate-400">Not Available</td>
                <td className="py-3 px-4 text-slate-400">Not Available</td>
                <td className="py-3 px-4 text-slate-400">On-demand</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Scheduled Auto-Check</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">External MCP Server Integration</td>
                <td className="py-3 px-4 text-slate-400">Not Available</td>
                <td className="py-3 px-4 text-slate-400">Not Available</td>
                <td className="py-3 px-4 text-slate-400">Not Available</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Full External Access</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
