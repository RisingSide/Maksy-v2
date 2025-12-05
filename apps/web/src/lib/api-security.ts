import { NextRequest, NextResponse } from 'next/server'
import { rateLimitPresets, RateLimitError } from './rate-limit'
import { corsPresets, withCors } from './cors'
import { getAuthContext } from './auth-helpers'

export type ApiSecurityOptions = {
  rateLimit?: {
    type: 'auth' | 'api' | 'read' | 'expensive'
    requestsPerMinute: number
  }
  cors?: boolean | 'public'
  requireAuth?: boolean
}

/**
 * Wrap an API route with security middleware
 */
export function withApiSecurity(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options: ApiSecurityOptions = {}
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Apply rate limiting
      if (options.rateLimit) {
        const limiter = rateLimitPresets[options.rateLimit.type]
        try {
          await limiter.check(req, options.rateLimit.requestsPerMinute)
        } catch (error) {
          if (error instanceof RateLimitError) {
            return NextResponse.json(
              { error: error.message },
              {
                status: 429,
                headers: {
                  'Retry-After': '60',
                  'X-RateLimit-Limit': String(
                    options.rateLimit.requestsPerMinute
                  ),
                  'X-RateLimit-Remaining': '0',
                  'X-RateLimit-Reset': String(Date.now() + 60000),
                },
              }
            )
          }
          throw error
        }
      }

      // Check authentication if required
      if (options.requireAuth !== false) {
        try {
          const authContext = await getAuthContext()
          // Add auth context to request for handler to use
          ;(req as any).auth = authContext
        } catch (error) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }

      // Apply CORS if needed
      if (options.cors) {
        const corsConfig =
          options.cors === 'public'
            ? corsPresets.publicApi
            : corsPresets[
                process.env.NODE_ENV === 'production'
                  ? 'production'
                  : 'development'
              ]

        return withCors(() => handler(req, context), corsConfig)(req)
      }

      // Execute the handler
      return await handler(req, context)
    } catch (error) {
      console.error('API Security Error:', error)

      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Security presets for common API patterns
 */
export const apiSecurityPresets = {
  // Public read-only endpoints
  publicRead: {
    rateLimit: { type: 'read' as const, requestsPerMinute: 60 },
    cors: 'public' as const,
    requireAuth: false,
  },

  // Standard authenticated API
  authenticated: {
    rateLimit: { type: 'api' as const, requestsPerMinute: 30 },
    cors: true,
    requireAuth: true,
  },

  // Expensive operations (AI, file processing)
  expensive: {
    rateLimit: { type: 'expensive' as const, requestsPerMinute: 5 },
    cors: true,
    requireAuth: true,
  },

  // Auth endpoints (login, signup)
  auth: {
    rateLimit: { type: 'auth' as const, requestsPerMinute: 10 },
    cors: true,
    requireAuth: false,
  },

  // Webhook endpoints
  webhook: {
    rateLimit: { type: 'api' as const, requestsPerMinute: 100 },
    cors: false,
    requireAuth: false,
  },
}

/**
 * Extract and validate API key from request
 */
export function validateApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key')

  if (!apiKey) {
    return false
  }

  // In production, validate against stored API keys
  // For now, check against environment variable
  const validKey = process.env.API_SECRET_KEY

  return apiKey === validKey
}
