'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, Users, Upload } from 'lucide-react'
import {
  useCustomers,
  useCustomerMutations,
  Customer,
} from '@/hooks/use-customers'
import {
  CustomerCard,
  CustomerCreateModal,
  CustomerEditModal,
  CustomerStats,
} from '@/components/customers'
import {
  EmptyState,
  LoadingState,
  ErrorState,
  ConfirmDialog,
} from '@/components/shared'
import { useDebouncedCallback } from '@/hooks/use-debounce'

export default function CustomersPage() {
  // State
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<'name' | 'recent' | 'ltv'>('recent')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  )

  // Hooks
  const { customers, total, isLoading, error, refetch } = useCustomers({
    search: debouncedSearch,
    sort,
    limit: 50,
  })
  const { deleteCustomer, isLoading: isMutating } = useCustomerMutations()

  // Debounced search
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value)
  }, 300)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    debouncedSetSearch(e.target.value)
  }

  // Handlers
  const handleEdit = useCallback((customer: Customer) => {
    setSelectedCustomer(customer)
    setEditModalOpen(true)
  }, [])

  const handleDelete = useCallback((customer: Customer) => {
    setSelectedCustomer(customer)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return
    try {
      await deleteCustomer(selectedCustomer.id)
      refetch()
      setDeleteDialogOpen(false)
      setSelectedCustomer(null)
    } catch {
      // Error handled by hook
    }
  }

  const handleCustomerClick = useCallback((customer: Customer) => {
    // Could open a detail panel or navigate to customer detail page
    setSelectedCustomer(customer)
    setEditModalOpen(true)
  }, [])

  // Render error state
  if (error && !isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships
          </p>
        </div>
        <ErrorState
          title="Failed to load customers"
          message={error}
          onRetry={refetch}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button
            className="shadow-lg gap-2"
            onClick={() => setCreateModalOpen(true)}
            data-action="add-customer"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats */}
      <CustomerStats
        customers={customers}
        total={total}
        isLoading={isLoading}
      />

      {/* Filters */}
      <Card className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone..."
              className="pl-10"
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button
            variant={sort === 'ltv' ? 'default' : 'outline'}
            onClick={() => setSort(sort === 'ltv' ? 'recent' : 'ltv')}
          >
            Sort by {sort === 'ltv' ? 'Recent' : 'LTV'}
          </Button>
          <Button
            variant={sort === 'name' ? 'default' : 'outline'}
            onClick={() => setSort(sort === 'name' ? 'recent' : 'name')}
          >
            Sort by {sort === 'name' ? 'Recent' : 'Name'}
          </Button>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <LoadingState type="cards" count={6} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={debouncedSearch ? 'No customers found' : 'No customers yet'}
          description={
            debouncedSearch
              ? 'Try adjusting your search or filters'
              : 'Add your first customer to get started with managing your client relationships.'
          }
          action={
            !debouncedSearch
              ? {
                  label: 'Add Customer',
                  onClick: () => setCreateModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <>
          {/* Customers Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onClick={handleCustomerClick}
              />
            ))}
          </div>

          {/* Load More */}
          {customers.length < total && (
            <div className="flex justify-center">
              <Button variant="outline">Load More Customers</Button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CustomerCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={refetch}
      />

      <CustomerEditModal
        customer={selectedCustomer}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={refetch}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Customer"
        description={`Are you sure you want to delete ${selectedCustomer?.firstName} ${selectedCustomer?.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        variant="destructive"
        isLoading={isMutating}
      />
    </div>
  )
}
