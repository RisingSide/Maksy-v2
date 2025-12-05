'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface Customer {
  id: string
  companyId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string
  notes: string | null
  tags: string[] | null
  lifetimeValue: string
  totalJobs: number
  lastJobDate: string | null
  createdAt: string
  updatedAt: string
}

export interface CustomersResponse {
  customers: Customer[]
  total: number
  has_more: boolean
}

interface UseCustomersOptions {
  search?: string
  limit?: number
  offset?: number
  sort?: 'name' | 'recent' | 'ltv'
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.search) params.set('search', options.search)
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.offset) params.set('offset', options.offset.toString())
      if (options.sort) params.set('sort', options.sort)

      const response = await fetch(`/api/customers?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      const data: CustomersResponse = await response.json()
      setCustomers(data.customers)
      setTotal(data.total)
      setHasMore(data.has_more)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [options.search, options.limit, options.offset, options.sort])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return {
    customers,
    total,
    hasMore,
    isLoading,
    error,
    refetch: fetchCustomers,
  }
}

export function useCustomer(id: string | null) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setCustomer(null)
      return
    }

    const fetchCustomer = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/customers/${id}`)

        if (!response.ok) {
          throw new Error('Failed to fetch customer')
        }

        const data = await response.json()
        setCustomer(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomer()
  }, [id])

  return { customer, isLoading, error }
}

export function useCustomerMutations() {
  const [isLoading, setIsLoading] = useState(false)

  const createCustomer = async (data: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
    companyName?: string
    address?: {
      street?: string
      city?: string
      state?: string
      zip?: string
      country?: string
    }
    notes?: string
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create customer')
      }

      const customer = await response.json()
      toast.success('Customer created successfully')
      return customer
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateCustomer = async (
    id: string,
    data: Partial<{
      firstName: string
      lastName: string
      email: string
      phone: string
      companyName: string
      address: {
        street?: string
        city?: string
        state?: string
        zip?: string
        country?: string
      }
      notes: string
    }>
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update customer')
      }

      const customer = await response.json()
      toast.success('Customer updated successfully')
      return customer
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCustomer = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete customer')
      }

      toast.success('Customer deleted successfully')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    isLoading,
  }
}
