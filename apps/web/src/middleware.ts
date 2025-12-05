import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/calendar(.*)',
  '/customers(.*)',
  '/jobs(.*)',
  '/invoices(.*)',
  '/estimates(.*)',
  '/contracts(.*)',
  '/documents(.*)',
  '/inventory(.*)',
  '/reports(.*)',
  '/services(.*)',
  '/settings(.*)',
  '/tasks(.*)',
  '/time-gps(.*)',
  '/automations(.*)',
  '/team(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login',
  '/signup',
  '/pricing',
  '/accept-invite(.*)', // Team invitation acceptance page
  '/',
])

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect()

    // NOTE: Onboarding check is now done in the protected layout
    // Database queries cannot run in Edge Runtime middleware
    // The layout will check onboarding status via API and redirect if needed
  }

  // Allow authenticated users to access onboarding
  if (isOnboardingRoute(req)) {
    await auth.protect()
  }

  // Redirect authenticated users away from public auth pages
  if (
    userId &&
    isPublicRoute(req) &&
    req.nextUrl.pathname.match(/\/(sign-in|sign-up|login|signup)/)
  ) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
