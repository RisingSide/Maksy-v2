'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Customer } from './use-customers'

export interface EstimateLineItem {
  id: string
  estimateId: string
  description: string
  quantity: number
  unitPrice: string
  total: string
}

export interface Estimate {
  id: string
  companyId: string
  customerId: string
  estimateNumber: string
  status: 'draft' | 'sent' | 'approved' | 'declined' | 'expired'
  expirationDate: string | null
  subtotal: string
  taxRate: string
  taxAmount: string
  discountAmount: string
  total: string
  notes: string | null
  terms: string | null
  approvedAt: string | null
  sentAt: string | null
  createdAt: string
  updatedAt: string
  customer?: Customer
  lineItems?: EstimateLineItem[]
}

export interface EstimatesResponse {
  estimates: Estimate[]
  total: number
  has_more: boolean
}

interface UseEstimatesOptions {
  status?: Estimate['status']
  customerId?: string
  limit?: number
  offset?: number
  sort?: 'date' | 'recent' | 'amount'
}

export function useEstimates(options: UseEstimatesOptions = {}) {
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEstimates = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.status) params.set('status', options.status)
      if (options.customerId) params.set('customerId', options.customerId)
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.offset) params.set('offset', options.offset.toString())
      if (options.sort) params.set('sort', options.sort)

      const response = await fetch(`/api/estimates?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch estimates')
      }

      const data: EstimatesResponse = await response.json()
      setEstimates(data.estimates)
      setTotal(data.total)
      setHasMore(data.has_more)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [
    options.status,
    options.customerId,
    options.limit,
    options.offset,
    options.sort,
  ])

  useEffect(() => {
    fetchEstimates()
  }, [fetchEstimates])

  return {
    estimates,
    total,
    hasMore,
    isLoading,
    error,
    refetch: fetchEstimates,
  }
}

export function useEstimateMutations() {
  const [isLoading, setIsLoading] = useState(false)

  const createEstimate = async (data: {
    customerId: string
    expirationDate?: string
    notes?: string
    terms?: string
    taxRate?: number
    discountAmount?: number
    lineItems: Array<{
      description: string
      quantity: number
      unitPrice: number
      serviceId?: string
    }>
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create estimate')
      }

      const estimate = await response.json()
      toast.success('Estimate created successfully')
      return estimate
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const sendEstimate = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/estimates/${id}/send`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send estimate')
      }

      toast.success('Estimate sent successfully')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const approveEstimate = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/estimates/${id}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve estimate')
      }

      toast.success('Estimate approved')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const convertEstimate = async (
    id: string,
    options: { createJob?: boolean; createInvoice?: boolean }
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/estimates/${id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to convert estimate')
      }

      toast.success('Estimate converted successfully')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createEstimate,
    sendEstimate,
    approveEstimate,
    convertEstimate,
    isLoading,
  }
}
