# Database Migration Guide

## Overview

This guide covers how to apply database migrations for Maksy v2 using Drizzle ORM.

## Migration Commands

### Development (Recommended for initial setup)

```bash
# Navigate to the web app directory
cd apps/web

# Push schema directly to database (faster, good for dev)
pnpm drizzle-kit push
```

### Production (For version-controlled migrations)

```bash
# Generate migration SQL files from schema changes
pnpm db:gen

# Apply migrations to database
pnpm db:migrate
```

### Additional Commands

```bash
# Open Drizzle Studio (GUI for database)
pnpm db:studio

# Drop a migration (be careful!)
pnpm db:migrate:drop
```

## Setup Instructions

### 1. Prerequisites

- PostgreSQL database (Supabase or local)
- Node.js 18+ installed
- pnpm package manager

### 2. Environment Setup

Create `.env.local` in `apps/web/`:

```bash
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Apply Migrations

#### Option A: Quick Setup (Development)

```bash
cd apps/web
pnpm drizzle-kit push
```

This directly pushes the schema to the database without creating migration files.

#### Option B: Migration Files (Production)

```bash
cd apps/web
pnpm db:migrate
```

This applies versioned migration files from `supabase/migrations/`.

## Migration Files

### Drizzle Migrations

Located in `apps/web/supabase/migrations/`:

- `0000_*.sql` - Initial schema
- `0001_*.sql` - Contracts & Documents
- `0002_*.sql` - Additional changes

### Manual SQL Migrations

Located in `supabase/migrations/`:

- `00000_rls_helpers.sql` - RLS helper functions
- `00001_enable_rls_policies.sql` - Row Level Security
- `00002_add_service_color.sql` - Service color field
- `00003_create_storage_buckets.sql` - Storage setup

**Important:** Apply manual migrations separately after Drizzle migrations:

```bash
# Connect to your database and run each SQL file
psql $DATABASE_URL < supabase/migrations/00000_rls_helpers.sql
psql $DATABASE_URL < supabase/migrations/00001_enable_rls_policies.sql
psql $DATABASE_URL < supabase/migrations/00002_add_service_color.sql
psql $DATABASE_URL < supabase/migrations/00003_create_storage_buckets.sql
```

## Troubleshooting

### Error: "DATABASE_URL not set"

Ensure `.env.local` exists with valid DATABASE_URL.

### Error: "Permission denied"

Check database user has CREATE/ALTER permissions.

### Error: "Table already exists"

Database may already have tables. Options:

1. Use `drizzle-kit push` to sync schema
2. Drop tables and re-migrate (CAUTION: data loss)
3. Generate a new migration for changes only

### Error: "Migration failed"

Check `scripts/apply-migrations.ts` output for details.
Common issues:

- Network connectivity
- Invalid SQL in migration files
- Constraint violations

## Best Practices

### Development Workflow

1. Make schema changes in `src/db/schema.ts`
2. Test with `drizzle-kit push`
3. Generate migration when ready: `pnpm db:gen`
4. Commit migration files to git

### Production Deployment

1. Always backup database before migrations
2. Test migrations on staging first
3. Apply migrations during maintenance window
4. Have rollback plan ready

### Migration Naming

Drizzle auto-names migrations, but you can rename:

- Format: `XXXX_descriptive_name.sql`
- Keep sequential numbering
- Use clear, descriptive names

## Common Scenarios

### Fresh Install

```bash
cd apps/web
pnpm install
cp .env.local.example .env.local
# Edit .env.local with your DATABASE_URL
pnpm drizzle-kit push
# Apply RLS policies manually
```

### Update Existing Database

```bash
cd apps/web
pnpm db:gen        # Generate new migration
pnpm db:migrate    # Apply it
```

### Reset Database (Development Only!)

```bash
# DANGER: This drops all data!
cd apps/web
pnpm drizzle-kit drop
pnpm drizzle-kit push
```

## Migration Script Details

The `scripts/apply-migrations.ts` script:

1. Connects to DATABASE_URL
2. Applies all pending migrations
3. Records migration history
4. Shows applied migrations
5. Handles errors gracefully

## Next Steps

After migrations are applied:

1. Verify tables exist: `pnpm db:studio`
2. Apply RLS policies (if using Supabase)
3. Create storage buckets (if using Supabase Storage)
4. Seed initial data (if needed)
5. Test application functionality

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review migration file SQL
3. Check Drizzle documentation
4. Verify database connectivity
