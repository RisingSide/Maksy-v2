#!/usr/bin/env tsx
/**
 * Apply Drizzle migrations to the database
 *
 * This script applies all pending migrations from the supabase/migrations directory
 * to the database specified in the DATABASE_URL environment variable.
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../apps/web/.env.local') })

async function main() {
  console.log('🚀 Starting database migration...\n')

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set')
    console.error('Please ensure your .env.local file contains DATABASE_URL')
    process.exit(1)
  }

  // Create a connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1, // Use single connection for migrations
  })

  try {
    // Test connection
    await pool.query('SELECT NOW()')
    console.log('✅ Connected to database')

    // Create drizzle instance
    const db = drizzle(pool)

    // Run migrations
    console.log('📦 Applying migrations from apps/web/supabase/migrations...\n')

    await migrate(db, {
      migrationsFolder: path.join(__dirname, '../apps/web/supabase/migrations'),
    })

    console.log('✅ All migrations applied successfully!')

    // List applied migrations
    const result = await pool.query(`
      SELECT id, hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY created_at DESC
      LIMIT 5
    `)

    if (result.rows.length > 0) {
      console.log('\n📋 Recent migrations:')
      result.rows.forEach((row: any) => {
        console.log(
          `  - ${row.hash.substring(0, 8)}... (${new Date(row.created_at).toLocaleString()})`
        )
      })
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
    console.log('\n👋 Database connection closed')
  }
}

// Run the migration
main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
