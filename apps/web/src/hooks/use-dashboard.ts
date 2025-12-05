'use client'

import { useState, useEffect, useCallback } from 'react'

export interface DashboardStats {
  period: {
    startDate: string
    endDate: string
  }
  customers: {
    total: number
  }
  jobs: {
    total: number
    completed: number
    scheduled: number
    inProgress: number
    completionRate: number
  }
  invoices: {
    total: number
    totalAmount: number
    paidAmount: number
    unpaidCount: number
    paidCount: number
    collectionRate: number
  }
  estimates: {
    total: number
    totalAmount: number
    pendingCount: number
    approvedCount: number
    declinedCount: number
    conversionRate: number
  }
  tasks: {
    total: number
    incomplete: number
    complete: number
    overdue: number
  }
}

export interface RevenueData {
  period: {
    startDate: string
    endDate: string
    months: number
  }
  summary: {
    totalRevenue: number
    totalInvoiced: number
    collectionRate: number
    monthOverMonthGrowth: number
  }
  chartData: {
    month: string
    revenue: number
    invoiced: number
    invoiceCount: number
  }[]
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/stats')

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  }
}

export function useRevenueData(months: number = 12) {
  const [data, setData] = useState<RevenueData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/dashboard/revenue?months=${months}`)

      if (!response.ok) {
        throw new Error('Failed to fetch revenue data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [months])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}

export function useDashboardActivity() {
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/activity')

      if (!response.ok) {
        throw new Error('Failed to fetch activity')
      }

      const data = await response.json()
      setActivities(data.activities || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return {
    activities,
    isLoading,
    error,
    refetch: fetchActivities,
  }
}

// Types for service distribution
export interface ServiceDistribution {
  name: string
  value: number
  jobCount: number
  revenue: number
  avgRevenue: number
  color: string
}

export interface ServiceDistributionData {
  distribution: ServiceDistribution[]
  summary: {
    totalJobs: number
    totalRevenue: number
    avgRevenuePerJob: number
    serviceCount: number
  }
}

export function useServiceDistribution() {
  const [data, setData] = useState<ServiceDistributionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/services')

      if (!response.ok) {
        throw new Error('Failed to fetch service distribution')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}

// Types for performance metrics
export interface PerformanceMetrics {
  avgDuration: {
    hours: number
    minutes: number
    formatted: string
  }
  completionRate: number
  revenuePerJob: number
  dailyRevenue: number
  dailyProfit: number
  collectionRate: number
  totalJobs: number
  completedJobs: number
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/metrics')

      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics')
      }

      const result = await response.json()
      setMetrics(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  }
}

// Types for upcoming appointments
export interface UpcomingAppointment {
  id: string
  customer: string
  customerInitials: string
  service: string
  date: string
  scheduledDate: string
  scheduledTime: string
  tech: string
  status: string
  totalPrice: string
}

export function useUpcomingAppointments() {
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/upcoming')

      if (!response.ok) {
        throw new Error('Failed to fetch upcoming appointments')
      }

      const result = await response.json()
      setAppointments(result.appointments || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  return {
    appointments,
    isLoading,
    error,
    refetch: fetchAppointments,
  }
}
