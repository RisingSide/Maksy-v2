'use client'

import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <Card className={`glass-card p-12 text-center ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {description}
          </p>
        </div>
        {action && (
          <Button onClick={action.onClick} className="mt-2">
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  )
}
