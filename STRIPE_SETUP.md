# Stripe Product Setup Guide

## Overview

This guide walks through setting up the three Maksy pricing tiers in Stripe:

- **Pro Plan:** $47/month
- **Scale Plan:** $97/month
- **Maksy Team:** $29/month + $8/seat

---

## Required Stripe Products

### 1. Pro Plan

**Product Setup:**

- Product Name: `Maksy Pro`
- Description: `Complete business management for service companies with up to 5 team members`
- Statement Descriptor: `MAKSY PRO`

**Price Setup:**

- Price: `$47.00 USD`
- Billing Period: `Monthly`
- Price ID Naming Convention: `price_pro_monthly_[env]`
- Metadata:
  ```
  plan=pro
  team_limit=5
  ai_limit=30
  ```

---

### 2. Scale Plan

**Product Setup:**

- Product Name: `Maksy Scale`
- Description: `Advanced features for growing service businesses with unlimited team members`
- Statement Descriptor: `MAKSY SCALE`

**Price Setup:**

- Price: `$97.00 USD`
- Billing Period: `Monthly`
- Price ID Naming Convention: `price_scale_monthly_[env]`
- Metadata:
  ```
  plan=scale
  team_limit=unlimited
  ai_limit=50
  ai_model=advanced
  ```

---

### 3. Maksy Team - Base Plan

**Product Setup:**

- Product Name: `Maksy Team - Base`
- Description: `Team management and CRM for non-service businesses (includes 1 seat)`
- Statement Descriptor: `MAKSY TEAM`

**Price Setup:**

- Price: `$29.00 USD`
- Billing Period: `Monthly`
- Price ID Naming Convention: `price_team_base_monthly_[env]`
- Metadata:
  ```
  plan=team
  includes_seats=1
  ```

---

### 4. Maksy Team - Additional Seat

**Product Setup:**

- Product Name: `Maksy Team - Additional Seat`
- Description: `Additional team member seat for Maksy Team plan`
- Statement Descriptor: `MAKSY SEAT`

**Price Setup:**

- Price: `$8.00 USD`
- Billing Period: `Monthly`
- **Billing Type:** `Recurring (Metered)`
- Billing Scheme: `Per unit`
- Usage Type: `Licensed`
- Price ID Naming Convention: `price_team_seat_monthly_[env]`
- Metadata:
  ```
  addon=seat
  plan=team
  ```

---

## Implementation Steps

### Step 1: Create Products in Stripe Dashboard

1. Navigate to **Products** in Stripe Dashboard
2. Click **+ Add Product** for each plan
3. Fill in product details as specified above
4. Create recurring price for each product
5. Copy the Price IDs

### Step 2: Update Environment Variables

Add the following to your `.env.local` file:

```bash
# Stripe Price IDs (Production)
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_1abc123...
NEXT_PUBLIC_STRIPE_PRICE_SCALE=price_1def456...
NEXT_PUBLIC_STRIPE_PRICE_TEAM_BASE=price_1ghi789...
NEXT_PUBLIC_STRIPE_PRICE_TEAM_SEAT=price_1jkl012...

# Stripe Price IDs (Test Mode)
NEXT_PUBLIC_STRIPE_PRICE_PRO_TEST=price_1test_pro...
NEXT_PUBLIC_STRIPE_PRICE_SCALE_TEST=price_1test_scale...
NEXT_PUBLIC_STRIPE_PRICE_TEAM_BASE_TEST=price_1test_team...
NEXT_PUBLIC_STRIPE_PRICE_TEAM_SEAT_TEST=price_1test_seat...
```

### Step 3: Update Signup Flow

The signup flow will need to use these price IDs when creating checkout sessions:

```typescript
// Example: apps/web/src/app/api/checkout/route.ts
const priceIds = {
  pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
  scale: process.env.NEXT_PUBLIC_STRIPE_PRICE_SCALE,
  team: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_BASE,
}

// For Team plan with additional seats:
const lineItems = [
  { price: priceIds.team, quantity: 1 }, // Base plan
  {
    price: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_SEAT,
    quantity: seatCount - 1,
  }, // Additional seats
]
```

### Step 4: Configure Webhook

Ensure your webhook endpoint is configured to receive events:

**Webhook URL:** `https://yourdomain.com/api/stripe/webhook`

**Events to listen for:**

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

---

## Testing Checklist

### Test Mode Setup

- [ ] Create all 4 products in Stripe Test Mode
- [ ] Copy test mode price IDs
- [ ] Add test price IDs to `.env.local`
- [ ] Test webhook locally with Stripe CLI

### Pro Plan Test

- [ ] Create account with Pro plan
- [ ] Verify $47 charge
- [ ] Verify plan_type = 'pro' in database
- [ ] Verify 14-day trial if applicable
- [ ] Test upgrade to Scale

### Scale Plan Test

- [ ] Create account with Scale plan
- [ ] Verify $97 charge
- [ ] Verify plan_type = 'scale' in database
- [ ] Verify access to Scale-only features

### Team Plan Test

- [ ] Create account with Team plan (1 seat)
- [ ] Verify $29 charge
- [ ] Verify plan_type = 'team' in database
- [ ] Verify seat_count = 1
- [ ] Add 2 more team members
- [ ] Verify charge updates to $29 + (2 × $8) = $45
- [ ] Verify seat_count = 3 in database
- [ ] Verify service business features are hidden

---

## Stripe CLI for Local Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.updated
```

---

## Price ID Detection Logic

The webhook handler determines plan type from price IDs:

```typescript
// apps/web/src/app/api/stripe/webhook/route.ts
let planType: 'pro' | 'scale' | 'team' = 'pro'
if (basePriceId?.includes('pro')) planType = 'pro'
if (basePriceId?.includes('scale')) planType = 'scale'
if (basePriceId?.includes('team')) planType = 'team'
```

**Important:** Ensure your Price IDs include the plan name for automatic detection!

---

## Troubleshooting

### Issue: Webhook not receiving events

**Solution:**

1. Check webhook URL is correct in Stripe Dashboard
2. Verify webhook secret is set in `.env.local`
3. Test with Stripe CLI: `stripe trigger checkout.session.completed`

### Issue: Seat count not updating

**Solution:**

1. Verify `stripe_seat_price_id` is set in subscription
2. Check subscription items include the seat addon
3. Review webhook logs for `customer.subscription.updated` events

### Issue: Plan type showing as wrong tier

**Solution:**

1. Verify Price IDs include plan identifier ('pro', 'scale', or 'team')
2. Check metadata on Stripe products
3. Review database `subscriptions.plan_type` value

---

## Migration from Old Pricing

If you had a "Starter" free tier before:

1. Run pre-migration script: `0000_pre_migration_cleanup.sql`
2. Verify all 'starter' subscriptions migrated to 'pro'
3. Apply main migration: `0000_wandering_hannibal_king.sql`
4. Notify affected users of automatic upgrade

---

## Support & Resources

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe API Docs:** https://stripe.com/docs/api
- **Webhook Testing:** https://dashboard.stripe.com/test/webhooks
- **Price API:** https://stripe.com/docs/api/prices

---

**Last Updated:** November 30, 2024
