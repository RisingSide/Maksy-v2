'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface Contract {
  id: string
  companyId: string
  customerId: string | null
  title: string
  content: string
  status: 'draft' | 'sent' | 'signed' | 'expired' | 'cancelled'
  templateId: string | null
  validUntil: string | null
  signedAt: string | null
  signatureUrl: string | null
  createdAt: string
  updatedAt: string
  customer?: {
    firstName: string
    lastName: string
    email: string
  } | null
}

export interface ContractsResponse {
  contracts: Contract[]
  total: number
  has_more: boolean
}

interface UseContractsOptions {
  status?: Contract['status']
  customerId?: string
  limit?: number
  offset?: number
}

export function useContracts(options: UseContractsOptions = {}) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContracts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.status) params.set('status', options.status)
      if (options.customerId) params.set('customerId', options.customerId)
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.offset) params.set('offset', options.offset.toString())

      const response = await fetch(`/api/contracts?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch contracts')
      }

      const data: ContractsResponse = await response.json()
      setContracts(data.contracts)
      setTotal(data.total)
      setHasMore(data.has_more)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [options.status, options.customerId, options.limit, options.offset])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  return {
    contracts,
    total,
    hasMore,
    isLoading,
    error,
    refetch: fetchContracts,
  }
}

export interface GeneratedContract {
  title: string
  content: string
  warranty: string
  terms: string
  scopeOfWork: string
  suggestedPrice: number
  customerId?: string
  metadata: {
    projectType: string
    projectSize: string
    generatedAt: string
  }
}

export interface ContractGenerationParams {
  projectType: string
  projectSize: 'small' | 'medium' | 'large'
  location: string
  materials: string[]
  estimatedValue: number
  customerId?: string
  includeWarranty: boolean
  includePaymentTerms: boolean
  customNotes?: string
}

export function useContractGeneration() {
  const [generatedContract, setGeneratedContract] =
    useState<GeneratedContract | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateContract = async (params: ContractGenerationParams) => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/contracts/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (response.status === 403) {
        throw new Error(
          'AI Contract Builder is only available on the Scale plan'
        )
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate contract')
      }

      const data = await response.json()
      const contractWithCustomer = {
        ...data.contract,
        customerId: params.customerId,
      }
      setGeneratedContract(contractWithCustomer)
      toast.success('Contract generated successfully')
      return contractWithCustomer
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }

  const clearGenerated = () => {
    setGeneratedContract(null)
    setError(null)
  }

  return {
    generatedContract,
    isGenerating,
    error,
    generateContract,
    clearGenerated,
  }
}

export function useContractMutations() {
  const [isLoading, setIsLoading] = useState(false)

  const createContract = async (data: {
    title: string
    content: string
    customerId?: string
    validUntil?: string
    contractType?: string
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          customerId: data.customerId,
          contractType: data.contractType || 'general',
          contentHtml: data.content,
          contentJson: { content: data.content },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create contract')
      }

      const contract = await response.json()
      toast.success('Contract created successfully')
      return contract
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createContract,
    isLoading,
  }
}
