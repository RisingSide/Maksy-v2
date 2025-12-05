'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Customer } from './use-customers'
import { Job } from './use-jobs'

export interface InvoiceLineItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  unitPrice: string
  total: string
}

export interface Invoice {
  id: string
  companyId: string
  customerId: string
  jobId: string | null
  invoiceNumber: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issueDate: string
  dueDate: string
  subtotal: string
  taxRate: string
  taxAmount: string
  discountAmount: string
  total: string
  amountPaid: string
  notes: string | null
  paymentTerms: string | null
  paidAt: string | null
  sentAt: string | null
  createdAt: string
  updatedAt: string
  customer?: Customer
  job?: Job | null
  lineItems?: InvoiceLineItem[]
}

export interface InvoicesResponse {
  invoices: Invoice[]
  total: number
  has_more: boolean
}

interface UseInvoicesOptions {
  status?: Invoice['status']
  customerId?: string
  jobId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
  sort?: 'date' | 'recent' | 'amount'
}

export function useInvoices(options: UseInvoicesOptions = {}) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.status) params.set('status', options.status)
      if (options.customerId) params.set('customerId', options.customerId)
      if (options.jobId) params.set('jobId', options.jobId)
      if (options.startDate) params.set('startDate', options.startDate)
      if (options.endDate) params.set('endDate', options.endDate)
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.offset) params.set('offset', options.offset.toString())
      if (options.sort) params.set('sort', options.sort)

      const response = await fetch(`/api/invoices?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }

      const data: InvoicesResponse = await response.json()
      setInvoices(data.invoices)
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
    options.jobId,
    options.startDate,
    options.endDate,
    options.limit,
    options.offset,
    options.sort,
  ])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  return {
    invoices,
    total,
    hasMore,
    isLoading,
    error,
    refetch: fetchInvoices,
  }
}

export function useInvoiceMutations() {
  const [isLoading, setIsLoading] = useState(false)

  const createInvoice = async (data: {
    customerId: string
    jobId?: string
    issueDate: string
    dueDate: string
    notes?: string
    paymentTerms?: string
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
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create invoice')
      }

      const invoice = await response.json()
      toast.success('Invoice created successfully')
      return invoice
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const sendInvoice = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/invoices/${id}/send`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send invoice')
      }

      toast.success('Invoice sent successfully')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const recordPayment = async (id: string, amount: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/invoices/${id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to record payment')
      }

      toast.success('Payment recorded successfully')
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
    createInvoice,
    sendInvoice,
    recordPayment,
    isLoading,
  }
}
