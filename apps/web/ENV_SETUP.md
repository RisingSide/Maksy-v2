# Environment Variables Setup Guide

## Required Variables

### 1. Database Configuration

```bash
# Supabase PostgreSQL connection
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
```

### 2. Supabase Configuration

```bash
# From your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Service role key for admin operations
```

### 3. Clerk Authentication

```bash
# From Clerk Dashboard > API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_WEBHOOK_SECRET=whsec_... # From Clerk webhook endpoint
```

### 4. Stripe Payment Processing

```bash
# From Stripe Dashboard
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe webhook endpoint

# Price IDs from your Stripe products
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_SCALE_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_TEAM_SEAT_PRICE_ID=price_...
```

### 5. Application URL

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000 # or your production URL
```

## Optional Variables

### OpenAI (for AI features)

```bash
OPENAI_API_KEY=sk-...
```

### Twilio (for SMS)

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
TWILIO_MESSAGING_SERVICE_SID=MG...
```

### Resend (Email)

```bash
# From Resend Dashboard (https://resend.com/api-keys)
RESEND_API_KEY=re_...

# Optional: Custom sender email (requires verified domain)
EMAIL_FROM=Maksy <team@yourdomain.com>
```

### Sentry (error tracking)

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_SUPPRESS_INSTRUMENTATION_FILE_WARNING=1
SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING=1
```

## Setup Steps

1. Copy `.env.local.example` to `.env.local`
2. Fill in all required variables
3. Run `pnpm dev` to start the development server

## Production Deployment

For production deployment on Vercel/Railway/etc:

1. Add all environment variables in the platform's dashboard
2. Ensure `NODE_ENV=production`
3. Update `NEXT_PUBLIC_APP_URL` to your production URL
