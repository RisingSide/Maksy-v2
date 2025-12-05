'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface ProtectedErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  pageName?: string
}

/**
 * Reusable error component for protected routes
 * Handles auth errors gracefully and provides user-friendly recovery options
 */
export function ProtectedError({
  error,
  reset,
  pageName = 'this page',
}: ProtectedErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error(`${pageName} error:`, error)
  }, [error, pageName])

  // Check if this is an auth-related error
  const isAuthError =
    error.message?.toLowerCase().includes('unauthorized') ||
    error.message?.toLowerCase().includes('unauthenticated')

  if (isAuthError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="glass-card p-8 max-w-md text-center animate-scale-in">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h2 className="text-xl font-bold mb-2">Setting Up Your Account</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            We&apos;re preparing your account. This usually takes just a moment.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/onboarding')}>
              Complete Setup
            </Button>
            <Button variant="outline" onClick={() => reset()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Generic error UI for other errors
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="glass-card p-8 max-w-md text-center animate-scale-in">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          We encountered an issue loading {pageName}. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => reset()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              Error details (dev only)
            </summary>
            <pre className="mt-2 overflow-auto p-3 bg-muted rounded-lg text-[10px]">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </Card>
    </div>
  )
}
