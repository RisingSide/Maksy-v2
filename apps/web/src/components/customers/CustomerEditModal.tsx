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
import { useCustomerMutations, Customer } from '@/hooks/use-customers'
import { Loader2 } from 'lucide-react'

interface CustomerEditModalProps {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function getInitialFormData(customer: Customer | null) {
  return {
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    companyName: customer?.companyName || '',
    street: customer?.addressLine1 || '',
    city: customer?.city || '',
    state: customer?.state || '',
    zip: customer?.zipCode || '',
    notes: customer?.notes || '',
  }
}

// Inner form component that resets state when key changes
function CustomerEditFormContent({
  customer,
  onOpenChange,
  onSuccess,
}: Omit<CustomerEditModalProps, 'open'>) {
  const { updateCustomer, isLoading } = useCustomerMutations()
  const [formData, setFormData] = useState(getInitialFormData(customer))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return

    try {
      await updateCustomer(customer.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        companyName: formData.companyName || undefined,
        address: {
          street: formData.street || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          zip: formData.zip || undefined,
        },
        notes: formData.notes || undefined,
      })

      onSuccess()
      onOpenChange(false)
    } catch {
      // Error is handled by the hook
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogDescription>
          Update customer information. Fields marked with * are required.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-firstName">First Name *</Label>
            <Input
              id="edit-firstName"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              placeholder="John"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-lastName">Last Name *</Label>
            <Input
              id="edit-lastName"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Doe"
              required
            />
          </div>
        </div>

        {/* Contact Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        {/* Company */}
        <div className="space-y-2">
          <Label htmlFor="edit-companyName">Company Name</Label>
          <Input
            id="edit-companyName"
            value={formData.companyName}
            onChange={(e) =>
              setFormData({ ...formData, companyName: e.target.value })
            }
            placeholder="Acme Inc."
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="edit-street">Street Address</Label>
          <Input
            id="edit-street"
            value={formData.street}
            onChange={(e) =>
              setFormData({ ...formData, street: e.target.value })
            }
            placeholder="123 Main St"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-city">City</Label>
            <Input
              id="edit-city"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              placeholder="Austin"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-state">State</Label>
            <Input
              id="edit-state"
              value={formData.state}
              onChange={(e) =>
                setFormData({ ...formData, state: e.target.value })
              }
              placeholder="TX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-zip">ZIP</Label>
            <Input
              id="edit-zip"
              value={formData.zip}
              onChange={(e) =>
                setFormData({ ...formData, zip: e.target.value })
              }
              placeholder="78701"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="edit-notes">Notes</Label>
          <Textarea
            id="edit-notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Any additional notes about this customer..."
            rows={3}
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
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  )
}

export function CustomerEditModal({
  customer,
  open,
  onOpenChange,
  onSuccess,
}: CustomerEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {/* Key resets form state when customer changes */}
        <CustomerEditFormContent
          key={customer?.id || 'new'}
          customer={customer}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
