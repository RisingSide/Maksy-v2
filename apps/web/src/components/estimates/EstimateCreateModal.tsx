'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useEstimateMutations } from '@/hooks/use-estimates'
import { useCustomers } from '@/hooks/use-customers'
import { useServices } from '@/hooks/use-services'
import { usePlanType } from '@/hooks/use-subscription'
import { AIPriceButton } from './AIPriceButton'

interface LineItem {
  description: string
  quantity: string
  unitPrice: string
}

interface EstimateCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function getDefaultValidUntil() {
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  return thirtyDaysFromNow.toISOString().split('T')[0]
}

// Inner form component that resets state when key changes
function EstimateCreateFormContent({
  onOpenChange,
  onSuccess,
}: Omit<EstimateCreateModalProps, 'open'>) {
  const { createEstimate, isLoading } = useEstimateMutations()
  const { customers = [] } = useCustomers({ limit: 100 })
  const { services = [] } = useServices({ limit: 100 })
  const planType = usePlanType()

  const [formData, setFormData] = useState({
    customerId: '',
    validUntil: getDefaultValidUntil(),
    notes: '',
    terms: '',
    location: '', // For AI pricing
    estimatedHours: '1', // For AI pricing
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: '1', unitPrice: '' },
  ])

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unitPrice) || 0
    return sum + qty * price
  }, 0)

  const taxRate = 0 // Could be configurable
  const tax = subtotal * taxRate
  const total = subtotal + tax

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: '', quantity: '1', unitPrice: '' },
    ])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const updateLineItem = (
    index: number,
    field: keyof LineItem,
    value: string
  ) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  const addServiceAsLineItem = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId)
    if (service) {
      setLineItems([
        ...lineItems.filter((item) => item.description || item.unitPrice),
        {
          description: service.name,
          quantity: '1',
          unitPrice: service.price?.toString() || '',
        },
      ])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Filter out empty line items
    const validLineItems = lineItems.filter(
      (item) => item.description && item.unitPrice
    )

    if (validLineItems.length === 0) {
      alert('Please add at least one line item')
      return
    }

    try {
      await createEstimate({
        customerId: formData.customerId,
        expirationDate: formData.validUntil || undefined,
        notes: formData.notes || undefined,
        terms: formData.terms || undefined,
        taxRate: taxRate * 100, // Convert to percentage
        discountAmount: 0,
        lineItems: validLineItems.map((item) => ({
          description: item.description,
          quantity: parseInt(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0, // Convert to number
        })),
      })

      onSuccess()
      onOpenChange(false)
    } catch {
      // Error is handled by the hook
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Create New Estimate</DialogTitle>
        <DialogDescription>
          Create a quote for your customer. Fields marked with * are required.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {/* Customer */}
        <div className="space-y-2">
          <Label htmlFor="customer">Customer *</Label>
          <Select
            value={formData.customerId}
            onValueChange={(value) =>
              setFormData({ ...formData, customerId: value })
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Valid Until */}
        <div className="space-y-2">
          <Label htmlFor="validUntil">Valid Until</Label>
          <Input
            id="validUntil"
            type="date"
            value={formData.validUntil}
            onChange={(e) =>
              setFormData({ ...formData, validUntil: e.target.value })
            }
          />
        </div>

        {/* Location (for AI Pricing) */}
        <div className="space-y-2">
          <Label htmlFor="location">Job Location</Label>
          <Input
            id="location"
            placeholder="Enter service address..."
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
          />
        </div>

        {/* Estimated Hours (for AI Pricing) */}
        <div className="space-y-2">
          <Label htmlFor="estimatedHours">Estimated Hours</Label>
          <Input
            id="estimatedHours"
            type="number"
            min="0.5"
            step="0.5"
            placeholder="1"
            value={formData.estimatedHours}
            onChange={(e) =>
              setFormData({ ...formData, estimatedHours: e.target.value })
            }
          />
        </div>

        {/* Quick Add Service */}
        <div className="space-y-2">
          <Label>Quick Add Service</Label>
          <Select onValueChange={addServiceAsLineItem}>
            <SelectTrigger>
              <SelectValue placeholder="Add a service..." />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name} - ${service.price}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Line Items */}
        <div className="space-y-2">
          <Label>Line Items *</Label>
          <div className="space-y-2">
            {lineItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    updateLineItem(index, 'description', e.target.value)
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="Qty"
                  type="text"
                  inputMode="numeric"
                  value={item.quantity}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    updateLineItem(index, 'quantity', value)
                  }}
                  className="w-16"
                />
                <Input
                  placeholder="Price"
                  type="text"
                  inputMode="decimal"
                  value={item.unitPrice}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '')
                    updateLineItem(index, 'unitPrice', value)
                  }}
                  className="w-24"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLineItem(index)}
                  disabled={lineItems.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Line Item
            </Button>

            {/* AI Price Suggestion - Scale Feature */}
            {planType === 'scale' &&
              lineItems.length > 0 &&
              lineItems[0].description && (
                <AIPriceButton
                  serviceId={
                    services.find((s) => s.name === lineItems[0].description)
                      ?.id || ''
                  }
                  customerId={formData.customerId}
                  location={formData.location}
                  estimatedHours={parseFloat(formData.estimatedHours) || 1}
                  onPriceAccepted={(price) => {
                    // Update the first line item with AI suggested price
                    if (lineItems.length > 0) {
                      updateLineItem(0, 'unitPrice', price.toString())
                    }
                  }}
                  disabled={!formData.customerId || !formData.location}
                />
              )}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span>{formatCurrency(tax)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Additional notes for the customer..."
            rows={2}
          />
        </div>

        {/* Terms */}
        <div className="space-y-2">
          <Label htmlFor="terms">Terms & Conditions</Label>
          <Textarea
            id="terms"
            value={formData.terms}
            onChange={(e) =>
              setFormData({ ...formData, terms: e.target.value })
            }
            placeholder="Payment terms, warranty info, etc..."
            rows={2}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isLoading ||
            !formData.customerId ||
            lineItems.every((i) => !i.description)
          }
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Estimate
        </Button>
      </DialogFooter>
    </form>
  )
}

export function EstimateCreateModal({
  open,
  onOpenChange,
  onSuccess,
}: EstimateCreateModalProps) {
  // The inner form content is only rendered when open is true.
  // By conditionally rendering with {open && ...}, React will unmount and remount
  // the form component each time the modal opens, ensuring fresh state.
  // No key needed - conditional rendering handles the reset.

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {/* Conditional rendering unmounts/remounts form, resetting state */}
        {open && (
          <EstimateCreateFormContent
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
