import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const hits = new Map<string, { count: number; ts: number }>()
const WINDOW_MS = 15_000
const LIMIT = 60

export function middleware(req: NextRequest) {
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'anon'
  const now = Date.now()
  const key = `${ip}:${(now / WINDOW_MS) | 0}`
  const rec = hits.get(key) ?? { count: 0, ts: now }
  rec.count++
  hits.set(key, rec)
  if (rec.count > LIMIT)
    return new NextResponse('Too many requests', { status: 429 })

  const res = NextResponse.next()
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  )
  return res
}
export const config = { matcher: ['/api/:path*'] }
