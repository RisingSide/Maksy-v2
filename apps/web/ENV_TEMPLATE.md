# Environment Variables Template

Copy these to your `.env.local` file and fill in the values.

## Required Variables

### Authentication (Clerk)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

### Database (Supabase)

```bash
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Payments (Stripe)

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (create in Stripe Dashboard)
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_SCALE_MONTHLY_PRICE_ID=price_...
STRIPE_SCALE_YEARLY_PRICE_ID=price_...
STRIPE_TEAM_MONTHLY_PRICE_ID=price_...
STRIPE_TEAM_YEARLY_PRICE_ID=price_...
STRIPE_TEAM_SEAT_PRICE_ID=price_...
```

### Email (Resend)

```bash
RESEND_API_KEY=re_...
EMAIL_FROM=notifications@yourdomain.com
```

### AI (OpenAI)

```bash
OPENAI_API_KEY=sk-...
```

### Background Jobs (Inngest)

```bash
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=signkey-...
```

## Optional Variables

### SMS (Twilio)

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
```

### Error Tracking (Sentry)

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...
```

### Maps (Google) - For GPS Features

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

### Application Settings

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Where to Get These

| Service     | Dashboard URL                                     |
| ----------- | ------------------------------------------------- |
| Clerk       | https://dashboard.clerk.com                       |
| Supabase    | https://supabase.com/dashboard                    |
| Stripe      | https://dashboard.stripe.com/apikeys              |
| Resend      | https://resend.com/api-keys                       |
| OpenAI      | https://platform.openai.com/api-keys              |
| Inngest     | https://app.inngest.com                           |
| Twilio      | https://console.twilio.com                        |
| Sentry      | https://sentry.io                                 |
| Google Maps | https://console.cloud.google.com/apis/credentials |
