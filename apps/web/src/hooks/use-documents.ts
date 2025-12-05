'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface Document {
  id: string
  companyId: string
  fileName: string
  fileType: string | null
  fileSize: number | null
  fileUrl: string
  folderPath: string
  tags: string[] | null
  linkedCustomerId: string | null
  linkedJobId: string | null
  linkedInvoiceId: string | null
  extractedText: string | null
  uploadedBy: string | null
  uploadedAt: string
  updatedAt: string
}

export interface DocumentsResponse {
  documents: Document[]
  total: number
  limit: number
  offset: number
}

interface UseDocumentsOptions {
  folderPath?: string
  search?: string
  linkedEntityType?: 'customer' | 'job' | 'invoice'
  linkedEntityId?: string
  limit?: number
  offset?: number
}

export function useDocuments(options: UseDocumentsOptions = {}) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.folderPath) params.set('folder_path', options.folderPath)
      if (options.search) params.set('search', options.search)
      if (options.linkedEntityType)
        params.set('linked_entity_type', options.linkedEntityType)
      if (options.linkedEntityId)
        params.set('linked_entity_id', options.linkedEntityId)
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.offset) params.set('offset', options.offset.toString())

      const response = await fetch(`/api/documents?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }

      const data: DocumentsResponse = await response.json()
      setDocuments(data.documents)
      setTotal(data.total)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [
    options.folderPath,
    options.search,
    options.linkedEntityType,
    options.linkedEntityId,
    options.limit,
    options.offset,
  ])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Group documents by folder
  const folders = documents.reduce(
    (acc, doc) => {
      const folder = doc.folderPath || 'Uncategorized'
      if (!acc[folder]) acc[folder] = []
      acc[folder].push(doc)
      return acc
    },
    {} as Record<string, Document[]>
  )

  return {
    documents,
    folders,
    total,
    isLoading,
    error,
    refetch: fetchDocuments,
  }
}

export function useDocumentMutations() {
  const [isLoading, setIsLoading] = useState(false)

  const uploadDocument = async (
    file: File,
    options?: {
      folderPath?: string
      linkedCustomerId?: string
      linkedJobId?: string
      linkedInvoiceId?: string
      tags?: string[]
    }
  ) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (options?.folderPath) formData.append('folderPath', options.folderPath)
      if (options?.linkedCustomerId)
        formData.append('linkedCustomerId', options.linkedCustomerId)
      if (options?.linkedJobId)
        formData.append('linkedJobId', options.linkedJobId)
      if (options?.linkedInvoiceId)
        formData.append('linkedInvoiceId', options.linkedInvoiceId)
      if (options?.tags) formData.append('tags', JSON.stringify(options.tags))

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload document')
      }

      const document = await response.json()
      toast.success('Document uploaded successfully')
      return document
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteDocument = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete document')
      }

      toast.success('Document deleted successfully')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const moveDocument = async (id: string, newFolderPath: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: newFolderPath }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to move document')
      }

      const document = await response.json()
      toast.success('Document moved successfully')
      return document
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    uploadDocument,
    deleteDocument,
    moveDocument,
    isLoading,
  }
}
