import {
  Platform,
  PlatformCategory,
  ApiResponse,
  HealthInfo,
  ContentItem,
  Watchlist,
  WatchlistItem,
  WatchlistStatus,
  AIMoodItem,
  AIRecommendResponse,
  AIChatResponse,
  RecommendationHistoryItem,
  MCPTool,
  MCPConfigResponse,
  AutomationJob,
  AutomationRun,
  PlatformHealthItem,
  EcosystemHealthSummary,
  NotificationItem,
  CreditPack,
  BillingAnalytics,
  ConnectedStreamingService,
  SpendingSummary,
  TaxInvoice
} from "@/types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export async function fetchHealth(): Promise<HealthInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    if (!res.ok) return null;
    const json: ApiResponse<HealthInfo> = await res.json();
    return json.data;
  } catch (err) {
    console.error("Health check error:", err);
    return null;
  }
}

export async function fetchCategories(): Promise<PlatformCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/platforms/categories`, { cache: "no-store" });
    if (!res.ok) return [];
    const json: ApiResponse<PlatformCategory[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Fetch categories error:", err);
    return [];
  }
}

export async function fetchPlatforms(categorySlug?: string, search?: string): Promise<Platform[]> {
  try {
    const params = new URLSearchParams();
    if (categorySlug) params.append("category", categorySlug);
    if (search) params.append("search", search);

    const url = `${API_BASE}/platforms/?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json: ApiResponse<Platform[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Fetch platforms error:", err);
    return [];
  }
}

export async function fetchFeaturedContent(limit = 10): Promise<ContentItem[]> {
  try {
    const res = await fetch(`${API_BASE}/content/featured?limit=${limit}`, { cache: "no-store" });
    if (!res.ok) return [];
    const json: ApiResponse<ContentItem[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Fetch featured content error:", err);
    return [];
  }
}

// Watchlist API Services
export async function fetchWatchlists(token: string): Promise<Watchlist[]> {
  try {
    const res = await fetch(`${API_BASE}/watchlists`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json: ApiResponse<Watchlist[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Fetch watchlists error:", err);
    return [];
  }
}

export async function createWatchlist(token: string, name: string, isPublic = false): Promise<Watchlist | null> {
  try {
    const res = await fetch(`${API_BASE}/watchlists`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, is_public: isPublic }),
    });
    if (!res.ok) return null;
    const json: ApiResponse<Watchlist> = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("Create watchlist error:", err);
    return null;
  }
}

export async function toggleWatchlist(token: string, contentId: string): Promise<{ action: "added" | "removed"; item?: WatchlistItem } | null> {
  try {
    const res = await fetch(`${API_BASE}/watchlists/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content_id: contentId }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error("Toggle watchlist error:", err);
    return null;
  }
}

export async function checkWatchlistStatus(token: string, contentId: string): Promise<{ in_watchlist: boolean; item_id?: string; status?: WatchlistStatus; personal_rating?: number }> {
  try {
    const res = await fetch(`${API_BASE}/watchlists/check/${contentId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { in_watchlist: false };
    const json = await res.json();
    return json.data || { in_watchlist: false };
  } catch (err) {
    return { in_watchlist: false };
  }
}

export async function updateWatchlistItem(
  token: string,
  itemId: string,
  updates: { status?: WatchlistStatus; personal_rating?: number; notes?: string }
): Promise<WatchlistItem | null> {
  try {
    const res = await fetch(`${API_BASE}/watchlists/items/${itemId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return null;
    const json: ApiResponse<WatchlistItem> = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("Update watchlist item error:", err);
    return null;
  }
}

export async function deleteWatchlistItem(token: string, itemId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/watchlists/items/${itemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (err) {
    console.error("Delete watchlist item error:", err);
    return false;
  }
}

// AI Copilot & Recommendations API Services
export async function fetchAIMoods(): Promise<AIMoodItem[]> {
  try {
    const res = await fetch(`${API_BASE}/ai/moods`, { cache: "no-store" });
    if (!res.ok) return [];
    const json: ApiResponse<AIMoodItem[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Fetch AI moods error:", err);
    return [];
  }
}

export async function getAIRecommendations(
  params: {
    query?: string;
    mood?: string;
    content_type?: string;
    platform_slug?: string;
    max_runtime?: number;
    min_rating?: number;
    is_free_only?: boolean;
    limit?: number;
  },
  token?: string
): Promise<AIRecommendResponse | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/ai/recommend`, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
      cache: "no-store"
    });
    if (!res.ok) return null;
    const json: ApiResponse<AIRecommendResponse> = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("Get AI recommendations error:", err);
    return null;
  }
}

export async function sendAIChat(
  params: {
    messages: { role: string; content: string }[];
    mood?: string;
    preferred_platforms?: string[];
  },
  token?: string
): Promise<AIChatResponse | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
      cache: "no-store"
    });
    if (!res.ok) return null;
    const json: ApiResponse<AIChatResponse> = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("Send AI chat error:", err);
    return null;
  }
}

