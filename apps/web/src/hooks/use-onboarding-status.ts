'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface OnboardingStatus {
  criticalCompleted: boolean
  completionPercentage: number
  tasksCompleted: Record<string, boolean>
  tourMode: 'pending' | 'active' | 'completed' | 'skipped'
}

interface UseOnboardingStatusOptions {
  redirectIfIncomplete?: boolean
}

/**
 * Hook to fetch and manage onboarding status
 *
 * @param options.redirectIfIncomplete - If true, redirects to /onboarding if critical onboarding is incomplete
 * @returns { status, loading, error, refetch }
 */
export function useOnboardingStatus(options: UseOnboardingStatusOptions = {}) {
  const { redirectIfIncomplete = false } = options
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/progress')

      if (!response.ok) {
        throw new Error('Failed to fetch onboarding status')
      }

      const data = await response.json()
      setStatus(data)

      // Redirect if critical onboarding is incomplete
      if (redirectIfIncomplete && !data.criticalCompleted) {
        router.push('/onboarding')
      }
    } catch (err) {
      console.error('Failed to fetch onboarding status:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [redirectIfIncomplete, router])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
    // Convenience getters
    isComplete: status?.criticalCompleted ?? false,
    percentage: status?.completionPercentage ?? 0,
    tourMode: status?.tourMode ?? 'pending',
  }
}

/**
 * Hook to complete an onboarding task
 *
 * @returns { completeTask, loading, error }
 */
export function useCompleteOnboardingTask() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completeTask = async (taskId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/complete-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId }),
      })

      if (!response.ok) {
        throw new Error('Failed to complete task')
      }

      return true
    } catch (err) {
      console.error('Failed to complete onboarding task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { completeTask, loading, error }
}

/**
 * Hook to set onboarding tour mode
 *
 * @returns { setTourMode, loading, error }
 */
export function useOnboardingTourMode() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setTourMode = async (
    mode: 'active' | 'skipped' | 'completed'
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/set-tour-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode }),
      })

      if (!response.ok) {
        throw new Error('Failed to set tour mode')
      }

      return true
    } catch (err) {
      console.error('Failed to set tour mode:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { setTourMode, loading, error }
}
