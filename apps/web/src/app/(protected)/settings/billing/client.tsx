'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  CreditCard,
  Check,
  Sparkles,
  Users,
  Zap,
  Crown,
  Loader2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'

interface BillingSettingsClientProps {
  subscription: {
    id: string
    planType: 'pro' | 'scale' | 'team'
    status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused'
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    seatCount: number
  } | null
  companyName: string
  teamMemberCount: number
  isOwner: boolean
}

const PLANS = [
  {
    name: 'Pro',
    type: 'pro' as const,
    price: 49,
    description: 'Perfect for solo operators',
    features: [
      'Unlimited customers & jobs',
      'Invoices & estimates',
      'Calendar & scheduling',
      'Basic automations',
      'Email notifications',
      '1 user included',
    ],
    icon: Zap,
  },
  {
    name: 'Scale',
    type: 'scale' as const,
    price: 99,
    description: 'For growing businesses',
    features: [
      'Everything in Pro',
      'AI-powered pricing',
      'Advanced automations',
      'Custom forms',
      'Financial insights',
      'Up to 5 users',
    ],
    icon: Sparkles,
    popular: true,
  },
  {
    name: 'Team',
    type: 'team' as const,
    price: 199,
    description: 'For larger teams',
    features: [
      'Everything in Scale',
      'Unlimited users',
      'Time & GPS tracking',
      'Advanced reporting',
      'Priority support',
      'Custom integrations',
    ],
    icon: Crown,
  },
]

export function BillingSettingsClient({
  subscription,
  companyName,
  teamMemberCount,
  isOwner,
}: BillingSettingsClientProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const currentPlan = subscription?.planType || 'pro'
  const currentPlanDetails = PLANS.find((p) => p.type === currentPlan)

  const handleManageBilling = async () => {
    if (!subscription?.stripeCustomerId) {
      toast.error('No billing account found')
      return
    }

    setIsLoading('portal')

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to open billing portal')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to open billing portal'
      )
    } finally {
      setIsLoading(null)
    }
  }

  const handleUpgrade = async (planType: string) => {
    setIsLoading(planType)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      })

      if (!response.ok) {
        throw new Error('Failed to start checkout')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to start checkout'
      )
    } finally {
      setIsLoading(null)
    }
  }

  const getStatusBadge = () => {
    if (!subscription) return null

    const statusConfig = {
      trialing: { label: 'Trial', variant: 'secondary' as const },
      active: { label: 'Active', variant: 'default' as const },
      past_due: { label: 'Past Due', variant: 'destructive' as const },
      canceled: { label: 'Canceled', variant: 'outline' as const },
      paused: { label: 'Paused', variant: 'secondary' as const },
    }

    const config = statusConfig[subscription.status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // Calculate seat usage for Team plan
  const seatLimit =
    currentPlan === 'team' ? 999 : currentPlan === 'scale' ? 5 : 1
  const seatUsagePercent = Math.min((teamMemberCount / seatLimit) * 100, 100)

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plan & Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing
          </p>
        </div>
      </div>

      {/* Current Plan Overview */}
      <Card className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold">
                {currentPlanDetails?.name} Plan
              </h2>
              {getStatusBadge()}
            </div>
            <p className="text-muted-foreground mb-4">{companyName}</p>

            {subscription?.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {subscription.cancelAtPeriodEnd ? (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Cancels on{' '}
                    {format(
                      new Date(subscription.currentPeriodEnd),
                      'MMMM d, yyyy'
                    )}
                  </span>
                ) : (
                  <>
                    Next billing date:{' '}
                    {format(
                      new Date(subscription.currentPeriodEnd),
                      'MMMM d, yyyy'
                    )}
                  </>
                )}
              </p>
            )}
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold">
              ${currentPlanDetails?.price}
              <span className="text-lg font-normal text-muted-foreground">
                /mo
              </span>
            </div>
            {subscription?.stripeCustomerId && isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleManageBilling}
                disabled={isLoading === 'portal'}
              >
                {isLoading === 'portal' ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-1" />
                )}
                Manage Billing
              </Button>
            )}
          </div>
        </div>

        {/* Seat Usage */}
        {currentPlan !== 'pro' && (
          <>
            <Separator className="my-4" />
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Team Members</span>
                <span>
                  {teamMemberCount} /{' '}
                  {seatLimit === 999 ? 'Unlimited' : seatLimit}
                </span>
              </div>
              <Progress value={seatUsagePercent} className="h-2" />
            </div>
          </>
        )}
      </Card>

      {/* Plan Comparison */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const isCurrent = plan.type === currentPlan
            const isUpgrade =
              PLANS.findIndex((p) => p.type === plan.type) >
              PLANS.findIndex((p) => p.type === currentPlan)

            return (
              <Card
                key={plan.type}
                className={`glass-card p-6 relative ${
                  plan.popular ? 'border-primary' : ''
                } ${isCurrent ? 'bg-primary/5' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 right-4 bg-primary">
                    Most Popular
                  </Badge>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{plan.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button disabled className="w-full" variant="secondary">
                    Current Plan
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(plan.type)}
                    disabled={isLoading === plan.type || !isOwner}
                  >
                    {isLoading === plan.type ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Upgrade to {plan.name}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleManageBilling}
                    disabled={!isOwner}
                  >
                    Contact Support
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Billing History */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Billing History
        </h3>

        {subscription?.stripeCustomerId ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              View and download your invoices in the Stripe billing portal.
            </p>
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isLoading === 'portal'}
            >
              {isLoading === 'portal' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              View Billing History
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No billing history available yet.
            </p>
          </div>
        )}
      </Card>

      {!isOwner && (
        <p className="text-sm text-muted-foreground text-center">
          Only the company owner can manage billing settings
        </p>
      )}
    </div>
  )
}
