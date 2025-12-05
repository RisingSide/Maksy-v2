'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

export interface TeamMember {
  id: string
  companyId: string
  userId: string | null
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: 'owner' | 'admin' | 'team_member'
  status: 'active' | 'invited' | 'inactive'
  avatarUrl: string | null
  hourlyRate: string | null
  invitationSentAt: string | null
  invitationAcceptedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TeamResponse {
  teamMembers: TeamMember[]
  total: number
  has_more: boolean
}

interface UseTeamOptions {
  role?: TeamMember['role']
  status?: TeamMember['status']
  search?: string
  limit?: number
  offset?: number
}

export function useTeam(options: UseTeamOptions = {}) {
  const { isLoaded } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeamMembers = useCallback(
    async (force = false) => {
      // Wait for Clerk to be loaded before making any decisions
      if (!isLoaded && !force) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (options.role) params.set('role', options.role)
        if (options.status) params.set('status', options.status)
        if (options.search) params.set('search', options.search)
        if (options.limit) params.set('limit', options.limit.toString())
        if (options.offset) params.set('offset', options.offset.toString())

        const response = await fetch(`/api/team?${params.toString()}`)

        if (!response.ok) {
          if (response.status === 401) {
            // User not authenticated or no company - this is expected for new users
            setTeamMembers([])
            setTotal(0)
            return
          }
          throw new Error('Failed to fetch team members')
        }

        const data: TeamResponse = await response.json()
        setTeamMembers(data.teamMembers || [])
        setTotal(data.total)
        setHasMore(data.has_more)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred'
        setError(message)
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    },
    [
      isLoaded,
      options.role,
      options.status,
      options.search,
      options.limit,
      options.offset,
    ]
  )

  useEffect(() => {
    if (isLoaded) {
      fetchTeamMembers()
    }
  }, [isLoaded, fetchTeamMembers])

  const refetch = useCallback(() => {
    return fetchTeamMembers(true)
  }, [fetchTeamMembers])

  return {
    teamMembers,
    total,
    hasMore,
    isLoading,
    error,
    refetch,
  }
}

export function useTeamMutations() {
  const [isLoading, setIsLoading] = useState(false)

  const inviteTeamMember = async (data: {
    firstName: string
    lastName: string
    email: string
    role: TeamMember['role']
    hourlyRate?: number
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to invite team member')
      }

      toast.success('Invitation sent successfully')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateTeamMember = async (
    id: string,
    data: Partial<
      Pick<TeamMember, 'firstName' | 'lastName' | 'role' | 'hourlyRate'>
    >
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/team/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update team member')
      }

      toast.success('Team member updated')
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeTeamMember = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/team/${id}`, {
        method: 'DELETE',
      })

      // 404 is acceptable - member is already deleted
      if (!response.ok && response.status !== 404) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove team member')
      }

      toast.success('Team member removed')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const resendInvite = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/team/${id}/resend-invite`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resend invitation')
      }

      toast.success('Invitation resent')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const addTeamMemberDirectly = async (data: {
    firstName: string
    lastName?: string
    email: string
    password: string
    phone?: string
    role: 'admin' | 'team_member'
    hourlyRate?: number
    commissionRate?: number
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/team/create-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add team member')
      }

      toast.success('Team member added successfully')
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
    inviteTeamMember,
    updateTeamMember,
    removeTeamMember,
    resendInvite,
    addTeamMemberDirectly,
    isLoading,
  }
}
