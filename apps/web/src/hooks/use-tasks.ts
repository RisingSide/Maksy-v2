'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Customer } from './use-customers'
import { Job, TeamMember } from './use-jobs'

export interface Task {
  id: string
  companyId: string
  createdByUserId: string
  title: string
  description: string | null
  dueDate: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'incomplete' | 'complete'
  assignedToTeamMemberId: string | null
  linkedCustomerId: string | null
  linkedJobId: string | null
  reminderEnabled: boolean
  reminderFrequency: 'once' | 'daily' | 'weekly' | null
  reminderType: 'email' | 'sms' | 'push' | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  assignedTo?: TeamMember | null
  customer?: Customer | null
  job?: Job | null
}

export interface TasksResponse {
  tasks: Task[]
  total: number
  has_more: boolean
}

interface UseTasksOptions {
  status?: 'incomplete' | 'complete'
  priority?: Task['priority']
  assignedToId?: string
  customerId?: string
  jobId?: string
  dueDate?: string
  overdue?: boolean
  limit?: number
  offset?: number
  sort?: 'dueDate' | 'priority' | 'recent'
}

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.status) params.set('status', options.status)
      if (options.priority) params.set('priority', options.priority)
      if (options.assignedToId) params.set('assignedToId', options.assignedToId)
      if (options.customerId) params.set('customerId', options.customerId)
      if (options.jobId) params.set('jobId', options.jobId)
      if (options.dueDate) params.set('dueDate', options.dueDate)
      if (options.overdue) params.set('overdue', 'true')
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.offset) params.set('offset', options.offset.toString())
      if (options.sort) params.set('sort', options.sort)

      const response = await fetch(`/api/tasks?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data: TasksResponse = await response.json()
      setTasks(data.tasks)
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
    options.priority,
    options.assignedToId,
    options.customerId,
    options.jobId,
    options.dueDate,
    options.overdue,
    options.limit,
    options.offset,
    options.sort,
  ])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    total,
    hasMore,
    isLoading,
    error,
    refetch: fetchTasks,
  }
}

export function useTaskMutations() {
  const [isLoading, setIsLoading] = useState(false)

  const createTask = async (data: {
    title: string
    description?: string
    dueDate?: string
    priority?: Task['priority']
    assignedToTeamMemberId?: string | null
    linkedCustomerId?: string | null
    linkedJobId?: string | null
    reminderEnabled?: boolean
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      const task = await response.json()
      toast.success('Task created successfully')
      return task
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateTask = async (
    id: string,
    data: Partial<{
      title: string
      description: string
      dueDate: string
      priority: Task['priority']
      assignedToTeamMemberId: string | null
      linkedCustomerId: string | null
      linkedJobId: string | null
      reminderEnabled: boolean
    }>
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      const task = await response.json()
      toast.success('Task updated successfully')
      return task
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTaskComplete = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${id}/complete`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      const task = await response.json()
      toast.success(
        task.status === 'complete'
          ? 'Task marked as complete'
          : 'Task marked as incomplete'
      )
      return task
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTask = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }

      toast.success('Task deleted successfully')
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
    createTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    isLoading,
  }
}