export async function fetchAIHistory(token: string, limit = 15): Promise<RecommendationHistoryItem[]> {
  try {
    const res = await fetch(`${API_BASE}/ai/history?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!res.ok) return [];
    const json: ApiResponse<RecommendationHistoryItem[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Fetch AI history error:", err);
    return [];
  }
}

// Model Context Protocol (MCP) Services
export async function fetchMCPTools(): Promise<MCPTool[]> {
  try {
    const res = await fetch(`${API_BASE}/mcp/tools`, { cache: "no-store" });
    if (!res.ok) return [];
    const json: ApiResponse<MCPTool[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Fetch MCP tools error:", err);
    return [];
  }
}

export async function executeMCPTool(name: string, args: Record<string, any> = {}): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/mcp/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, arguments: args }),
      cache: "no-store"
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.detail || "Tool execution failed");
    }
    const json: ApiResponse<any> = await res.json();
    return json.data;
  } catch (err: any) {
    console.error("Execute MCP tool error:", err);
    throw err;
  }
}

export async function fetchMCPConfig(): Promise<MCPConfigResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/mcp/config`, { cache: "no-store" });
    if (!res.ok) return null;
    const json: ApiResponse<MCPConfigResponse> = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("Fetch MCP config error:", err);
    return null;
  }
}

// Automation, Background Workers & Link Health Services
export async function fetchAutomationJobs(): Promise<AutomationJob[]> {
  try {
    const res = await fetch(`${API_BASE}/automation/jobs`, { cache: "no-store" });
    if (!res.ok) return [];
    const json: ApiResponse<AutomationJob[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Fetch automation jobs error:", err);
    return [];
  }
}

export async function triggerAutomationJob(jobId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/automation/jobs/${jobId}/run`, {
      method: "POST",
      cache: "no-store"
    });
    if (!res.ok) return null;
    const json: ApiResponse<any> = await res.json();
    return json.data;
  } catch (err) {
    console.error("Trigger job error:", err);
    return null;
  }
}

export async function fetchAutomationRuns(limit = 20): Promise<AutomationRun[]> {
  try {
    const res = await fetch(`${API_BASE}/automation/runs?limit=${limit}`, { cache: "no-store" });
    if (!res.ok) return [];
    const json: ApiResponse<AutomationRun[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Fetch automation runs error:", err);
    return [];
  }
}

export async function fetchHealthSummary(): Promise<EcosystemHealthSummary | null> {
  try {
    const res = await fetch(`${API_BASE}/automation/health-summary`, { cache: "no-store" });
    if (!res.ok) return null;
    const json: ApiResponse<EcosystemHealthSummary> = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("Fetch health summary error:", err);
    return null;
  }
}

export async function fetchPlatformsHealth(): Promise<PlatformHealthItem[]> {
  try {
    const res = await fetch(`${API_BASE}/automation/platforms-health`, { cache: "no-store" });
    if (!res.ok) return [];
    const json: ApiResponse<PlatformHealthItem[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Fetch platforms health error:", err);
    return [];
  }
}

export async function fetchUserNotifications(token: string): Promise<NotificationItem[]> {
  try {
    const res = await fetch(`${API_BASE}/automation/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!res.ok) return [];
    const json: ApiResponse<NotificationItem[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Fetch notifications error:", err);
    return [];
  }
}

export async function markNotificationRead(token: string, notifId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/automation/notifications/${notifId}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    return res.ok;
  } catch (err) {
    console.error("Mark notification read error:", err);
    return false;
  }
}

export async function markAllNotificationsRead(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/automation/notifications/read-all`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    return res.ok;
  } catch (err) {
    console.error("Mark all notifications read error:", err);
    return false;
  }
}

// Enterprise Billing & Spending Intelligence Services
export async function fetchCreditPacks(): Promise<CreditPack[]> {
  try {
    const res = await fetch(`${API_BASE}/billing/credit-packs`, { cache: "no-store" });
    if (!res.ok) return [];
    const json: ApiResponse<CreditPack[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Fetch credit packs error:", err);
    return [];
  }
}

export async function fetchBillingAnalytics(token: string): Promise<BillingAnalytics | null> {
  try {
    const res = await fetch(`${API_BASE}/billing/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!res.ok) return null;
    const json: ApiResponse<BillingAnalytics> = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("Fetch billing analytics error:", err);
    return null;
  }
}

export async function fetchTaxInvoice(token: string, paymentId: string): Promise<TaxInvoice | null> {
  try {
    const res = await fetch(`${API_BASE}/billing/payments/${paymentId}/invoice`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!res.ok) return null;
    const json: ApiResponse<TaxInvoice> = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("Fetch tax invoice error:", err);
    return null;
  }
}

export async function fetchConnectedServices(token: string): Promise<ConnectedStreamingService[]> {
  try {
    const res = await fetch(`${API_BASE}/billing/connected-services`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!res.ok) return [];
    const json: ApiResponse<ConnectedStreamingService[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Fetch connected services error:", err);
    return [];
  }
}

export async function addConnectedService(
  token: string,
  data: { platform_slug: string; plan_name: string; cost_inr: number; billing_cycle?: string; renewal_date?: string }
): Promise<ConnectedStreamingService | null> {
  try {
    const res = await fetch(`${API_BASE}/billing/connected-services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data),
      cache: "no-store"
    });
    if (!res.ok) return null;
    const json: ApiResponse<ConnectedStreamingService> = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("Add connected service error:", err);
    return null;
  }
}

export async function deleteConnectedService(token: string, serviceId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/billing/connected-services/${serviceId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    return res.ok;
  } catch (err) {
    console.error("Delete connected service error:", err);
    return false;
  }
}

export async function fetchSpendingSummary(token: string): Promise<SpendingSummary | null> {
  try {
    const res = await fetch(`${API_BASE}/billing/spending-summary`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!res.ok) return null;
    const json: ApiResponse<SpendingSummary> = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("Fetch spending summary error:", err);
    return null;
  }
}

