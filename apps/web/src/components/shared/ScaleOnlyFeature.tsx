'use client'

import { ReactNode } from 'react'
import { Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

type PlanType = 'pro' | 'scale' | 'team'

interface ScaleOnlyFeatureProps {
  currentPlan: PlanType
  children: ReactNode
  featureName: string
  description?: string
}

export function ScaleOnlyFeature({
  currentPlan,
  children,
  featureName,
  description,
}: ScaleOnlyFeatureProps) {
  if (currentPlan === 'scale') {
    return <>{children}</>
  }

  return (
    <Card className="glass-card p-8 text-center border-dashed border-2 border-primary/20">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-lg font-semibold">{featureName}</h3>
            <Badge className="bg-gradient-to-r from-primary to-orange-500">
              <Sparkles className="h-3 w-3 mr-1" />
              Scale
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {description ||
              `Upgrade to Scale to unlock ${featureName} and other advanced AI-powered features.`}
          </p>
        </div>
        <Link href="/settings?tab=billing">
          <Button className="mt-2 gap-2">
            <Sparkles className="h-4 w-4" />
            Upgrade to Scale
          </Button>
        </Link>
      </div>
    </Card>
  )
}

interface FeatureGateProps {
  currentPlan: PlanType
  requiredPlan: PlanType | PlanType[]
  children: ReactNode
  fallback?: ReactNode
}

export function FeatureGate({
  currentPlan,
  requiredPlan,
  children,
  fallback,
}: FeatureGateProps) {
  const requiredPlans = Array.isArray(requiredPlan)
    ? requiredPlan
    : [requiredPlan]

  if (requiredPlans.includes(currentPlan)) {
    return <>{children}</>
  }

  return fallback ? <>{fallback}</> : null
}
