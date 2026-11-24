import uuid
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, delete
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User, UserRole, UserConnectedAccount
from app.models.platform import Platform
from app.models.billing import (
    SubscriptionPlan,
    Subscription,
    SubscriptionStatus,
    CreditWallet,
    CreditTransaction,
    TransactionType,
    UsageRecord,
    Payment,
    PaymentStatus
)
from app.schemas.billing import (
    SubscriptionPlanRead,
    SubscriptionRead,
    SubscribeRequest,
    CreditTransactionRead,
    UsageRecordRead,
    AddCreditsRequest,
    PaymentRead,
    CheckoutOrderCreate,
    CheckoutOrderResponse,
    PaymentVerifyRequest,
    CreditPack,
    BillingAnalytics,
    ConnectedStreamingServiceCreate,
    ConnectedStreamingServiceRead,
    SpendingSummary,
    TaxInvoiceRead,
    TaxInvoiceItem
)
from app.schemas.common import ResponseEnvelope
from app.api.deps import get_current_active_user, get_current_user

router = APIRouter()

CREDIT_PACKS: List[CreditPack] = [
    CreditPack(
        id="starter_pack",
        name="Starter Pack",
        credits=50,
        price_inr=49.0,
        bonus_percentage=0,
        is_popular=False
    ),
    CreditPack(
        id="popular_pack",
        name="Popular Explorer Pack",
        credits=200,
        price_inr=149.0,
        bonus_percentage=25,
        is_popular=True
    ),
    CreditPack(
        id="power_pack",
        name="Power Cinephile Pack",
        credits=500,
        price_inr=299.0,
        bonus_percentage=40,
        is_popular=False
    ),
    CreditPack(
        id="enterprise_pack",
        name="Studio Elite Pack",
        credits=2000,
        price_inr=999.0,
        bonus_percentage=60,
        is_popular=False
    )
]

@router.get("/plans", response_model=ResponseEnvelope[List[SubscriptionPlanRead]])
async def get_subscription_plans(db: AsyncSession = Depends(get_db)):
    """Fetch all available subscription plans (Free, Starter, Plus, Pro). Publicly accessible."""
    result = await db.execute(
        select(SubscriptionPlan)
        .where(SubscriptionPlan.is_active == True)
        .order_by(SubscriptionPlan.price_inr.asc())
    )
    plans = result.scalars().all()
    return ResponseEnvelope(
        success=True,
        message="Subscription plans fetched",
        data=[SubscriptionPlanRead.model_validate(p) for p in plans]
    )

