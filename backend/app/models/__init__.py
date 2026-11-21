# Export all models for Alembic and SQLAlchemy discovery
from app.db.base import Base
from app.models.user import User, UserProfile, UserRole, UserConnectedAccount
from app.models.platform import (
    PlatformCategory,
    Platform,
    PlatformIntegration,
    PlatformPricingType,
    PlatformIntegrationType,
)
from app.models.content import (
    Content,
    ContentType,
    Genre,
    ContentGenre,
    ContentPlatform,
    AvailabilityType,
)
from app.models.watchlist import (
    Watchlist,
    WatchlistItem,
    WatchlistStatus,
    UserPreference,
    UserActivity,
)
from app.models.billing import (
    SubscriptionPlan,
    Subscription,
    SubscriptionStatus,
    CreditWallet,
    CreditTransaction,
    TransactionType,
    UsageRecord,
    Payment,
    PaymentStatus,
)
from app.models.ai import Recommendation, Notification
from app.models.automation import AutomationJob, AutomationRun, AuditLog

__all__ = [
    "Base",
    "User",
    "UserProfile",
    "UserRole",
    "UserConnectedAccount",
    "PlatformCategory",
    "Platform",
    "PlatformIntegration",
    "PlatformPricingType",
    "PlatformIntegrationType",
    "Content",
    "ContentType",
    "Genre",
    "ContentGenre",
    "ContentPlatform",
    "AvailabilityType",
    "Watchlist",
    "WatchlistItem",
    "WatchlistStatus",
    "UserPreference",
    "UserActivity",
    "SubscriptionPlan",
    "Subscription",
    "SubscriptionStatus",
    "CreditWallet",
    "CreditTransaction",
    "TransactionType",
    "UsageRecord",
    "Payment",
    "PaymentStatus",
    "Recommendation",
    "Notification",
    "AutomationJob",
    "AutomationRun",
    "AuditLog",
]
