import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry configuration
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
      enabled: process.env.NODE_ENV === 'production',
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry configuration
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
      enabled: process.env.NODE_ENV === 'production',
    })
  }
}

export const onRequestError = Sentry.captureRequestError
