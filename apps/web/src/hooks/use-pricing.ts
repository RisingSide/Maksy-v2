'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

export interface PriceBreakdown {
  serviceBase: number
  materials: number
  labor: number
  locationAdjustment: number
  demandAdjustment: number
  customerDiscount: number
  difficultyMultiplier: number
  seasonalAdjustment: number
  urgencyPremium: number
  rulesAdjustment: number
}

export interface PriceSuggestion {
  basePrice: number
  breakdown: PriceBreakdown
  suggestedPrice: number
  confidence: 'low' | 'medium' | 'high'
  explanation: string
}

export interface PriceCalculationParams {
  serviceId: string
  customerId: string
  location: string
  materials?: Array<{
    inventoryItemId: string
    quantity: number
  }>
  estimatedHours: number
  urgency: 'normal' | 'rush'
  scheduledDate?: string
}

export function usePricing() {
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculatePrice = useCallback(async (params: PriceCalculationParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (response.status === 403) {
        throw new Error('Dynamic pricing is only available on the Scale plan')
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to calculate price')
      }

      const data = await response.json()
      setSuggestion(data.suggestion)
      return data.suggestion
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearSuggestion = useCallback(() => {
    setSuggestion(null)
    setError(null)
  }, [])

  return {
    suggestion,
    isLoading,
    error,
    calculatePrice,
    clearSuggestion,
  }
}

export interface PricingRule {
  id: string
  companyId: string
  name: string
  factor: string
  adjustmentType: 'percentage' | 'fixed'
  adjustment: number
  conditions: Array<{ field: string; operator: string; value: string }>
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

export function usePricingRules() {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRules = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/pricing/rules')

      if (response.status === 403) {
        setRules([])
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch pricing rules')
      }

      const data = await response.json()
      setRules(data.rules || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  return {
    rules,
    isLoading,
    error,
    refetch: fetchRules,
  }
}

export function usePricingMutations() {
  const createRule = async (data: Partial<PricingRule>) => {
    const response = await fetch('/api/pricing/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create pricing rule')
    }

    return response.json()
  }

  const updateRule = async (id: string, data: Partial<PricingRule>) => {
    const response = await fetch(`/api/pricing/rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update pricing rule')
    }

    return response.json()
  }

  const deleteRule = async (id: string) => {
    const response = await fetch(`/api/pricing/rules/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete pricing rule')
    }

    return true
  }

  return {
    createRule,
    updateRule,
    deleteRule,
  }
}
