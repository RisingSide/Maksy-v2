'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, FileText, Send, Loader2, FileX } from 'lucide-react'
import {
  useEstimates,
  useEstimateMutations,
  Estimate,
} from '@/hooks/use-estimates'
import { EstimateCreateModal } from '@/components/estimates'
import { format } from 'date-fns'

export default function EstimatesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    Estimate['status'] | undefined
  >()
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const { estimates, total, isLoading, error, refetch } = useEstimates({
    status: statusFilter,
    limit: 50,
  })
  const {
    sendEstimate,
    convertEstimate,
    isLoading: isMutating,
  } = useEstimateMutations()

  // Filter estimates by search
  const filteredEstimates = useMemo(() => {
    if (!search) return estimates
    const searchLower = search.toLowerCase()
    return estimates.filter(
      (est) =>
        est.estimateNumber.toLowerCase().includes(searchLower) ||
        est.customer?.firstName?.toLowerCase().includes(searchLower) ||
        est.customer?.lastName?.toLowerCase().includes(searchLower)
    )
  }, [estimates, search])

  // Calculate stats
  const stats = useMemo(() => {
    const totalValue = estimates.reduce(
      (sum, est) => sum + parseFloat(est.total || '0'),
      0
    )
    const pendingCount = estimates.filter((est) => est.status === 'sent').length
    const approvedCount = estimates.filter(
      (est) => est.status === 'approved'
    ).length
    const declinedCount = estimates.filter(
      (est) => est.status === 'declined'
    ).length
    const totalResponded = approvedCount + declinedCount
    const approvalRate =
      totalResponded > 0
        ? Math.round((approvedCount / totalResponded) * 100)
        : 0

    return { totalValue, pendingCount, approvedCount, approvalRate }
  }, [estimates])

  const getStatusBadge = (status: Estimate['status']) => {
    switch (status) {
      case 'draft':
        return (
          <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
            Draft
          </Badge>
        )
      case 'sent':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Sent
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Approved
          </Badge>
        )
      case 'declined':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Declined
          </Badge>
        )
      case 'expired':
        return (
          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            Expired
          </Badge>
        )
      default:
        return null
    }
  }

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num)
  }

  const handleSendEstimate = async (id: string) => {
    await sendEstimate(id)
    refetch()
  }

  const handleConvertToInvoice = async (id: string) => {
    await convertEstimate(id, { createInvoice: true })
    refetch()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading estimates...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass-card p-8 text-center max-w-md">
          <FileX className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Error Loading Estimates
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Estimates</h1>
          <p className="text-muted-foreground">Create and manage quotes</p>
        </div>
        <Button
          className="shadow-lg gap-2"
          onClick={() => setCreateModalOpen(true)}
          data-action="create-estimate"
        >
          <Plus className="h-4 w-4" />
          New Estimate
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Value</p>
          <p className="text-2xl font-bold">
            {formatCurrency(stats.totalValue)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {total} estimates
          </p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.pendingCount}
          </p>
          <p className="text-xs text-blue-600 mt-1">Awaiting response</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Approval Rate</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.approvalRate}%
          </p>
          <p className="text-xs text-green-600 mt-1">
            {stats.approvedCount} approved
          </p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Estimates</p>
          <p className="text-2xl font-bold">{total}</p>
        </Card>
      </div>

      <Card className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search estimates..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {filteredEstimates.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
          <h3 className="text-lg font-semibold mb-2">No Estimates Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search
              ? 'No estimates match your search.'
              : 'Create your first estimate to get started.'}
          </p>
          {!search && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Estimate
            </Button>
          )}
        </Card>
      ) : (
        <Card className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left p-4 font-semibold text-sm">
                  Estimate #
                </th>
                <th className="text-left p-4 font-semibold text-sm">
                  Customer
                </th>
                <th className="text-left p-4 font-semibold text-sm">Amount</th>
                <th className="text-left p-4 font-semibold text-sm">Created</th>
                <th className="text-left p-4 font-semibold text-sm">Status</th>
                <th className="text-left p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEstimates.map((estimate) => (
                <tr
                  key={estimate.id}
                  className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                >
                  <td className="p-4">
                    <span className="font-mono font-semibold text-sm">
                      {estimate.estimateNumber}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                        {estimate.customer
                          ? `${estimate.customer.firstName?.[0] || ''}${estimate.customer.lastName?.[0] || ''}`
                          : '?'}
                      </div>
                      <span>
                        {estimate.customer
                          ? `${estimate.customer.firstName} ${estimate.customer.lastName}`
                          : 'Unknown Customer'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold">
                      {formatCurrency(estimate.total)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {format(new Date(estimate.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="p-4">{getStatusBadge(estimate.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {estimate.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleSendEstimate(estimate.id)}
                          disabled={isMutating}
                        >
                          <Send className="h-3 w-3" />
                          Send
                        </Button>
                      )}
                      {estimate.status === 'approved' && (
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => handleConvertToInvoice(estimate.id)}
                          disabled={isMutating}
                        >
                          <FileText className="h-3 w-3" />
                          Convert to Invoice
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create Estimate Modal */}
      <EstimateCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          refetch()
          setCreateModalOpen(false)
        }}
      />
    </div>
  )
}
