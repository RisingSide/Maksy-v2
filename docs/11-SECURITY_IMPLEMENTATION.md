# Security Implementation Guide

## Overview

This document outlines the security measures implemented in Maksy v2 to protect against common vulnerabilities and ensure data integrity.

## 1. Rate Limiting

### Implementation

All API endpoints are protected with rate limiting using an LRU cache-based system.

```typescript
import { rateLimitPresets } from '@/lib/rate-limit'
import { withApiSecurity, apiSecurityPresets } from '@/lib/api-security'

// Example usage
export const GET = withApiSecurity(
  async (request) => {
    // Your API logic
  },
  apiSecurityPresets.authenticated // 30 req/min
)
```

### Rate Limits by Endpoint Type

| Endpoint Type | Requests/Minute | Use Case                       |
| ------------- | --------------- | ------------------------------ |
| Auth          | 10              | Login, signup, password reset  |
| Standard API  | 30              | CRUD operations                |
| Read Heavy    | 60              | Dashboard, listings            |
| Expensive     | 5               | AI operations, file processing |
| Webhooks      | 100             | External service callbacks     |

### Response Headers

- `X-RateLimit-Limit`: Maximum allowed requests
- `X-RateLimit-Remaining`: Requests left in window
- `X-RateLimit-Reset`: Unix timestamp of window reset
- `Retry-After`: Seconds to wait (on 429 errors)

## 2. Input Sanitization

### Functions Available

```typescript
import {
  sanitizeInput, // General text sanitization
  sanitizeEmail, // Email validation & normalization
  sanitizePhone, // Phone number cleaning
  sanitizeUrl, // URL validation
  sanitizeFileName, // File name security
  sanitizeHtml, // HTML/XSS prevention
  sanitizeJson, // Recursive JSON sanitization
} from '@/lib/sanitization'
```

### XSS Prevention

- All HTML content sanitized with DOMPurify
- Allowed tags: `b, i, em, strong, a, p, br, ul, ol, li`
- Allowed attributes: `href, target, rel`

### SQL Injection Prevention

- Parameterized queries via Drizzle ORM
- Column name validation for sorting
- No raw SQL execution

## 3. CORS Configuration

### Environment-Specific Settings

**Development:**

```typescript
allowedOrigins: [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
]
```

**Production:**

```typescript
allowedOrigins: [
  'https://maksy.com',
  'https://app.maksy.com',
  'https://www.maksy.com',
]
```

### Preflight Handling

OPTIONS requests automatically handled with appropriate headers.

## 4. Database Security

### Connection Pooling

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  min: 2, // Minimum connections
  idleTimeoutMillis: 30000, // 30 second idle timeout
  connectionTimeoutMillis: 2000, // 2 second connection timeout
  maxUses: 7500, // Replace connection after 7500 uses
})
```

### Row Level Security (RLS)

All tables protected with Supabase RLS policies:

- Users can only access their company's data
- Team members have role-based permissions
- Public data requires no authentication

## 5. Authentication & Authorization

### Clerk Integration

- Session-based authentication
- JWT tokens for API access
- Multi-factor authentication available
- OAuth providers (Google, Microsoft)

### Authorization Helpers

```typescript
import {
  getAuthContext, // Get user & company context
  hasPermission, // Check role permissions
  verifyCompanyAccess, // Verify company ownership
} from '@/lib/auth-helpers'
```

## 6. API Security Middleware

### Unified Security Wrapper

```typescript
export const POST = withApiSecurity(
  async (request) => {
    const context = request.auth // Pre-validated auth context
    // Your API logic
  },
  {
    rateLimit: { type: 'api', requestsPerMinute: 30 },
    cors: true,
    requireAuth: true,
  }
)
```

### Security Presets

| Preset          | Rate Limit | CORS   | Auth Required |
| --------------- | ---------- | ------ | ------------- |
| `publicRead`    | 60/min     | Public | No            |
| `authenticated` | 30/min     | Yes    | Yes           |
| `expensive`     | 5/min      | Yes    | Yes           |
| `auth`          | 10/min     | Yes    | No            |
| `webhook`       | 100/min    | No     | No            |

## 7. File Upload Security

### File Name Sanitization

- Path traversal attempts removed (`../`)
- Special characters replaced with underscores
- Hidden files prevented (no leading dots)

### File Type Validation

Storage buckets configured with allowed MIME types:

- Images: `image/*`
- PDFs: `application/pdf`
- Documents: Specific types per bucket

### Size Limits

- Company logos: 2MB
- Service icons: 1MB
- Job media: 10MB
- Documents: 25MB

## 8. Environment Variables

### Required Security Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# API Security
API_SECRET_KEY=... # For API key validation

# Services
STRIPE_WEBHOOK_SECRET=whsec_...
TWILIO_AUTH_TOKEN=...
```

### Production Checklist

- [ ] All secrets rotated from development
- [ ] Database SSL enabled
- [ ] CORS origins updated
- [ ] Rate limits tuned
- [ ] Error messages sanitized
- [ ] Sentry configured

## 9. Error Handling

### Production Error Masking

Internal errors are not exposed to clients:

```typescript
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

### Error Logging

- Sentry integration for error tracking
- Structured logging with context
- No sensitive data in logs

## 10. Security Headers

### Recommended Headers (via Next.js config)

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
]
```

## 11. Monitoring & Alerts

### Metrics to Track

- Rate limit violations (429 responses)
- Authentication failures (401 responses)
- Authorization failures (403 responses)
- Database connection pool exhaustion
- Unusual traffic patterns

### Alert Thresholds

- Rate limit violations > 100/hour
- Auth failures > 50/hour
- Database connections > 18 (90% of max)
- Error rate > 1%

## 12. Regular Security Tasks

### Daily

- Monitor rate limit violations
- Check error logs for patterns

### Weekly

- Review authentication failures
- Audit new dependencies

### Monthly

- Rotate API keys
- Review access logs
- Update dependencies

### Quarterly

- Security audit
- Penetration testing
- Dependency vulnerability scan

## Implementation Status

| Feature                 | Status      | Date        |
| ----------------------- | ----------- | ----------- |
| Rate Limiting           | ✅ Complete | Dec 2, 2024 |
| Input Sanitization      | ✅ Complete | Dec 2, 2024 |
| CORS Configuration      | ✅ Complete | Dec 2, 2024 |
| Database Pooling        | ✅ Complete | Dec 2, 2024 |
| API Security Middleware | ✅ Complete | Dec 2, 2024 |
| RLS Policies            | ✅ Complete | Nov 2024    |
| File Upload Security    | ✅ Complete | Nov 2024    |
| Error Handling          | ✅ Complete | Dec 2, 2024 |
| Security Headers        | ⬜ Pending  | -           |
| Monitoring Setup        | ⬜ Pending  | -           |
