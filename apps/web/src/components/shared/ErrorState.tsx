'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading the data. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <Card className={`glass-card p-12 text-center ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {message}
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="mt-2 gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    </Card>
  )
}
