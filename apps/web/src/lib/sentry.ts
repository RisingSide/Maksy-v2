import * as Sentry from '@sentry/nextjs'

/**
 * Capture an exception and send it to Sentry
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('additional_context', context)
  }
  Sentry.captureException(error)
}

/**
 * Capture a message and send it to Sentry
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.captureMessage(message, level)
}

/**
 * Set user context for Sentry
 */
export function setUser(user: {
  id: string
  email?: string
  username?: string
}) {
  Sentry.setUser(user)
}

/**
 * Clear user context
 */
export function clearUser() {
  Sentry.setUser(null)
}

/**
 * Add breadcrumb for better error context
 */
export function addBreadcrumb(breadcrumb: {
  message: string
  level?: Sentry.SeverityLevel
  data?: Record<string, any>
}) {
  Sentry.addBreadcrumb(breadcrumb)
}

/**
 * Wrap an async function with Sentry error handling
 */
export function withSentry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: { name?: string }
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof Error) {
        captureException(error, {
          function: options?.name || fn.name,
          arguments: args,
        })
      }
      throw error
    }
  }) as T
}