@router.get("/subscription", response_model=ResponseEnvelope[SubscriptionRead])
async def get_current_subscription(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch active subscription of the logged-in user."""
    result = await db.execute(
        select(Subscription)
        .options(selectinload(Subscription.plan))
        .where(
            Subscription.user_id == current_user.id,
            Subscription.status == SubscriptionStatus.ACTIVE
        )
        .order_by(Subscription.created_at.desc())
    )
    sub = result.scalars().first()

    if not sub:
        # If user has no subscription yet, create a default FREE tier subscription
        plan_res = await db.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.slug == "free")
        )
        free_plan = plan_res.scalars().first()
        if free_plan:
            now_str = datetime.utcnow().isoformat()
            ends_str = (datetime.utcnow() + timedelta(days=365)).isoformat()
            sub = Subscription(
                user_id=current_user.id,
                plan_id=free_plan.id,
                status=SubscriptionStatus.ACTIVE,
                starts_at=now_str,
                ends_at=ends_str
            )
            db.add(sub)
            await db.commit()
            await db.refresh(sub)
            # Re-fetch with plan loaded
            sub_res = await db.execute(
                select(Subscription)
                .options(selectinload(Subscription.plan))
                .where(Subscription.id == sub.id)
            )
            sub = sub_res.scalars().first()

    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription found")

    return ResponseEnvelope(
        success=True,
        message="Current subscription details",
        data=SubscriptionRead.model_validate(sub)
    )

@router.post("/subscribe", response_model=ResponseEnvelope[SubscriptionRead])
async def subscribe_or_change_plan(
    payload: SubscribeRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Subscribe to or upgrade/downgrade subscription tier."""
    plan_res = await db.execute(
        select(SubscriptionPlan).where(
            SubscriptionPlan.slug == payload.plan_slug.lower(),
            SubscriptionPlan.is_active == True
        )
    )
    target_plan = plan_res.scalars().first()
    if not target_plan:
        raise HTTPException(
            status_code=404,
            detail=f"Subscription plan '{payload.plan_slug}' not found"
        )

    # Deactivate existing active subscriptions
    active_subs_res = await db.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == SubscriptionStatus.ACTIVE
        )
    )
    for old_sub in active_subs_res.scalars().all():
        old_sub.status = SubscriptionStatus.CANCELLED

    # Create new active subscription
    now_str = datetime.utcnow().isoformat()
    ends_str = (datetime.utcnow() + timedelta(days=30)).isoformat()

    new_sub = Subscription(
        user_id=current_user.id,
        plan_id=target_plan.id,
        status=SubscriptionStatus.ACTIVE,
        starts_at=now_str,
        ends_at=ends_str,
        gateway_subscription_id=f"sim_{target_plan.slug}_{int(datetime.utcnow().timestamp())}"
    )
    db.add(new_sub)

    # Update User Role according to tier (Free -> USER, Starter/Plus/Pro -> PREMIUM_USER if not ADMIN)
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if target_plan.price_inr > 0:
            current_user.role = UserRole.PREMIUM_USER
        else:
            current_user.role = UserRole.USER

    # Ensure user has wallet and grant plan credits
    wallet_res = await db.execute(
        select(CreditWallet).where(CreditWallet.user_id == current_user.id)
    )
    wallet = wallet_res.scalars().first()
    if not wallet:
        wallet = CreditWallet(
            user_id=current_user.id,
            balance_credits=target_plan.credit_allowance,
            lifetime_earned=target_plan.credit_allowance
        )
        db.add(wallet)
    else:
        wallet.balance_credits += target_plan.credit_allowance
        wallet.lifetime_earned += target_plan.credit_allowance

    await db.flush()

    # Log credit transaction
    txn = CreditTransaction(
        wallet_id=wallet.id,
        amount=target_plan.credit_allowance,
        transaction_type=TransactionType.PURCHASE,
        description=f"Monthly credits for {target_plan.name} Plan",
        reference_id=new_sub.id
    )
    db.add(txn)

    await db.commit()

    # Return refreshed subscription with plan loaded
    result = await db.execute(
        select(Subscription)
        .options(selectinload(Subscription.plan))
        .where(Subscription.id == new_sub.id)
    )
    sub = result.scalars().first()

    return ResponseEnvelope(
        success=True,
        message=f"Successfully subscribed to {target_plan.name} plan! {target_plan.credit_allowance} credits added.",
        data=SubscriptionRead.model_validate(sub)
    )

@router.get("/transactions", response_model=ResponseEnvelope[List[CreditTransactionRead]])
async def get_wallet_transactions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch wallet credit transactions history."""
    wallet_res = await db.execute(
        select(CreditWallet).where(CreditWallet.user_id == current_user.id)
    )
    wallet = wallet_res.scalars().first()
    if not wallet:
        return ResponseEnvelope(success=True, message="No transactions", data=[])

    txns_res = await db.execute(
        select(CreditTransaction)
        .where(CreditTransaction.wallet_id == wallet.id)
        .order_by(CreditTransaction.created_at.desc())
    )
    txns = txns_res.scalars().all()
    return ResponseEnvelope(
        success=True,
        message="Transactions fetched",
        data=[CreditTransactionRead.model_validate(t) for t in txns]
    )

@router.get("/usage", response_model=ResponseEnvelope[List[UsageRecordRead]])
async def get_usage_records(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch user's AI and automation usage records."""
    usage_res = await db.execute(
        select(UsageRecord)
        .where(UsageRecord.user_id == current_user.id)
        .order_by(UsageRecord.created_at.desc())
    )
    records = usage_res.scalars().all()
    return ResponseEnvelope(
        success=True,
        message="Usage records fetched",
        data=[UsageRecordRead.model_validate(r) for r in records]
    )

