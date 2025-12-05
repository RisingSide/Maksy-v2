'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Plus,
  FileText,
  Filter,
  Sparkles,
  Send,
  MoreHorizontal,
  Eye,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  useContracts,
  Contract,
  GeneratedContract,
  useContractMutations,
} from '@/hooks/use-contracts'
import {
  ContractGenerationModal,
  ContractPreviewModal,
  ContractCreateModal,
} from '@/components/contracts'

const statusConfig: Record<
  Contract['status'],
  { label: string; icon: typeof Clock; color: string }
> = {
  draft: {
    label: 'Draft',
    icon: Clock,
    color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  },
  sent: {
    label: 'Sent',
    icon: Send,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  signed: {
    label: 'Signed',
    icon: CheckCircle,
    color: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
  expired: {
    label: 'Expired',
    icon: AlertCircle,
    color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
}

export default function ContractsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    Contract['status'] | undefined
  >(undefined)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [generatedContract, setGeneratedContract] =
    useState<GeneratedContract | null>(null)

  const { contracts, isLoading, total, refetch } = useContracts({
    status: statusFilter,
  })
  const { createContract, isLoading: isSaving } = useContractMutations()

  // Filter contracts by search
  const filteredContracts = contracts.filter(
    (contract) =>
      contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.customer?.firstName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      contract.customer?.lastName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  )

  // Stats
  const stats = {
    total: contracts.length,
    draft: contracts.filter((c) => c.status === 'draft').length,
    sent: contracts.filter((c) => c.status === 'sent').length,
    signed: contracts.filter((c) => c.status === 'signed').length,
  }

  const handleContractGenerated = (contract: GeneratedContract) => {
    setGeneratedContract(contract)
    setShowGenerateModal(false)
    setShowPreviewModal(true)
  }

  const handleSaveContract = async () => {
    if (!generatedContract) return

    try {
      await createContract({
        title: generatedContract.title,
        content: generatedContract.content,
        customerId: generatedContract.customerId,
        contractType: generatedContract.metadata?.projectType || 'general',
      })
      setShowPreviewModal(false)
      setGeneratedContract(null)
      refetch()
    } catch {
      // Error handled by hook
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contracts</h1>
          <p className="text-muted-foreground">Manage agreements & proposals</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowGenerateModal(true)}
          >
            <Sparkles className="h-4 w-4" />
            AI Generate
            <Badge variant="secondary" className="ml-1">
              Scale
            </Badge>
          </Button>
          <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            New Contract
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Contracts</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Drafts</p>
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">
            Awaiting Signature
          </p>
          <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Signed</p>
          <p className="text-2xl font-bold text-green-600">{stats.signed}</p>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                {statusFilter ? statusConfig[statusFilter].label : 'All Status'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter(undefined)}>
                All Status
              </DropdownMenuItem>
              {Object.entries(statusConfig).map(([status, config]) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => setStatusFilter(status as Contract['status'])}
                >
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      {/* Contracts List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredContracts.length === 0 ? (
        <Card className="glass-card p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {searchQuery ? 'No contracts found' : 'No contracts yet'}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Create your first contract to get started. You can draft proposals, service agreements, waivers, and more.'}
              </p>
            </div>
            {!searchQuery && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowGenerateModal(true)}
                >
                  <Sparkles className="h-4 w-4" />
                  Generate with AI
                </Button>
                <Button
                  className="gap-2"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create Manually
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => {
            const status = statusConfig[contract.status]
            const StatusIcon = status.icon

            return (
              <Card
                key={contract.id}
                className="glass-card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{contract.title}</h3>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      {contract.customer && (
                        <p className="text-sm text-muted-foreground">
                          {contract.customer.firstName}{' '}
                          {contract.customer.lastName} •{' '}
                          {contract.customer.email}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Created{' '}
                        {new Date(contract.createdAt).toLocaleDateString()}
                        {contract.validUntil &&
                          ` • Valid until ${new Date(contract.validUntil).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {contract.status === 'draft' && (
                      <Button size="sm" className="gap-2">
                        <Send className="h-3 w-3" />
                        Send
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <ContractGenerationModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
        onGenerated={handleContractGenerated}
      />

      <ContractPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        contract={generatedContract}
        onSave={handleSaveContract}
      />

      <ContractCreateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={async (data) => {
          await createContract(data)
          refetch()
        }}
        isLoading={isSaving}
      />
    </div>
  )
}
