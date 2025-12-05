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
import { Loader2, FileText } from 'lucide-react'
import { useCustomers } from '@/hooks/use-customers'

interface ContractCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    title: string
    content: string
    customerId?: string
    contractType: string
    validUntil?: string
  }) => Promise<void>
  isLoading?: boolean
}

const contractTypes = [
  { value: 'service_agreement', label: 'Service Agreement' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'waiver', label: 'Liability Waiver' },
  { value: 'maintenance', label: 'Maintenance Contract' },
  { value: 'general', label: 'General Contract' },
]

function getDefaultValidUntil() {
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  return thirtyDaysFromNow.toISOString().split('T')[0]
}

export function ContractCreateModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: ContractCreateModalProps) {
  const { customers = [] } = useCustomers({ limit: 100 })

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    customerId: '',
    contractType: 'service_agreement',
    validUntil: getDefaultValidUntil(),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await onSubmit({
        title: formData.title,
        content: formData.content,
        customerId: formData.customerId || undefined,
        contractType: formData.contractType,
        validUntil: formData.validUntil || undefined,
      })

      // Reset form
      setFormData({
        title: '',
        content: '',
        customerId: '',
        contractType: 'service_agreement',
        validUntil: getDefaultValidUntil(),
      })
      onOpenChange(false)
    } catch {
      // Error handled by parent
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create New Contract
            </DialogTitle>
            <DialogDescription>
              Create a contract manually. You can use placeholders like{' '}
              {'{customer_name}'} that will be replaced when sending.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Contract Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Service Agreement - Pool Maintenance"
                required
              />
            </div>

            {/* Type & Customer Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contract Type</Label>
                <Select
                  value={formData.contractType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, contractType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Customer (Optional)</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, customerId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Contract Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Enter the contract terms and conditions..."
                rows={12}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                Available placeholders: {'{customer_name}'}, {'{company_name}'},{' '}
                {'{date}'}, {'{valid_until}'}
              </p>
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
              disabled={isLoading || !formData.title || !formData.content}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Contract
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
