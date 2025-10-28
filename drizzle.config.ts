// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'
import dotenv from 'dotenv'
import { existsSync } from 'node:fs'

const candidates = [
  '.env.local',
  '.env',
  'apps/web/.env.local',
  'apps/web/.env',
]
for (const p of candidates) {
  if (existsSync(p)) {
    dotenv.config({ path: p })
    break
  }
}

const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || ''
if (!url) {
  console.error('Drizzle: SUPABASE_DB_URL/DATABASE_URL not set')
}

export default defineConfig({
  schema: ['apps/web/src/db/schema.ts'],
  out: 'supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  strict: true,
  casing: 'snake_case',
})
