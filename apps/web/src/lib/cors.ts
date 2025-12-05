import { NextRequest, NextResponse } from 'next/server'

export type CorsOptions = {
  allowedOrigins?: string[]
  allowedMethods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

const defaultOptions: CorsOptions = {
  allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: [],
  credentials: true,
  maxAge: 86400, // 24 hours
}

/**
 * Apply CORS headers to a response
 */
export function cors(
  req: NextRequest,
  res: NextResponse,
  options: CorsOptions = {}
): NextResponse {
  const opts = { ...defaultOptions, ...options }
  const origin = req.headers.get('origin')

  // Check if origin is allowed
  if (origin && opts.allowedOrigins) {
    const isAllowed = opts.allowedOrigins.some((allowed) => {
      if (allowed === '*') return true
      if (allowed === origin) return true

      // Support wildcard subdomains
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*')
        const regex = new RegExp(`^${pattern}$`)
        return regex.test(origin)
      }

      return false
    })

    if (!isAllowed) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    res.headers.set('Access-Control-Allow-Origin', origin)
  }

  // Set other CORS headers
  if (opts.allowedMethods) {
    res.headers.set(
      'Access-Control-Allow-Methods',
      opts.allowedMethods.join(', ')
    )
  }

  if (opts.allowedHeaders) {
    res.headers.set(
      'Access-Control-Allow-Headers',
      opts.allowedHeaders.join(', ')
    )
  }

  if (opts.exposedHeaders && opts.exposedHeaders.length > 0) {
    res.headers.set(
      'Access-Control-Expose-Headers',
      opts.exposedHeaders.join(', ')
    )
  }

  if (opts.credentials) {
    res.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  if (opts.maxAge) {
    res.headers.set('Access-Control-Max-Age', String(opts.maxAge))
  }

  return res
}

/**
 * Handle preflight OPTIONS requests
 */
export function handlePreflight(
  req: NextRequest,
  options: CorsOptions = {}
): NextResponse | null {
  if (req.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 })
    return cors(req, res, options)
  }
  return null
}

/**
 * Create a CORS middleware wrapper for API routes
 */
export function withCors(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: CorsOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Handle preflight
    const preflightResponse = handlePreflight(req, options)
    if (preflightResponse) return preflightResponse

    // Execute the handler
    const res = await handler(req)

    // Apply CORS headers
    return cors(req, res, options)
  }
}

/**
 * Environment-specific CORS configurations
 */
export const corsPresets = {
  // Development - allow localhost
  development: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  },

  // Production - restrict to your domains
  production: {
    allowedOrigins: [
      process.env.NEXT_PUBLIC_APP_URL || 'https://maksy.com',
      'https://app.maksy.com',
      'https://www.maksy.com',
    ],
    credentials: true,
  },

  // Public API - more permissive
  publicApi: {
    allowedOrigins: ['*'],
    credentials: false,
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  },
}
