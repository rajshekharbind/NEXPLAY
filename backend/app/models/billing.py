import enum
from sqlalchemy import String, Boolean, Enum, ForeignKey, Text, Integer, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    TRIAL = "TRIAL"

class TransactionType(str, enum.Enum):
    PURCHASE = "PURCHASE"
    USAGE_DEDUCTION = "USAGE_DEDUCTION"
    BONUS = "BONUS"
    REFUND = "REFUND"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

class SubscriptionPlan(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "subscription_plans"

    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False) # FREE, STARTER, PLUS, PRO
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    price_inr: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    billing_cycle: Mapped[str] = mapped_column(String(20), default="MONTHLY", nullable=False)
    credit_allowance: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    features: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    subscriptions: Mapped[list["Subscription"]] = relationship("Subscription", back_populates="plan")

class Subscription(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "subscriptions"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[SubscriptionStatus] = mapped_column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, nullable=False)
    starts_at: Mapped[str] = mapped_column(String(50), nullable=True)
    ends_at: Mapped[str] = mapped_column(String(50), nullable=True)
    gateway_subscription_id: Mapped[str] = mapped_column(String(255), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="subscriptions")
    plan: Mapped["SubscriptionPlan"] = relationship("SubscriptionPlan", back_populates="subscriptions")

class CreditWallet(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "credit_wallets"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    balance_credits: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    lifetime_earned: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    lifetime_spent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="wallet")
    transactions: Mapped[list["CreditTransaction"]] = relationship("CreditTransaction", back_populates="wallet", cascade="all, delete-orphan")

class CreditTransaction(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "credit_transactions"

    wallet_id: Mapped[str] = mapped_column(String(36), ForeignKey("credit_wallets.id", ondelete="CASCADE"), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False) # Positive or negative
    transaction_type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), default=TransactionType.USAGE_DEDUCTION, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    reference_id: Mapped[str] = mapped_column(String(100), nullable=True)

    wallet: Mapped["CreditWallet"] = relationship("CreditWallet", back_populates="transactions")

class UsageRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "usage_records"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    feature_code: Mapped[str] = mapped_column(String(80), nullable=False) # AI_RECOMMENDATION, SEMANTIC_SEARCH, PLAYWRIGHT_HEALTH_CHECK
    credits_deducted: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    metadata_payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

class Payment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "payments"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    provider: Mapped[str] = mapped_column(String(50), default="RAZORPAY", nullable=False)
    provider_payment_id: Mapped[str] = mapped_column(String(255), nullable=True)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
