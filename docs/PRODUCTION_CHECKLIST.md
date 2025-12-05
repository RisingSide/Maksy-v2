# Production Deployment Checklist

This checklist ensures Maksy is properly configured for production deployment.

---

## Pre-Deployment

### 1. Environment Variables

- [ ] All required environment variables are set in Vercel dashboard
- [ ] Database URL points to production Supabase instance
- [ ] Stripe keys are production keys (not test keys)
- [ ] Clerk keys are production keys
- [ ] Email domain is verified in Resend
- [ ] Sentry DSN is configured

### 2. Database

- [ ] All migrations have been applied to production database
- [ ] RLS policies are enabled on all tables
- [ ] Database backups are configured (Supabase handles this)
- [ ] Connection pooling is enabled for serverless

### 3. Authentication (Clerk)

- [ ] Production instance created in Clerk dashboard
- [ ] Allowed origins configured (your domain)
- [ ] Webhook endpoint configured: `https://yourdomain.com/api/clerk/webhook`
- [ ] Sign-in/sign-up URLs configured
- [ ] Social providers configured (if using)

### 4. Payments (Stripe)

- [ ] Production API keys configured
- [ ] Webhook endpoint configured: `https://yourdomain.com/api/stripe/webhook`
- [ ] All webhook events enabled:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
- [ ] Products and prices created in Stripe dashboard
- [ ] Customer portal configured

### 5. Email (Resend)

- [ ] Domain verified in Resend
- [ ] SPF, DKIM, DMARC records configured
- [ ] Default sender email configured
- [ ] Email templates tested

### 6. Background Jobs (Inngest)

- [ ] Inngest app created
- [ ] Event key and signing key configured
- [ ] Functions deployed and visible in Inngest dashboard
- [ ] Cron jobs verified

### 7. Error Tracking (Sentry)

- [ ] Sentry project created
- [ ] DSN configured in environment
- [ ] Source maps uploaded (automatic with Vercel)
- [ ] Alerts configured for critical errors

---

## Deployment

### 8. Vercel Configuration

- [ ] Project connected to Git repository
- [ ] Build settings verified:
  - Framework: Next.js
  - Build command: `pnpm build`
  - Output directory: `.next`
- [ ] Environment variables added to Vercel
- [ ] Domain configured and SSL verified

### 9. DNS Configuration

- [ ] A/CNAME records pointing to Vercel
- [ ] SSL certificate provisioned (automatic)
- [ ] www redirect configured (if desired)

---

## Post-Deployment

### 10. Verification

- [ ] Homepage loads correctly
- [ ] Authentication flow works (sign up, sign in, sign out)
- [ ] Protected routes redirect to sign-in
- [ ] Dashboard loads with data
- [ ] API endpoints respond correctly
- [x] Health check endpoint exists: `GET /api/health` ✅

### 11. Integrations

- [ ] Stripe checkout creates subscription
- [ ] Stripe webhook receives events
- [ ] Emails are sent and received
- [ ] SMS notifications work (if configured)
- [ ] AI features respond correctly

### 12. Performance

- [ ] Lighthouse score > 90 for performance
- [ ] Core Web Vitals pass
- [ ] No console errors in production
- [ ] Images optimized and using next/image

### 13. Security

- [ ] HTTPS enforced
- [ ] Security headers present (check with securityheaders.com)
- [ ] No sensitive data exposed in client bundle
- [ ] API rate limiting configured
- [ ] CORS configured correctly

---

## Monitoring Setup

### 14. Observability

- [ ] Sentry error tracking active
- [ ] Vercel Analytics enabled
- [ ] Database monitoring in Supabase dashboard
- [ ] Stripe dashboard monitoring payments
- [ ] Inngest dashboard monitoring jobs

### 15. Alerts

- [ ] Error rate alerts configured in Sentry
- [ ] Downtime alerts configured (UptimeRobot, Pingdom, etc.)
- [ ] Payment failure alerts in Stripe
- [ ] Database usage alerts in Supabase

---

## Rollback Plan

### In case of issues:

1. Revert to previous deployment in Vercel dashboard
2. Check Sentry for error details
3. Review Vercel function logs
4. Check database for data integrity
5. Verify external service status (Stripe, Clerk, etc.)

---

## Environment Variable Reference

| Variable                             | Required    | Description                  |
| ------------------------------------ | ----------- | ---------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  | ✅          | Clerk public key             |
| `CLERK_SECRET_KEY`                   | ✅          | Clerk secret key             |
| `CLERK_WEBHOOK_SECRET`               | ✅          | Clerk webhook verification   |
| `DATABASE_URL`                       | ✅          | PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL`           | ✅          | Supabase project URL         |
| `SUPABASE_SERVICE_ROLE_KEY`          | ✅          | Supabase service role key    |
| `STRIPE_SECRET_KEY`                  | ✅          | Stripe secret key            |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅          | Stripe public key            |
| `STRIPE_WEBHOOK_SECRET`              | ✅          | Stripe webhook verification  |
| `RESEND_API_KEY`                     | ✅          | Resend API key               |
| `EMAIL_FROM`                         | ✅          | Default sender email         |
| `OPENAI_API_KEY`                     | ✅          | OpenAI API key               |
| `INNGEST_EVENT_KEY`                  | ✅          | Inngest event key            |
| `INNGEST_SIGNING_KEY`                | ✅          | Inngest signing key          |
| `NEXT_PUBLIC_SENTRY_DSN`             | Recommended | Sentry DSN                   |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`    | For GPS     | Google Maps API key          |
| `TWILIO_ACCOUNT_SID`                 | For SMS     | Twilio account SID           |
| `TWILIO_AUTH_TOKEN`                  | For SMS     | Twilio auth token            |
| `TWILIO_FROM_NUMBER`                 | For SMS     | Twilio phone number          |

---

## Support Contacts

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Clerk Support**: https://clerk.com/support
- **Stripe Support**: https://support.stripe.com
- **Resend Support**: https://resend.com/support

---

Last Updated: December 4, 2024
