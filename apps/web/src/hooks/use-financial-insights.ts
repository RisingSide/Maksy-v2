'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface FinancialInsight {
  id: string
  companyId: string
  insightType:
    | 'margin_alert'
    | 'pricing_suggestion'
    | 'forecast'
    | 'cost_analysis'
    | 'cash_flow'
  title: string
  content: string
  data: Record<string, any>
  priority: 'low' | 'medium' | 'high' | 'critical'
  isRead: boolean
  generatedAt: string
  expiresAt: string | null
}

export interface FinancialInsightsResponse {
  insights: FinancialInsight[]
  total: number
  limit: number
}

interface UseFinancialInsightsOptions {
  limit?: number
  unreadOnly?: boolean
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

export function useFinancialInsights(
  options: UseFinancialInsightsOptions = {}
) {
  const [insights, setInsights] = useState<FinancialInsight[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.unreadOnly) params.set('unread', 'true')
      if (options.priority) params.set('priority', options.priority)

      const response = await fetch(
        `/api/financial/insights?${params.toString()}`
      )

      if (response.status === 403) {
        // Feature not available on this plan
        setInsights([])
        setTotal(0)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch financial insights')
      }

      const data: FinancialInsightsResponse = await response.json()
      setInsights(data.insights)
      setTotal(data.total)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [options.limit, options.unreadOnly, options.priority])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const generateInsights = async () => {
    try {
      const response = await fetch('/api/financial/insights', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate insights')
      }

      const data = await response.json()
      toast.success(`Generated ${data.insights.length} new insights`)
      await fetchInsights()
      return data.insights
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    }
  }

  const markAsRead = async (insightId: string) => {
    // Optimistically update UI
    setInsights((prev) =>
      prev.map((i) => (i.id === insightId ? { ...i, isRead: true } : i))
    )
  }

  return {
    insights,
    total,
    isLoading,
    error,
    refetch: fetchInsights,
    generateInsights,
    markAsRead,
  }
}

export function useRevenueForecast() {
  const [forecast, setForecast] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchForecast = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/financial/forecast')

      if (response.status === 403) {
        setForecast(null)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch revenue forecast')
      }

      const data = await response.json()
      setForecast(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchForecast()
  }, [fetchForecast])

  return {
    forecast,
    isLoading,
    error,
    refetch: fetchForecast,
  }
}
