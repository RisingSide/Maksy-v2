'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface ServiceCategory {
  id: string
  companyId: string
  name: string
  slug: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Service {
  id: string
  companyId: string
  name: string
  slug: string
  description: string | null
  price: string
  durationMinutes: number
  categoryId: string | null
  iconUrl: string | null
  iconCropStyle: string | null
  color: string
  isPublic: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  category?: ServiceCategory | null
}

export interface ServicesResponse {
  services: Service[]
  total: number
  has_more: boolean
}

export interface CategoriesResponse {
  categories: ServiceCategory[]
  total: number
}

interface UseServicesOptions {
  search?: string
  categoryId?: string
  isPublic?: boolean | null
  limit?: number
  offset?: number
  sort?: 'name' | 'price' | 'order' | 'recent'
}

export function useServices(options: UseServicesOptions = {}) {
  const [services, setServices] = useState<Service[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.search) params.set('search', options.search)
      if (options.categoryId) params.set('categoryId', options.categoryId)
      if (options.isPublic !== null && options.isPublic !== undefined) {
        params.set('isPublic', options.isPublic.toString())
      }
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.offset) params.set('offset', options.offset.toString())
      if (options.sort) params.set('sort', options.sort)

      const response = await fetch(`/api/services?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch services')
      }

      const data: ServicesResponse = await response.json()
      setServices(data.services)
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
    options.search,
    options.categoryId,
    options.isPublic,
    options.limit,
    options.offset,
    options.sort,
  ])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  return {
    services,
    total,
    hasMore,
    isLoading,
    error,
    refetch: fetchServices,
  }
}

export function useServiceCategories() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/service-categories')

      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data: CategoriesResponse = await response.json()
      setCategories(data.categories)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  }
}

export function useServiceMutations() {
  const [isLoading, setIsLoading] = useState(false)

  const createService = async (data: {
    name: string
    slug: string
    description?: string
    price: number
    durationMinutes: number
    categoryId?: string | null
    iconUrl?: string | null
    color?: string
    isPublic?: boolean
    sortOrder?: number
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create service')
      }

      const service = await response.json()
      toast.success('Service created successfully')
      return service
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateService = async (
    id: string,
    data: Partial<{
      name: string
      slug: string
      description: string
      price: number
      durationMinutes: number
      categoryId: string | null
      iconUrl: string | null
      color: string
      isPublic: boolean
      sortOrder: number
    }>
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update service')
      }

      const service = await response.json()
      toast.success('Service updated successfully')
      return service
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteService = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete service')
      }

      toast.success('Service deleted successfully')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const createCategory = async (data: {
    name: string
    slug: string
    sortOrder?: number
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/service-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create category')
      }

      const category = await response.json()
      toast.success('Category created successfully')
      return category
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createService,
    updateService,
    deleteService,
    createCategory,
    isLoading,
  }
}
