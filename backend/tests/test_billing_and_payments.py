import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_billing_subscriptions_and_payments(async_client: AsyncClient):
    # 1. Fetch public subscription plans
    plans_res = await async_client.get("/api/v1/billing/plans")
    assert plans_res.status_code == 200
    plans = plans_res.json()["data"]
    assert len(plans) == 4
    plan_slugs = [p["slug"] for p in plans]
    assert "free" in plan_slugs
    assert "starter" in plan_slugs
    assert "plus" in plan_slugs
    assert "pro" in plan_slugs

    # 2. Register a new user for billing tests
    user_payload = {
        "email": "billing_user@nexplay.com",
        "password": "BillingPassword123!",
        "full_name": "Priya Nair"
    }
    reg_res = await async_client.post("/api/v1/auth/register", json=user_payload)
    assert reg_res.status_code == 201
    token = reg_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Initial wallet: 100 free onboarding credits
    assert reg_res.json()["data"]["user"]["wallet"]["balance_credits"] == 100

    # 3. Get initial subscription (auto-creates default FREE plan)
    sub_res = await async_client.get("/api/v1/billing/subscription", headers=headers)
    assert sub_res.status_code == 200
    sub_data = sub_res.json()["data"]
    assert sub_data["status"] == "ACTIVE"
    assert sub_data["plan"]["slug"] == "free"

    # 4. Upgrade subscription to PLUS (₹149/mo, 750 credits)
    upgrade_res = await async_client.post(
        "/api/v1/billing/subscribe",
        json={"plan_slug": "plus"},
        headers=headers
    )
    assert upgrade_res.status_code == 200
    upgraded_sub = upgrade_res.json()["data"]
    assert upgraded_sub["status"] == "ACTIVE"
    assert upgraded_sub["plan"]["slug"] == "plus"

    # 5. Check user profile/me role is now PREMIUM_USER and wallet has 100 + 750 = 850 credits
    me_res = await async_client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()["data"]
    assert me_data["role"] == "PREMIUM_USER"
    assert me_data["wallet"]["balance_credits"] == 850

    # 6. Fetch wallet credit transactions
    tx_res = await async_client.get("/api/v1/billing/transactions", headers=headers)
    assert tx_res.status_code == 200
    txns = tx_res.json()["data"]
    assert len(txns) >= 2 # 100 onboarding bonus + 750 Plus plan purchase
    assert any("Plus Plan" in t["description"] for t in txns)

    # 7. Direct Credit Pack Top-Up (+200 credits)
    topup_res = await async_client.post(
        "/api/v1/billing/add-credits",
        json={"credits": 200, "payment_method": "upi"},
        headers=headers
    )
    assert topup_res.status_code == 200
    topup_data = topup_res.json()["data"]
    assert topup_data["balance_credits"] == 1050

    # 8. Create a Payment Gateway Order (simulated Razorpay / Stripe)
    order_res = await async_client.post(
        "/api/v1/billing/checkout/order",
        json={
            "amount": 149.0,
            "purpose": "SUBSCRIPTION",
            "plan_slug": "plus"
        },
        headers=headers
    )
    assert order_res.status_code == 200
    order_data = order_res.json()["data"]
    assert "order_id" in order_data
    assert order_data["amount"] == 149.0
    payment_id = order_data["payment_id"]

    # 9. Verify and fulfill payment gateway response
    verify_res = await async_client.post(
        "/api/v1/billing/checkout/verify",
        json={
            "payment_id": payment_id,
            "provider_payment_id": "pay_rzp_sim_test_12345",
            "provider_signature": "sig_valid_sim_98765"
        },
        headers=headers
    )
    assert verify_res.status_code == 200
    verify_data = verify_res.json()["data"]
    assert verify_data["status"] == "SUCCESS"
    assert verify_data["provider_payment_id"] == "pay_rzp_sim_test_12345"

    # 10. Fetch user payment receipts
    payments_res = await async_client.get("/api/v1/billing/payments", headers=headers)
    assert payments_res.status_code == 200
    payments_list = payments_res.json()["data"]
    assert len(payments_list) >= 1
    recent_payment = payments_list[0]
    assert recent_payment["id"] == payment_id
    assert recent_payment["status"] == "SUCCESS"
    assert recent_payment["amount"] == 149.0

    # 11. Security Check: Unauthenticated request rejected with 401
    unauth_sub = await async_client.get("/api/v1/billing/subscription")
    assert unauth_sub.status_code == 401
    unauth_order = await async_client.post("/api/v1/billing/checkout/order", json={"amount": 49.0})
    assert unauth_order.status_code == 401
