# DEVELOPMENT GUIDELINES

## ⚠️ CRITICAL: Preserve Existing Functionality

This document establishes guidelines to ensure future development **adds to** rather than **overwrites** existing functionality.

---

## Golden Rules

### 1. Never Delete Without Understanding

Before removing any code, file, or feature:

- [ ] Search the codebase for all usages of the code
- [ ] Check if any tests depend on it
- [ ] Verify no API routes consume it
- [ ] Document why removal is necessary

### 2. Extend, Don't Replace

When adding new features:

- [ ] Build on existing patterns and abstractions
- [ ] Add new fields to existing schemas (don't recreate tables)
- [ ] Extend existing API routes with new functionality
- [ ] Use feature flags for gradual rollouts

### 3. Check Before Changing Shared Code

The following files are **critical** and affect the entire application:

```
/apps/web/src/db/schema.ts          # Database schema - affects all queries
/apps/web/src/lib/auth-helpers.ts   # Auth context - called by every API route
/apps/web/src/middleware.ts         # Request middleware - affects all routes
/apps/web/src/app/(protected)/layout.tsx  # Protected layout wrapper
```

**Before modifying these files:**

1. Run the application locally and test all major features
2. Check for any TypeScript errors across the codebase
3. Verify API routes still work

---

## Schema Change Protocol

### Adding New Columns

1. Add column to `schema.ts` with a sensible default
2. Create a migration file in `/supabase/migrations/`
3. Apply migration to database
4. Update documentation in `/docs/03-DATABASE_SCHEMA.md`
5. Update `CHANGELOG.md`

**Example - Adding a new column:**

```typescript
// ✅ CORRECT - Add with default, doesn't break existing queries
cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),

// ❌ WRONG - Adding NOT NULL without default breaks existing rows
cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull(),
```

### Modifying Existing Columns

**Never directly modify a column type or constraints.** Instead:

1. Add a new column
2. Migrate data
3. Update code to use new column
4. Keep old column for backwards compatibility
5. Remove old column only after confirming no usage

### Adding New Tables

1. Define table in `schema.ts`
2. Add relations if needed
3. Create migration file
4. Update API routes
5. Document in schema docs

---

## API Route Guidelines

### Existing Routes - DO NOT BREAK

The following API routes are actively used by the application:

**Core Routes:**

- `/api/auth/*` - Authentication
- `/api/customers/*` - Customer CRUD
- `/api/jobs/*` - Job management
- `/api/invoices/*` - Invoice operations
- `/api/services/*` - Service catalog
- `/api/team/*` - Team management
- `/api/dashboard/*` - Dashboard data
- `/api/stripe/*` - Payment processing

**Settings Routes:**

- `/api/company/settings` - Company configuration
- `/api/user/profile` - User profile
- `/api/coupons/*` - Coupon management
- `/api/forms/*` - Custom forms
- `/api/customer-fields/*` - Custom fields

### Adding to Existing Routes

When extending an API route:

```typescript
// ✅ CORRECT - Add new query param, keep existing behavior
const status = searchParams.get('status')
const newFilter = searchParams.get('newFilter') // New optional param

// ❌ WRONG - Changing required params breaks existing clients
const status = searchParams.get('status')! // Was optional, now required
```

### New Routes

- Follow existing patterns in similar routes
- Use `getAuthContext()` for authentication
- Return consistent error formats
- Add to `/docs/04-API_ENDPOINTS.md`

---

## Component Guidelines

### Modifying Existing Components

1. Check all usages of the component
2. Use optional props for new features
3. Maintain backwards compatibility with existing props

```typescript
// ✅ CORRECT - Optional new prop with default
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg' // New prop with default
}

// ❌ WRONG - Required new prop breaks existing usages
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  size: 'sm' | 'md' | 'lg' // Required - breaks all existing <Button> usages
}
```

### Creating New Components

- Place in appropriate directory
- Export from index file if applicable
- Add to component documentation if significant
- Follow existing styling patterns (Tailwind, shadcn/ui)

---

## Feature Flags and Plan Gating

### Existing Plan Tiers

```typescript
type PlanTier = 'pro' | 'scale' | 'team'
```

### Feature Availability

| Feature            | Pro       | Scale     | Team      |
| ------------------ | --------- | --------- | --------- |
| AI Chat            | ✅ 30/day | ✅ 50/day | ✅ 50/day |
| Custom Automations | ❌        | ✅        | ✅        |
| Team Members       | 1         | 3         | Unlimited |
| Financial AI       | ❌        | ✅        | ✅        |

### Adding New Features

1. Determine plan availability
2. Add to feature gates in `/lib/feature-gates.ts`
3. Use `FeatureGate` component for UI
4. Check plan in API routes

---

## Testing Before Committing

### Quick Smoke Test

Run these checks before pushing changes:

```bash
# 1. Type checking
pnpm tsc --noEmit

# 2. Build check
pnpm build

# 3. Manual testing - verify these pages load:
- /dashboard
- /customers
- /jobs
- /invoices
- /settings
```

### After Database Changes

```bash
# 1. Apply migration
psql $DATABASE_URL -f supabase/migrations/XXXX_migration.sql

# 2. Verify schema sync
pnpm db:gen

# 3. Test affected API routes
```

---

## Documentation Requirements

### When Adding Features

Update these files:

- [ ] `/docs/05-IMPLEMENTATION_CHECKLIST.md` - Mark as complete
- [ ] `/docs/CHANGELOG.md` - Add entry
- [ ] `/docs/03-DATABASE_SCHEMA.md` - If schema changes
- [ ] `/docs/04-API_ENDPOINTS.md` - If new API routes

### When Fixing Bugs

Update:

- [ ] `/docs/CHANGELOG.md` - Document the fix
- [ ] Comments in code explaining the fix

---

## Code Review Checklist

Before approving changes:

### For Schema Changes

- [ ] Migration file exists
- [ ] Default values provided for new columns
- [ ] Documentation updated
- [ ] No breaking changes to existing queries

### For API Changes

- [ ] Backwards compatible
- [ ] Auth context used
- [ ] Error handling present
- [ ] Rate limiting considered

### For UI Changes

- [ ] Works in dark and light mode
- [ ] Responsive on mobile
- [ ] Loading states present
- [ ] Error states handled

---

## Emergency Rollback

If a deployment breaks production:

### 1. Identify the Breaking Change

```bash
# Check recent commits
git log --oneline -10

# Check deployment logs
# (Vercel/your hosting platform)
```

### 2. Rollback Options

```bash
# Option A: Revert specific commit
git revert <commit-hash>

# Option B: Deploy previous version
# (Through hosting platform)
```

### 3. Database Migrations

**Never delete data.** If a migration needs to be undone:

```sql
-- Add column back if removed
ALTER TABLE tablename ADD COLUMN columnname TYPE;

-- DO NOT drop tables or columns in production without backup
```

---

## Summary

| Action           | Rule                                        |
| ---------------- | ------------------------------------------- |
| Add new feature  | Extend existing code, don't replace         |
| Modify schema    | Add columns, never remove without migration |
| Change API       | Maintain backwards compatibility            |
| Update component | Use optional props                          |
| Fix bug          | Document in CHANGELOG                       |
| Remove code      | Search all usages first                     |

**When in doubt, ask before making breaking changes.**
