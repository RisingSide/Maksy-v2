import 'dotenv/config'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: { connectionString: process.env.SUPABASE_DB_URL! },
}
