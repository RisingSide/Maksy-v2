'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, Wrench } from 'lucide-react'
import {
  useServices,
  useServiceCategories,
  useServiceMutations,
  Service,
} from '@/hooks/use-services'
import {
  ServiceCard,
  ServiceCreateModal,
  ServiceEditModal,
  CategoryCreateModal,
  ServiceStats,
} from '@/components/services'
import {
  EmptyState,
  LoadingState,
  ErrorState,
  ConfirmDialog,
} from '@/components/shared'
import { useDebouncedCallback } from '@/hooks/use-debounce'

export default function ServicesPage() {
  // State
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [createServiceModalOpen, setCreateServiceModalOpen] = useState(false)
  const [editServiceModalOpen, setEditServiceModalOpen] = useState(false)
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  // Hooks
  const { services, total, isLoading, error, refetch } = useServices({
    search: debouncedSearch,
    sort: 'order',
    limit: 100,
  })
  const {
    categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useServiceCategories()
  const { deleteService, isLoading: isMutating } = useServiceMutations()

  // Debounced search
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value)
  }, 300)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    debouncedSetSearch(e.target.value)
  }

  // Handlers
  const handleEdit = useCallback((service: Service) => {
    setSelectedService(service)
    setEditServiceModalOpen(true)
  }, [])

  const handleDelete = useCallback((service: Service) => {
    setSelectedService(service)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = async () => {
    if (!selectedService) return
    try {
      await deleteService(selectedService.id)
      refetch()
      setDeleteDialogOpen(false)
      setSelectedService(null)
    } catch {
      // Error handled by hook
    }
  }

  const handleServiceClick = useCallback((service: Service) => {
    // Open edit modal when clicking on a service card
    setSelectedService(service)
    setEditServiceModalOpen(true)
  }, [])

  const handleServiceCreated = () => {
    refetch()
    refetchCategories()
  }

  const handleCategoryCreated = () => {
    refetchCategories()
  }

  // Group services by category
  const groupedServices = services.reduce(
    (acc, service) => {
      const categoryName = service.category?.name || 'Uncategorized'
      if (!acc[categoryName]) {
        acc[categoryName] = []
      }
      acc[categoryName].push(service)
      return acc
    },
    {} as Record<string, Service[]>
  )

  // Render error state
  if (error && !isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Services</h1>
          <p className="text-muted-foreground">Manage your service catalog</p>
        </div>
        <ErrorState
          title="Failed to load services"
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Services</h1>
          <p className="text-muted-foreground">Manage your service catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setCreateCategoryModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
          <Button
            className="shadow-lg gap-2"
            onClick={() => setCreateServiceModalOpen(true)}
            data-action="add-service"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Stats */}
      <ServiceStats
        services={services}
        categories={categories}
        total={total}
        isLoading={isLoading || categoriesLoading}
      />

      {/* Search */}
      <Card className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            className="pl-10"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <LoadingState type="cards" count={6} />
      ) : services.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={debouncedSearch ? 'No services found' : 'No services yet'}
          description={
            debouncedSearch
              ? 'Try adjusting your search'
              : 'Add your first service to start building your catalog.'
          }
          action={
            !debouncedSearch
              ? {
                  label: 'Add Service',
                  onClick: () => setCreateServiceModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedServices).map(
            ([categoryName, categoryServices]) => (
              <div key={categoryName}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{categoryName}</h2>
                  <Badge variant="secondary">
                    {categoryServices.length} services
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onClick={handleServiceClick}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Modals */}
      <ServiceCreateModal
        open={createServiceModalOpen}
        onOpenChange={setCreateServiceModalOpen}
        onSuccess={handleServiceCreated}
        categories={categories}
      />

      <ServiceEditModal
        open={editServiceModalOpen}
        onOpenChange={setEditServiceModalOpen}
        onSuccess={() => {
          refetch()
          setSelectedService(null)
        }}
        service={selectedService}
        categories={categories}
      />

      <CategoryCreateModal
        open={createCategoryModalOpen}
        onOpenChange={setCreateCategoryModalOpen}
        onSuccess={handleCategoryCreated}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Service"
        description={`Are you sure you want to delete "${selectedService?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        variant="destructive"
        isLoading={isMutating}
      />
    </div>
  )
}
