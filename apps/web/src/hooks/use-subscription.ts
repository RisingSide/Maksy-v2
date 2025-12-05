'use client'

/**
 * useSubscription Hook
 *
 * Fetches and tracks the current user's subscription data
 * Used for plan-based feature gating in UI components
 *
 * Now uses Clerk for authentication and fetches from /api/subscription
 */

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { type PlanType } from '@/lib/feature-gates'

export interface Subscription {
  id: string
  planType: PlanType
  seatCount: number
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused'
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

export interface UseSubscriptionReturn {
  subscription: Subscription | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, isLoaded } = useUser()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSubscription = useCallback(async () => {
    if (!isLoaded) {
      return
    }

    if (!user) {
      setSubscription(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch subscription from API endpoint
      const response = await fetch('/api/subscription')

      if (!response.ok) {
        // Handle errors gracefully without throwing
        // This can happen for new users before records are created
        if (response.status === 401) {
          console.warn(
            'Subscription fetch returned 401 - user may not have records yet'
          )
        } else {
          console.warn('Failed to fetch subscription:', response.status)
        }
        setSubscription(null)
        return
      }

      const data = await response.json()
      setSubscription(data.subscription)
    } catch (err) {
      // Network errors or other unexpected issues
      console.error('Error fetching subscription:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setSubscription(null)
    } finally {
      setIsLoading(false)
    }
  }, [user, isLoaded])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  return {
    subscription,
    isLoading,
    error,
    refetch: fetchSubscription,
  }
}

/**
 * Helper hook to get just the plan type
 */
export function usePlanType(): PlanType | null {
  const { subscription } = useSubscription()
  return subscription?.planType || null
}

/**
 * Helper hook to check if user has a specific plan
 */
export function useHasPlan(requiredPlan: PlanType): boolean {
  const { subscription } = useSubscription()
  return subscription?.planType === requiredPlan
}

/**
 * Helper hook to check if user is on trial
 */
export function useIsOnTrial(): boolean {
  const { subscription } = useSubscription()

  if (!subscription?.trialEndsAt) return false

  const trialEnd = new Date(subscription.trialEndsAt)
  return trialEnd > new Date() && subscription.status === 'trialing'
}
