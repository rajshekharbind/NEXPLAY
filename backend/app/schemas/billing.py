from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.models.billing import SubscriptionStatus, TransactionType, PaymentStatus

class SubscriptionPlanRead(BaseModel):
    id: str
    name: str
    slug: str
    price_inr: float
    billing_cycle: str
    credit_allowance: int
    features: Dict[str, Any]
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class SubscriptionRead(BaseModel):
    id: str
    user_id: str
    plan_id: str
    status: SubscriptionStatus
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    plan: Optional[SubscriptionPlanRead] = None

    model_config = ConfigDict(from_attributes=True)

class SubscribeRequest(BaseModel):
    plan_slug: str # "free", "starter", "plus", "pro"

class CreditTransactionRead(BaseModel):
    id: str
    wallet_id: str
    amount: int
    transaction_type: TransactionType
    description: str
    reference_id: Optional[str] = None
    created_at: Any

    model_config = ConfigDict(from_attributes=True)

class UsageRecordRead(BaseModel):
    id: str
    user_id: str
    feature_code: str
    credits_deducted: int
    metadata_payload: Dict[str, Any]
    created_at: Any

    model_config = ConfigDict(from_attributes=True)

class AddCreditsRequest(BaseModel):
    credits: int = 100
    payment_method: Optional[str] = "upi"

class PaymentRead(BaseModel):
    id: str
    user_id: str
    amount: float
    currency: str
    provider: str
    provider_payment_id: Optional[str] = None
    status: PaymentStatus
    created_at: Any

    model_config = ConfigDict(from_attributes=True)

class CheckoutOrderCreate(BaseModel):
    amount: float
    purpose: str = "SUBSCRIPTION" # "SUBSCRIPTION" or "CREDIT_TOPUP"
    plan_slug: Optional[str] = None
    credits: Optional[int] = None

class CheckoutOrderResponse(BaseModel):
    order_id: str
    payment_id: str
    amount: float
    currency: str
    provider: str
    key_id: str
    purpose: str
    plan_slug: Optional[str] = None
    credits: Optional[int] = None

class PaymentVerifyRequest(BaseModel):
    payment_id: str
    provider_payment_id: str
    provider_signature: Optional[str] = "simulated_signature_valid"

class CreditPack(BaseModel):
    id: str
    name: str
    credits: int
    price_inr: float
    bonus_percentage: int
    is_popular: bool = False

class BillingAnalytics(BaseModel):
    total_credits_spent: int
    total_credits_earned: int
    balance_credits: int
    by_feature: Dict[str, int]
    daily_usage_last_7_days: List[Dict[str, Any]]
    estimated_days_remaining: int
    plan_tier: str

class ConnectedStreamingServiceCreate(BaseModel):
    platform_slug: str
    plan_name: str
    cost_inr: float
    billing_cycle: str = "MONTHLY"
    renewal_date: Optional[str] = None

class ConnectedStreamingServiceRead(BaseModel):
    id: str
    platform_id: str
    platform_name: str
    platform_slug: str
    platform_logo: Optional[str] = None
    plan_name: str
    cost_inr: float
    billing_cycle: str
    renewal_date: Optional[str] = None
    is_active: bool
    created_at: str

    model_config = ConfigDict(from_attributes=True)

class SpendingSummary(BaseModel):
    total_monthly_spend_inr: float
    total_yearly_spend_inr: float
    services_count: int
    services: List[ConnectedStreamingServiceRead]
    nexplay_plan_price: float
    combined_entertainment_budget: float
    savings_recommendations: List[str]

class TaxInvoiceItem(BaseModel):
    description: str
    quantity: int
    unit_price: float
    amount: float

class TaxInvoiceRead(BaseModel):
    invoice_number: str
    payment_id: str
    date: str
    customer_email: str
    customer_name: Optional[str] = None
    items: List[TaxInvoiceItem]
    subtotal_inr: float
    tax_gst_inr: float
    total_inr: float
    provider: str
    provider_payment_id: Optional[str] = None
    status: str


