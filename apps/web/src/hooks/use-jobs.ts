'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Customer } from './use-customers'
import { Service } from './use-services'

export interface TeamMember {
  id: string
  companyId: string
  userId: string | null
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: 'owner' | 'admin' | 'team_member'
  status: 'active' | 'pending' | 'inactive'
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  companyId: string
  customerId: string
  serviceId: string
  assignedTeamMemberId: string | null
  jobNumber: string
  scheduledDate: string
  scheduledTime: string
  durationMinutes: number
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  notes: string | null
  customerNotes: string | null
  isRecurring: boolean
  recurringFrequency: string | null
  recurringUntil: string | null
  totalPrice: string
  paymentStatus: 'unpaid' | 'paid' | 'partial'
  paymentMethod: string | null
  createdAt: string
  updatedAt: string
  customer?: Customer
  service?: Service
  teamMember?: TeamMember | null
}

export interface JobsResponse {
  jobs: Job[]
  total: number
  has_more: boolean
}

interface UseJobsOptions {
  status?: Job['status']
  teamMemberId?: string
  customerId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
  sort?: 'date' | 'recent' | 'customer'
}

export function useJobs(options: UseJobsOptions = {}) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.status) params.set('status', options.status)
      if (options.teamMemberId) params.set('teamMemberId', options.teamMemberId)
      if (options.customerId) params.set('customerId', options.customerId)
      if (options.startDate) params.set('startDate', options.startDate)
      if (options.endDate) params.set('endDate', options.endDate)
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.offset) params.set('offset', options.offset.toString())
      if (options.sort) params.set('sort', options.sort)

      const response = await fetch(`/api/jobs?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }

      const data: JobsResponse = await response.json()
      setJobs(data.jobs)
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
    options.teamMemberId,
    options.customerId,
    options.startDate,
    options.endDate,
    options.limit,
    options.offset,
    options.sort,
  ])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return {
    jobs,
    total,
    hasMore,
    isLoading,
    error,
    refetch: fetchJobs,
  }
}

export function useJobMutations() {
  const [isLoading, setIsLoading] = useState(false)

  const createJob = async (data: {
    customerId: string
    serviceId: string
    assignedTeamMemberId?: string | null
    scheduledDate: string
    scheduledTime: string
    durationMinutes: number
    status?: Job['status']
    notes?: string
    customerNotes?: string
    totalPrice: number
    paymentStatus?: 'unpaid' | 'paid' | 'partial'
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create job')
      }

      const job = await response.json()
      toast.success('Job created successfully')
      return job
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateJob = async (
    id: string,
    data: Partial<{
      customerId: string
      serviceId: string
      assignedTeamMemberId: string | null
      scheduledDate: string
      scheduledTime: string
      durationMinutes: number
      status: Job['status']
      notes: string
      customerNotes: string
      totalPrice: number
      paymentStatus: 'unpaid' | 'paid' | 'partial'
    }>
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update job')
      }

      const job = await response.json()
      toast.success('Job updated successfully')
      return job
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateJobStatus = async (id: string, status: Job['status']) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/jobs/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update job status')
      }

      const job = await response.json()
      toast.success(`Job marked as ${status.replace('_', ' ')}`)
      return job
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteJob = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete job')
      }

      toast.success('Job deleted successfully')
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
    createJob,
    updateJob,
    updateJobStatus,
    deleteJob,
    isLoading,
  }
}
