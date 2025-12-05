'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface InventoryItem {
  id: string
  companyId: string
  name: string
  sku: string | null
  category: string | null
  unitCost: string | null
  quantityOnHand: string
  reorderPoint: string
  preferredVendor: string | null
  locationTag: string | null
  trackConsumption: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  archivedAt: string | null
}

export interface InventoryResponse {
  items: InventoryItem[]
  total: number
  hasMore: boolean
}

interface UseInventoryOptions {
  search?: string
  category?: string
  lowStock?: boolean
  includeArchived?: boolean
  limit?: number
  offset?: number
}

export function useInventory(options: UseInventoryOptions = {}) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInventory = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.search) params.set('search', options.search)
      if (options.category) params.set('category', options.category)
      if (options.lowStock) params.set('lowStock', 'true')
      if (options.includeArchived) params.set('includeArchived', 'true')
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.offset) params.set('offset', options.offset.toString())

      const response = await fetch(`/api/inventory?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }

      const data: InventoryResponse = await response.json()
      setItems(data.items)
      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [
    options.search,
    options.category,
    options.lowStock,
    options.includeArchived,
    options.limit,
    options.offset,
  ])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  // Calculate stats from items
  const stats = {
    totalItems: total,
    totalValue: items.reduce((sum, item) => {
      const qty = parseFloat(item.quantityOnHand || '0')
      const cost = parseFloat(item.unitCost || '0')
      return sum + qty * cost
    }, 0),
    lowStockCount: items.filter((item) => {
      const qty = parseFloat(item.quantityOnHand || '0')
      const reorder = parseFloat(item.reorderPoint || '0')
      return qty <= reorder && qty > 0
    }).length,
    criticalCount: items.filter((item) => {
      const qty = parseFloat(item.quantityOnHand || '0')
      const reorder = parseFloat(item.reorderPoint || '0')
      return qty <= reorder * 0.5 || qty === 0
    }).length,
  }

  return {
    items,
    total,
    hasMore,
    isLoading,
    error,
    stats,
    refetch: fetchInventory,
  }
}

export function useInventoryMutations() {
  const [isLoading, setIsLoading] = useState(false)

  const createItem = async (data: {
    name: string
    sku?: string
    category?: string
    unitCost?: number
    quantityOnHand?: number
    reorderPoint?: number
    preferredVendor?: string
    locationTag?: string
    trackConsumption?: boolean
    notes?: string
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create item')
      }

      const item = await response.json()
      toast.success('Item added to inventory')
      return item
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateItem = async (
    id: string,
    data: Partial<{
      name: string
      sku: string
      category: string
      unitCost: number
      quantityOnHand: number
      reorderPoint: number
      preferredVendor: string
      locationTag: string
      trackConsumption: boolean
      notes: string
    }>
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update item')
      }

      const item = await response.json()
      toast.success('Item updated successfully')
      return item
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const adjustQuantity = async (
    id: string,
    data: {
      changeAmount: number
      changeType: 'manual' | 'job_consumption' | 'transfer' | 'import'
      notes?: string
    }
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/inventory/${id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to adjust quantity')
      }

      const result = await response.json()
      toast.success('Quantity adjusted successfully')
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteItem = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete item')
      }

      toast.success('Item removed from inventory')
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
    createItem,
    updateItem,
    adjustQuantity,
    deleteItem,
    isLoading,
  }
}
