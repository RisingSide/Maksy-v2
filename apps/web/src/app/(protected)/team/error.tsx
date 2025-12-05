'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function TeamError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Team page error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="glass-card p-8 text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          {error.message || 'Failed to load team page. Please try again.'}
        </p>
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </Card>
    </div>
  )
}
