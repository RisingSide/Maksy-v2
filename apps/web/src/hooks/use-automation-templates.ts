'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface AutomationTemplate {
  id: string
  name: string
  description: string
  category: 'follow_up' | 'onboarding' | 'workflow' | 'reactivation' | 'upsell'
  icon: string
  usage_count: number
}

export interface AutomationTemplatesResponse {
  templates: AutomationTemplate[]
  total: number
}

interface UseAutomationTemplatesOptions {
  category?: AutomationTemplate['category']
}

export function useAutomationTemplates(
  options: UseAutomationTemplatesOptions = {}
) {
  const [templates, setTemplates] = useState<AutomationTemplate[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.category) params.set('category', options.category)

      const response = await fetch(
        `/api/automation-templates?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch automation templates')
      }

      const data: AutomationTemplatesResponse = await response.json()
      setTemplates(data.templates)
      setTotal(data.total)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [options.category])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const activateTemplate = async (
    templateId: string,
    customizations?: Record<string, any>
  ) => {
    try {
      const response = await fetch(
        `/api/automation-templates/${templateId}/use`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customizations }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to activate template')
      }

      const data = await response.json()
      toast.success('Automation activated successfully')
      return data.automation
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    }
  }

  return {
    templates,
    total,
    isLoading,
    error,
    refetch: fetchTemplates,
    activateTemplate,
  }
}

// Category display helpers
export const categoryLabels: Record<AutomationTemplate['category'], string> = {
  follow_up: 'Follow-up',
  onboarding: 'Onboarding',
  workflow: 'Workflow',
  reactivation: 'Reactivation',
  upsell: 'Upsell',
}

export const categoryColors: Record<AutomationTemplate['category'], string> = {
  follow_up: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  onboarding: 'bg-green-500/10 text-green-600 dark:text-green-400',
  workflow: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  reactivation: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  upsell: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
}
