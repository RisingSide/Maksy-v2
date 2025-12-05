'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <Card className="p-8 max-w-md text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Something went wrong!</h1>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. We have been notified and are
              working on it.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => reset()}>Try again</Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/')}
              >
                Go home
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left text-xs text-muted-foreground">
                <summary className="cursor-pointer">Error details</summary>
                <pre className="mt-2 overflow-auto p-2 bg-muted rounded">
                  {error.stack}
                </pre>
              </details>
            )}
          </Card>
        </div>
      </body>
    </html>
  )
}
