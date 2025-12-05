'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  Loader2,
} from 'lucide-react'
import {
  useInventory,
  useInventoryMutations,
  InventoryItem,
} from '@/hooks/use-inventory'
import { useDebouncedValue } from '@/hooks/use-debounce'

type ItemStatus = 'in-stock' | 'low' | 'critical'

function getItemStatus(item: InventoryItem): ItemStatus {
  const qty = parseFloat(item.quantityOnHand || '0')
  const reorder = parseFloat(item.reorderPoint || '0')

  if (qty === 0 || qty <= reorder * 0.5) return 'critical'
  if (qty <= reorder) return 'low'
  return 'in-stock'
}

function getStatusBadge(status: ItemStatus) {
  switch (status) {
    case 'in-stock':
      return (
        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
          In Stock
        </Badge>
      )
    case 'low':
      return (
        <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
          Low Stock
        </Badge>
      )
    case 'critical':
      return (
        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
          Critical
        </Badge>
      )
  }
}

function formatCurrency(value: string | null): string {
  if (!value) return '$0.00'
  const num = parseFloat(value)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num)
}

export function InventoryClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustNotes, setAdjustNotes] = useState('')

  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const { items, isLoading, stats, refetch } = useInventory({
    search: debouncedSearch,
  })
  const {
    createItem,
    adjustQuantity,
    deleteItem,
    isLoading: isMutating,
  } = useInventoryMutations()

  // Form state for new item
  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    category: '',
    unitCost: '',
    quantityOnHand: '',
    reorderPoint: '',
    notes: '',
  })

  const handleAddItem = async () => {
    if (!newItem.name) return

    try {
      await createItem({
        name: newItem.name,
        sku: newItem.sku || undefined,
        category: newItem.category || undefined,
        unitCost: newItem.unitCost ? parseFloat(newItem.unitCost) : undefined,
        quantityOnHand: newItem.quantityOnHand
          ? parseFloat(newItem.quantityOnHand)
          : 0,
        reorderPoint: newItem.reorderPoint
          ? parseFloat(newItem.reorderPoint)
          : 0,
        notes: newItem.notes || undefined,
      })
      setShowAddModal(false)
      setNewItem({
        name: '',
        sku: '',
        category: '',
        unitCost: '',
        quantityOnHand: '',
        reorderPoint: '',
        notes: '',
      })
      refetch()
    } catch {
      // Error handled by hook
    }
  }

  const handleAdjust = async () => {
    if (!selectedItem || !adjustAmount) return

    try {
      await adjustQuantity(selectedItem.id, {
        changeAmount: parseFloat(adjustAmount),
        changeType: 'manual',
        notes: adjustNotes || undefined,
      })
      setShowAdjustModal(false)
      setSelectedItem(null)
      setAdjustAmount('')
      setAdjustNotes('')
      refetch()
    } catch {
      // Error handled by hook
    }
  }

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return

    try {
      await deleteItem(item.id)
      refetch()
    } catch {
      // Error handled by hook
    }
  }

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item)
    setAdjustAmount('')
    setAdjustNotes('')
    setShowAdjustModal(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Inventory</h1>
          <p className="text-muted-foreground">
            Track your tools, supplies, and equipment
          </p>
        </div>
        <Button
          className="shadow-lg gap-2"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Items</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold">{stats.totalItems}</p>
          )}
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Value</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(stats.totalValue)}
            </p>
          )}
        </Card>
        <Card className="glass-card p-4 border-orange-500/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-muted-foreground">Low Stock</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-8" />
          ) : (
            <p className="text-2xl font-bold text-orange-600">
              {stats.lowStockCount}
            </p>
          )}
        </Card>
        <Card className="glass-card p-4 border-red-500/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-muted-foreground">Critical</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-8" />
          ) : (
            <p className="text-2xl font-bold text-red-600">
              {stats.criticalCount}
            </p>
          )}
        </Card>
      </div>

      {/* Search */}
      <Card className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-16 ml-auto" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No items found' : 'No inventory items yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Add your first item to start tracking inventory'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Item
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left p-4 font-semibold text-sm">Item</th>
                <th className="text-left p-4 font-semibold text-sm">SKU</th>
                <th className="text-left p-4 font-semibold text-sm">
                  Quantity
                </th>
                <th className="text-left p-4 font-semibold text-sm">
                  Reorder Point
                </th>
                <th className="text-left p-4 font-semibold text-sm">
                  Unit Cost
                </th>
                <th className="text-left p-4 font-semibold text-sm">Status</th>
                <th className="text-left p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const status = getItemStatus(item)
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.category && (
                            <p className="text-xs text-muted-foreground">
                              {item.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {item.sku || '—'}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold">
                        {parseFloat(item.quantityOnHand || '0')}
                      </span>
                    </td>
                    <td className="p-4">
                      {parseFloat(item.reorderPoint || '0')}
                    </td>
                    <td className="p-4">{formatCurrency(item.unitCost)}</td>
                    <td className="p-4">{getStatusBadge(status)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustModal(item)}
                        >
                          <ArrowUpDown className="h-3 w-3 mr-1" />
                          Adjust
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openAdjustModal(item)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Add Item Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                placeholder="e.g., HVAC Filter (16x20)"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  placeholder="e.g., HVAC-F-1620"
                  value={newItem.sku}
                  onChange={(e) =>
                    setNewItem({ ...newItem, sku: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Filters"
                  value={newItem.category}
                  onChange={(e) =>
                    setNewItem({ ...newItem, category: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={newItem.quantityOnHand}
                  onChange={(e) =>
                    setNewItem({ ...newItem, quantityOnHand: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder">Reorder Point</Label>
                <Input
                  id="reorder"
                  type="number"
                  placeholder="10"
                  value={newItem.reorderPoint}
                  onChange={(e) =>
                    setNewItem({ ...newItem, reorderPoint: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Unit Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newItem.unitCost}
                  onChange={(e) =>
                    setNewItem({ ...newItem, unitCost: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes about this item..."
                value={newItem.notes}
                onChange={(e) =>
                  setNewItem({ ...newItem, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={!newItem.name || isMutating}
            >
              {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Quantity Modal */}
      <Dialog open={showAdjustModal} onOpenChange={setShowAdjustModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Quantity</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{selectedItem.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current: {parseFloat(selectedItem.quantityOnHand || '0')}{' '}
                    units
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjust">Adjustment Amount</Label>
                <Input
                  id="adjust"
                  type="number"
                  placeholder="e.g., 10 or -5"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use positive numbers to add, negative to subtract
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustNotes">Notes (optional)</Label>
                <Textarea
                  id="adjustNotes"
                  placeholder="Reason for adjustment..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                />
              </div>
              {adjustAmount && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    New quantity:{' '}
                    <span className="font-semibold">
                      {parseFloat(selectedItem.quantityOnHand || '0') +
                        parseFloat(adjustAmount || '0')}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdjust}
              disabled={!adjustAmount || isMutating}
            >
              {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