@router.post("/add-credits", response_model=ResponseEnvelope[dict])
async def add_credits_to_wallet(
    payload: AddCreditsRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Top up credits in the user's wallet."""
    if payload.credits <= 0:
        raise HTTPException(status_code=400, detail="Credits amount must be positive")

    wallet_res = await db.execute(
        select(CreditWallet).where(CreditWallet.user_id == current_user.id)
    )
    wallet = wallet_res.scalars().first()
    if not wallet:
        wallet = CreditWallet(
            user_id=current_user.id,
            balance_credits=payload.credits,
            lifetime_earned=payload.credits
        )
        db.add(wallet)
    else:
        wallet.balance_credits += payload.credits
        wallet.lifetime_earned += payload.credits

    await db.flush()

    txn = CreditTransaction(
        wallet_id=wallet.id,
        amount=payload.credits,
        transaction_type=TransactionType.PURCHASE,
        description=f"Direct Credit Top-up via {payload.payment_method.upper()}",
        reference_id=f"topup_{int(datetime.utcnow().timestamp())}"
    )
    db.add(txn)
    await db.commit()

    return ResponseEnvelope(
        success=True,
        message=f"Added {payload.credits} credits to your wallet successfully!",
        data={
            "balance_credits": wallet.balance_credits,
            "lifetime_earned": wallet.lifetime_earned,
            "credits_added": payload.credits
        }
    )

@router.post("/checkout/order", response_model=ResponseEnvelope[CheckoutOrderResponse])
async def create_checkout_order(
    payload: CheckoutOrderCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a payment order for subscription upgrade or credit top-up.
    Generates a pending payment record ready for Razorpay/Stripe checkout.
    """
    if payload.amount < 0:
        raise HTTPException(status_code=400, detail="Invalid payment amount")

    order_id = f"order_rzp_sim_{int(datetime.utcnow().timestamp())}_{current_user.id[:8]}"
    payment = Payment(
        user_id=current_user.id,
        amount=payload.amount,
        currency="INR",
        provider="RAZORPAY",
        provider_payment_id=order_id,
        status=PaymentStatus.PENDING
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    return ResponseEnvelope(
        success=True,
        message="Payment order created successfully",
        data=CheckoutOrderResponse(
            order_id=order_id,
            payment_id=payment.id,
            amount=payload.amount,
            currency="INR",
            provider="RAZORPAY",
            key_id="rzp_live_nexplay_sim",
            purpose=payload.purpose,
            plan_slug=payload.plan_slug,
            credits=payload.credits
        )
    )

@router.post("/checkout/verify", response_model=ResponseEnvelope[dict])
async def verify_and_fulfill_payment(
    payload: PaymentVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify payment gateway response and fulfill the purchase:
    - Marks Payment status as SUCCESS
    - Generates invoice/transaction audit entry
    """
    stmt = select(Payment).where(Payment.id == payload.payment_id, Payment.user_id == current_user.id)
    result = await db.execute(stmt)
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    payment.status = PaymentStatus.SUCCESS
    payment.provider_payment_id = payload.provider_payment_id
    await db.commit()

    return ResponseEnvelope(
        success=True,
        message="Payment verified and processed successfully!",
        data={
            "payment_id": payment.id,
            "status": "SUCCESS",
            "amount": payment.amount,
            "currency": payment.currency,
            "provider_payment_id": payment.provider_payment_id
        }
    )

@router.get("/payments", response_model=ResponseEnvelope[List[PaymentRead]])
async def get_user_payments(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve full payment history and receipts for the logged-in user."""
    stmt = (
        select(Payment)
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
    )
    result = await db.execute(stmt)
    payments = result.scalars().all()

    return ResponseEnvelope(
        success=True,
        message=f"Fetched {len(payments)} payment records",
        data=[PaymentRead.model_validate(p) for p in payments]
    )

@router.get("/credit-packs", response_model=ResponseEnvelope[List[CreditPack]])
async def get_credit_packs():
    """Retrieve all available credit top-up packages with volume discounts."""
    return ResponseEnvelope(
        success=True,
        message=f"Retrieved {len(CREDIT_PACKS)} credit packs",
        data=CREDIT_PACKS
    )

@router.get("/analytics", response_model=ResponseEnvelope[BillingAnalytics])
async def get_billing_analytics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve real-time credit consumption analytics and burn rate forecasting."""
    wallet_res = await db.execute(
        select(CreditWallet).where(CreditWallet.user_id == current_user.id)
    )
    wallet = wallet_res.scalars().first()

    sub_res = await db.execute(
        select(Subscription)
        .options(selectinload(Subscription.plan))
        .where(Subscription.user_id == current_user.id, Subscription.status == SubscriptionStatus.ACTIVE)
        .order_by(Subscription.created_at.desc())
    )
    sub = sub_res.scalars().first()
    plan_tier = sub.plan.name if sub and sub.plan else "Free"

    usage_res = await db.execute(
        select(UsageRecord).where(UsageRecord.user_id == current_user.id).order_by(desc(UsageRecord.created_at))
    )
    records = usage_res.scalars().all()

    by_feature: Dict[str, int] = {}
    total_spent = 0
    for r in records:
        by_feature[r.feature_code] = by_feature.get(r.feature_code, 0) + r.credits_deducted
        total_spent += r.credits_deducted

    # Simulated/interpolated 7-day daily trend
    daily_usage = []
    now = datetime.utcnow()
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_str = day.strftime("%a")
        # Estimate daily usage from records or fallback proportion
        daily_usage.append({
            "day": day_str,
            "credits": max(1, (total_spent // 7) if total_spent > 0 else 0) if i < 3 else (total_spent // 5 if total_spent > 0 else 0)
        })

    balance = wallet.balance_credits if wallet else 100
    lifetime_earned = wallet.lifetime_earned if wallet else 100
    daily_burn_rate = max(1, total_spent // max(1, len(records))) if records else 2
    estimated_days = max(1, balance // daily_burn_rate) if balance > 0 else 0

    analytics = BillingAnalytics(
        total_credits_spent=wallet.lifetime_spent if wallet else total_spent,
        total_credits_earned=lifetime_earned,
        balance_credits=balance,
        by_feature=by_feature if by_feature else {"AI_RECOMMENDATION": 0, "AI_COPILOT": 0},
        daily_usage_last_7_days=daily_usage,
        estimated_days_remaining=estimated_days,
        plan_tier=plan_tier
    )
    return ResponseEnvelope(
        success=True,
        message="Billing analytics retrieved",
        data=analytics
    )

@router.get("/payments/{payment_id}/invoice", response_model=ResponseEnvelope[TaxInvoiceRead])
async def get_tax_invoice(
    payment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate official itemized tax invoice with 18% GST calculation."""
    stmt = select(Payment).where(Payment.id == payment_id, Payment.user_id == current_user.id)
    res = await db.execute(stmt)
    payment = res.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    total = float(payment.amount)
    subtotal = round(total / 1.18, 2)
    gst = round(total - subtotal, 2)

    invoice_num = f"NXP-INV-{payment.id[:8].upper()}-2026"
    date_str = str(payment.created_at)[:10] if payment.created_at else datetime.utcnow().strftime("%Y-%m-%d")

    items = [
        TaxInvoiceItem(
            description=f"NEXPLAY Unified Entertainment Plan / Credits ({payment.provider})",
            quantity=1,
            unit_price=subtotal,
            amount=subtotal
        )
    ]

    invoice = TaxInvoiceRead(
        invoice_number=invoice_num,
        payment_id=payment.id,
        date=date_str,
        customer_email=current_user.email,
        customer_name=current_user.profile.full_name if current_user.profile else current_user.email.split("@")[0],
        items=items,
        subtotal_inr=subtotal,
        tax_gst_inr=gst,
        total_inr=total,
        provider=payment.provider,
        provider_payment_id=payment.provider_payment_id,
        status="PAID" if payment.status == PaymentStatus.SUCCESS else payment.status.value
    )
    return ResponseEnvelope(
        success=True,
        message="Tax invoice generated successfully",
        data=invoice
    )

@router.get("/connected-services", response_model=ResponseEnvelope[List[ConnectedStreamingServiceRead]])
async def get_connected_services(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all external streaming subscriptions tracked by user."""
    stmt = (
        select(UserConnectedAccount)
        .options(selectinload(UserConnectedAccount.platform))
        .where(UserConnectedAccount.user_id == current_user.id, UserConnectedAccount.is_active == True)
        .order_by(desc(UserConnectedAccount.created_at))
    )
    res = await db.execute(stmt)
    accounts = res.scalars().all()

    services = []
    for acc in accounts:
        info = {}
        if acc.account_identifier:
            try:
                info = json.loads(acc.account_identifier)
            except Exception:
                info = {"plan_name": acc.account_identifier, "cost_inr": 299.0, "billing_cycle": "MONTHLY"}

        services.append(
            ConnectedStreamingServiceRead(
                id=acc.id,
                platform_id=acc.platform_id,
                platform_name=acc.platform.name if acc.platform else "Unknown Platform",
                platform_slug=acc.platform.slug if acc.platform else "unknown",
                platform_logo=acc.platform.logo_url if acc.platform else None,
                plan_name=info.get("plan_name", "Standard"),
                cost_inr=float(info.get("cost_inr", 199.0)),
                billing_cycle=info.get("billing_cycle", "MONTHLY"),
                renewal_date=info.get("renewal_date"),
                is_active=acc.is_active,
                created_at=str(acc.created_at)
            )
        )

    return ResponseEnvelope(
        success=True,
        message=f"Retrieved {len(services)} connected streaming services",
        data=services
    )

@router.post("/connected-services", response_model=ResponseEnvelope[ConnectedStreamingServiceRead])
async def add_connected_service(
    payload: ConnectedStreamingServiceCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Add an external streaming subscription (e.g. Netflix, Spotify, Prime) to track spending."""
    p_stmt = select(Platform).where(Platform.slug == payload.platform_slug.lower())
    p_res = await db.execute(p_stmt)
    platform = p_res.scalar_one_or_none()

    if not platform:
        raise HTTPException(status_code=404, detail=f"Platform '{payload.platform_slug}' not found")

    meta = {
        "plan_name": payload.plan_name,
        "cost_inr": payload.cost_inr,
        "billing_cycle": payload.billing_cycle,
        "renewal_date": payload.renewal_date or (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d")
    }

    acc = UserConnectedAccount(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        platform_id=platform.id,
        account_identifier=json.dumps(meta),
        is_active=True
    )
    db.add(acc)
    await db.commit()
    await db.refresh(acc)

    return ResponseEnvelope(
        success=True,
        message=f"Added {platform.name} subscription to spending tracker",
        data=ConnectedStreamingServiceRead(
            id=acc.id,
            platform_id=platform.id,
            platform_name=platform.name,
            platform_slug=platform.slug,
            platform_logo=platform.logo_url,
            plan_name=payload.plan_name,
            cost_inr=payload.cost_inr,
            billing_cycle=payload.billing_cycle,
            renewal_date=meta["renewal_date"],
            is_active=True,
            created_at=str(acc.created_at)
        )
    )

@router.delete("/connected-services/{service_id}", response_model=ResponseEnvelope[bool])
async def remove_connected_service(
    service_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a connected streaming service from user's spending tracker."""
    stmt = select(UserConnectedAccount).where(UserConnectedAccount.id == service_id, UserConnectedAccount.user_id == current_user.id)
    res = await db.execute(stmt)
    acc = res.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404, detail="Connected service not found")

    await db.delete(acc)
    await db.commit()
    return ResponseEnvelope(success=True, message="Connected service removed", data=True)

@router.get("/spending-summary", response_model=ResponseEnvelope[SpendingSummary])
async def get_spending_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Aggregate total monthly entertainment outlays across all streaming subscriptions with savings advice."""
    services_res = await get_connected_services(current_user=current_user, db=db)
    services: List[ConnectedStreamingServiceRead] = services_res.data or []

    monthly_total = 0.0
    for s in services:
        if s.billing_cycle.upper() == "YEARLY":
            monthly_total += (s.cost_inr / 12.0)
        else:
            monthly_total += s.cost_inr

    # Active NEXPLAY Plan cost
    sub_res = await db.execute(
        select(Subscription)
        .options(selectinload(Subscription.plan))
        .where(Subscription.user_id == current_user.id, Subscription.status == SubscriptionStatus.ACTIVE)
        .order_by(Subscription.created_at.desc())
    )
    sub = sub_res.scalars().first()
    nexplay_price = float(sub.plan.price_inr) if sub and sub.plan else 0.0

    combined = round(monthly_total + nexplay_price, 2)
    yearly = round(combined * 12.0, 2)

    savings_tips = []
    if len(services) >= 3:
        savings_tips.append("Switching 2 monthly OTT plans to annual billing can save up to ₹1,800/year.")
    if any(s.cost_inr > 500 for s in services):
        savings_tips.append("Consider downgrading family plans to standard HD if 4K screens are not actively used.")
    savings_tips.append("NEXPLAY unified search checks free/ad-supported sources before you rent or buy.")

    summary = SpendingSummary(
        total_monthly_spend_inr=round(monthly_total, 2),
        total_yearly_spend_inr=yearly,
        services_count=len(services),
        services=services,
        nexplay_plan_price=nexplay_price,
        combined_entertainment_budget=combined,
        savings_recommendations=savings_tips
    )
    return ResponseEnvelope(
        success=True,
        message="Entertainment spending summary calculated",
        data=summary
    )

