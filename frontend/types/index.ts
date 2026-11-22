export type PlatformPricingType = "FREE" | "PAID" | "FREEMIUM" | "SUBSCRIPTION";
export type PlatformIntegrationType = "OFFICIAL_LINK" | "OFFICIAL_API" | "OAUTH" | "PARTNER" | "FREE_CONTENT";

export interface PlatformCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
}

export interface Platform {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  logo_url?: string;
  banner_url?: string;
  official_url: string;
  description?: string;
  pricing_type: PlatformPricingType;
  integration_type: PlatformIntegrationType;
  supported_features: Record<string, any>;
  is_active: boolean;
  region_availability: string[];
  display_priority: number;
  category_name?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface HealthInfo {
  status: string;
  app: string;
  version: string;
  environment: string;
  database_status: string;
  platforms_loaded: number;
  timestamp: string;
}

export type ContentType = "MOVIE" | "SERIES" | "SONG" | "ALBUM" | "PODCAST" | "VIDEO" | "ANIME" | "AUDIOBOOK";
export type AvailabilityType = "SUBSCRIPTION" | "FREE" | "RENT" | "BUY" | "AD_SUPPORTED";
export type WatchlistStatus = "PLANNED" | "WATCHING" | "COMPLETED" | "DROPPED";

export interface StreamingOption {
  platform_name: string;
  platform_slug: string;
  platform_logo?: string;
  availability_type: AvailabilityType;
  pricing_details: string;
  stream_url: string;
}

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content_type: ContentType;
  description?: string;
  poster_url?: string;
  backdrop_url?: string;
  release_date?: string;
  duration_minutes: number;
  rating: number;
  maturity_rating: string;
  original_language: string;
  view_count: number;
  is_featured: boolean;
  is_free: boolean;
  genres: string[];
  streaming_options: StreamingOption[];
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  content_id: string;
  status: WatchlistStatus;
  personal_rating?: number;
  notes?: string;
  created_at?: string;
  content?: ContentItem;
}

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  is_public: boolean;
  items_count: number;
  items: WatchlistItem[];
  created_at?: string;
}

// AI Copilot & Recommendation Engine Types
export interface AIMoodItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  gradient: string;
  sample_prompt: string;
  suggested_genres: string[];
}

export interface AIRecommendationItem {
  id: string;
  title: string;
  slug: string;
  content_type: ContentType;
  description?: string;
  poster_url?: string;
  backdrop_url?: string;
  rating: number;
  duration_minutes: number;
  maturity_rating: string;
  original_language: string;
  genres: string[];
  match_score: number;
  reasoning: string;
  algorithm_source: string;
  streaming_options: StreamingOption[];
}

export interface AIRecommendResponse {
  query?: string;
  detected_intent: string;
  detected_mood?: string;
  detected_filters: Record<string, any>;
  recommendations: AIRecommendationItem[];
  total_results: number;
  credits_used: number;
  credits_remaining?: number;
}

export interface AIChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface AIChatResponse {
  role: "assistant";
  content: string;
  detected_intent: string;
  recommendations: AIRecommendationItem[];
  suggested_followups: string[];
  credits_remaining?: number;
}

export interface RecommendationHistoryItem {
  id: string;
  content_id: string;
  content_title: string;
  content_type: string;
  poster_url?: string;
  score: number;
  reasoning?: string;
  created_at: string;
}

// Model Context Protocol (MCP) Types
export interface MCPToolProperty {
  type: string;
  description?: string;
  enum?: string[];
  default?: any;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, MCPToolProperty>;
    required?: string[];
  };
}

export interface MCPConfigResponse {
  claude_desktop: Record<string, any>;
  cursor: Record<string, any>;
  http_endpoint: string;
  tools_count: number;
}

// Automation & Health Monitoring Types
export interface AutomationJob {
  id: string;
  name: string;
  job_type: string;
  cron_schedule?: string;
  is_active: boolean;
  config_payload: Record<string, any>;
  last_run_at?: string;
  last_status?: string;
  created_at: string;
}

export interface AutomationRun {
  id: string;
  job_id: string;
  job_name?: string;
  status: string;
  duration_ms: number;
  details?: string;
  created_at: string;
}

export interface PlatformHealthItem {
  platform_id: string;
  platform_name: string;
  platform_slug: string;
  official_url: string;
  status_code: number;
  is_healthy: boolean;
  latency_ms: number;
  last_checked: string;
}

export interface EcosystemHealthSummary {
  total_platforms: number;
  healthy_platforms: number;
  degraded_platforms: number;
  down_platforms: number;
  health_percentage: number;
  average_latency_ms: number;
  deep_links_checked: number;
  last_scan_timestamp: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

// Enterprise Billing & Spending Intelligence Types
export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price_inr: number;
  bonus_percentage: number;
  is_popular?: boolean;
}

export interface BillingAnalytics {
  total_credits_spent: number;
  total_credits_earned: number;
  balance_credits: number;
  by_feature: Record<string, number>;
  daily_usage_last_7_days: { day: string; credits: number }[];
  estimated_days_remaining: number;
  plan_tier: string;
}

export interface ConnectedStreamingService {
  id: string;
  platform_id: string;
  platform_name: string;
  platform_slug: string;
  platform_logo?: string;
  plan_name: string;
  cost_inr: number;
  billing_cycle: string;
  renewal_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface SpendingSummary {
  total_monthly_spend_inr: number;
  total_yearly_spend_inr: number;
  services_count: number;
  services: ConnectedStreamingService[];
  nexplay_plan_price: number;
  combined_entertainment_budget: number;
  savings_recommendations: string[];
}

export interface TaxInvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface TaxInvoice {
  invoice_number: string;
  payment_id: string;
  date: string;
  customer_email: string;
  customer_name?: string;
  items: TaxInvoiceItem[];
  subtotal_inr: number;
  tax_gst_inr: number;
  total_inr: number;
  provider: string;
  provider_payment_id?: string;
  status: string;
}

