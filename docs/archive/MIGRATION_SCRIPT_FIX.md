# Migration Script Fix - Completed

## Issue Found ✅

The `migrate` script in `apps/web/package.json` referenced a non-existent file `scripts/apply-migrations.ts`, causing the migration command to fail.

## Solution Implemented ✅

### 1. Created Migration Script

Created `scripts/apply-migrations.ts` with:

- Database connection handling
- Drizzle migration runner integration
- Error handling and logging
- Migration history display
- Proper cleanup on exit

### 2. Updated Package.json Scripts

In `apps/web/package.json`:

```json
{
  "scripts": {
    "db:migrate": "tsx ../../scripts/apply-migrations.ts",
    "db:migrate:drop": "drizzle-kit drop",
    "db:studio": "drizzle-kit studio"
  }
}
```

In root `package.json`:

```json
{
  "scripts": {
    "db:migrate": "tsx scripts/apply-migrations.ts",
    "db:push": "cd apps/web && drizzle-kit push",
    "db:studio": "cd apps/web && drizzle-kit studio"
  }
}
```

### 3. Created Documentation

Added `docs/12-DATABASE_MIGRATION_GUIDE.md` with:

- Complete migration instructions
- Development vs Production workflows
- Troubleshooting guide
- Best practices

## How to Use

### Quick Development Setup

```bash
# From project root
cd apps/web
pnpm drizzle-kit push  # Direct schema push (no migration files)
```

### Production Migrations

```bash
# From project root
pnpm db:migrate  # Apply migration files

# OR from apps/web
cd apps/web
pnpm db:migrate
```

### Additional Tools

```bash
# View database in GUI
pnpm db:studio

# Generate new migration files
pnpm db:gen

# Drop migrations (careful!)
pnpm db:migrate:drop
```

## Files Changed

1. ✅ Created `scripts/apply-migrations.ts`
2. ✅ Updated `apps/web/package.json`
3. ✅ Updated root `package.json`
4. ✅ Created `docs/12-DATABASE_MIGRATION_GUIDE.md`

## Testing Commands

Verify the fix works:

```bash
# Check script exists
ls scripts/apply-migrations.ts

# Check command is available
cd apps/web && pnpm run | grep db:migrate

# Test migration (dry run)
DATABASE_URL=postgresql://fake pnpm db:migrate
# Should fail with connection error, not "file not found"
```

## Migration Workflow

### For New Developers

1. Clone repository
2. Install dependencies: `pnpm install`
3. Copy env file: `cp apps/web/.env.local.example apps/web/.env.local`
4. Set DATABASE_URL in `.env.local`
5. Run: `cd apps/web && pnpm drizzle-kit push`
6. Apply RLS policies manually (see guide)

### For Schema Changes

1. Edit `apps/web/src/db/schema.ts`
2. Generate migration: `pnpm db:gen`
3. Apply migration: `pnpm db:migrate`
4. Commit migration files to git

## Benefits

- ✅ Migration command now works
- ✅ Multiple migration strategies available
- ✅ Clear documentation
- ✅ Error handling
- ✅ Development and production workflows

The migration tooling is now fully functional and documented!
