import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// This file should only be imported in server-side code
// (API routes, server components, etc.)

// Singleton pattern for connection pool
let pool: Pool | undefined

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Connection pool configuration
      max: 20, // Maximum number of clients in the pool
      min: 2, // Minimum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
      maxUses: 7500, // Close and replace a connection after it has been used 7500 times
      // SSL configuration for Supabase pooler
      ssl: { rejectUnauthorized: false },
    })

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err)
    })

    // Log pool statistics in development
    if (process.env.NODE_ENV === 'development') {
      pool.on('connect', () => {
        console.log('Database pool: new client connected')
      })
      pool.on('remove', () => {
        console.log('Database pool: client removed')
      })
    }
  }
  return pool
}

export const db = drizzle(getPool(), { schema })

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing database pool...')
    if (pool) {
      await pool.end()
    }
  })
}
