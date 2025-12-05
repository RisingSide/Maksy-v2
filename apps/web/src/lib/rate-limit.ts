import { NextRequest } from 'next/server'

export type RateLimitConfig = {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval?: number // Max number of unique tokens per interval
}

export type RateLimiter = {
  check: (req: NextRequest, limit: number) => Promise<void>
}

// Simple in-memory cache using Map with automatic cleanup
class SimpleCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>()
  private maxSize: number

  constructor(maxSize: number = 500) {
    this.maxSize = maxSize
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  set(key: string, value: T, ttl: number): void {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    })
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instances
const cacheInstances = new Map<string, SimpleCache<number[]>>()

/**
 * Create a rate limiter instance
 * @param config - Rate limit configuration
 * @returns Rate limiter with check method
 */
export function rateLimit(config: RateLimitConfig): RateLimiter {
  const cacheKey = `${config.interval}-${config.uniqueTokenPerInterval || 500}`

  if (!cacheInstances.has(cacheKey)) {
    cacheInstances.set(
      cacheKey,
      new SimpleCache(config.uniqueTokenPerInterval || 500)
    )
  }

  const tokenCache = cacheInstances.get(cacheKey)!

  return {
    check: async (req: NextRequest, limit: number) => {
      // Get identifier from IP or auth token
      const token = getTokenFromRequest(req)

      const tokenCount = tokenCache.get(token) || [0]
      const currentUsage = tokenCount[0]

      if (currentUsage >= limit) {
        throw new RateLimitError(
          `Rate limit exceeded. Max ${limit} requests per ${config.interval / 1000} seconds.`
        )
      }

      tokenCount[0] = currentUsage + 1
      tokenCache.set(token, tokenCount, config.interval)
    },
  }
}

/**
 * Extract a unique token from the request for rate limiting
 */
function getTokenFromRequest(req: NextRequest): string {
  // Try to get user ID from auth header
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    return `auth:${authHeader}`
  }

  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'

  return `ip:${ip}`
}

/**
 * Custom error class for rate limit errors
 */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RateLimitError'
  }
}

/**
 * Rate limit presets for different API endpoints
 */
export const rateLimitPresets = {
  // Strict limit for auth endpoints
  auth: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100,
  }),

  // Standard API limit
  api: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
  }),

  // Relaxed limit for read-heavy endpoints
  read: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 1000,
  }),

  // Very strict limit for expensive operations
  expensive: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 50,
  }),
}
