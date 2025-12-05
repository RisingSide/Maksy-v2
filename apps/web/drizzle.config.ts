import dotenv from 'dotenv'
import { existsSync } from 'node:fs'

const candidates = [
  '.env.local',
  '.env',
  'apps/web/.env.local',
  'apps/web/.env',
]
for (const path of candidates) {
  if (existsSync(path)) {
    dotenv.config({ path })
    break
  }
}

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('Set SUPABASE_DB_URL or DATABASE_URL for Drizzle config')
}

export default {
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './supabase/migrations',
  dbCredentials: { url: connectionString },
}
