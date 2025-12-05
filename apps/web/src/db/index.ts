// Re-export schema for client-side type usage
export * from './schema'

// Database client should only be imported server-side
// Use: import { db } from '@/db/index.server'
export const DB_NOTE =
  'Import db from @/db/index.server for server-side code only'
