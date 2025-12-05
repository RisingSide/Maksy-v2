'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, FileText, X } from 'lucide-react'
import { useContractGeneration, GeneratedContract } from '@/hooks/use-contracts'
import { useCustomers } from '@/hooks/use-customers'

interface ContractGenerationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerated: (contract: GeneratedContract) => void
}

const projectTypes = [
  'HVAC Installation',
  'HVAC Repair',
  'Plumbing',
  'Electrical',
  'Landscaping',
  'Pool Service',
  'Cleaning Service',
  'Painting',
  'Roofing',
  'General Maintenance',
  'Other',
]

export function ContractGenerationModal({
  open,
  onOpenChange,
  onGenerated,
}: ContractGenerationModalProps) {
  const { generateContract, isGenerating } = useContractGeneration()
  const { customers } = useCustomers({ limit: 100 })

  const [formData, setFormData] = useState({
    projectType: '',
    projectSize: 'medium' as 'small' | 'medium' | 'large',
    location: '',
    materials: '',
    estimatedValue: '',
    customerId: '',
    includeWarranty: true,
    includePaymentTerms: true,
    customNotes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const contract = await generateContract({
        projectType: formData.projectType,
        projectSize: formData.projectSize,
        location: formData.location,
        materials: formData.materials
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean),
        estimatedValue: parseFloat(formData.estimatedValue) || 0,
        customerId: formData.customerId || undefined,
        includeWarranty: formData.includeWarranty,
        includePaymentTerms: formData.includePaymentTerms,
        customNotes: formData.customNotes || undefined,
      })

      onGenerated(contract)
      onOpenChange(false)
    } catch {
      // Error handled by hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>AI Contract Generator</DialogTitle>
              <DialogDescription>
                Generate a professional contract using AI
              </DialogDescription>
            </div>
          </div>
          <Badge className="w-fit bg-purple-500/10 text-purple-600 dark:text-purple-400">
            Scale Feature
          </Badge>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type *</Label>
              <Select
                value={formData.projectType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, projectType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectSize">Project Size *</Label>
              <Select
                value={formData.projectSize}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    projectSize: value as 'small' | 'medium' | 'large',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer">Customer (Optional)</Label>
            <Select
              value={formData.customerId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, customerId: value }))
              }
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

          <div className="space-y-2">
            <Label htmlFor="location">Project Location *</Label>
            <Input
              id="location"
              placeholder="123 Main St, City, State"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
              <Input
                id="estimatedValue"
                type="number"
                placeholder="5000"
                value={formData.estimatedValue}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    estimatedValue: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="materials">Materials (comma-separated)</Label>
              <Input
                id="materials"
                placeholder="PVC pipes, fittings, sealant"
                value={formData.materials}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    materials: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customNotes">Additional Notes</Label>
            <Textarea
              id="customNotes"
              placeholder="Any special requirements or notes for the contract..."
              value={formData.customNotes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  customNotes: e.target.value,
                }))
              }
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  id="warranty"
                  checked={formData.includeWarranty}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      includeWarranty: checked,
                    }))
                  }
                />
                <Label htmlFor="warranty" className="cursor-pointer">
                  Include Warranty Terms
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="paymentTerms"
                  checked={formData.includePaymentTerms}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      includePaymentTerms: checked,
                    }))
                  }
                />
                <Label htmlFor="paymentTerms" className="cursor-pointer">
                  Include Payment Terms
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isGenerating || !formData.projectType || !formData.location
              }
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Contract
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface ContractPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract: GeneratedContract | null
  onSave: () => void
}

export function ContractPreviewModal({
  open,
  onOpenChange,
  contract,
  onSave,
}: ContractPreviewModalProps) {
  if (!contract) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {contract.title}
          </DialogTitle>
          <DialogDescription>
            Generated on{' '}
            {new Date(contract.metadata.generatedAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Contract Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div
              dangerouslySetInnerHTML={{ __html: contract.content }}
              className="p-4 border rounded-lg bg-card"
            />
          </div>

          {/* Scope of Work */}
          {contract.scopeOfWork && (
            <div>
              <h4 className="font-semibold mb-2">Scope of Work</h4>
              <div className="p-4 border rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                {contract.scopeOfWork}
              </div>
            </div>
          )}

          {/* Warranty */}
          {contract.warranty && (
            <div>
              <h4 className="font-semibold mb-2">Warranty Terms</h4>
              <div className="p-4 border rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                {contract.warranty}
              </div>
            </div>
          )}

          {/* Payment Terms */}
          {contract.terms && (
            <div>
              <h4 className="font-semibold mb-2">Payment Terms</h4>
              <div className="p-4 border rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                {contract.terms}
              </div>
            </div>
          )}

          {/* Suggested Price */}
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div>
              <p className="text-sm text-muted-foreground">
                AI Suggested Price
              </p>
              <p className="text-2xl font-bold">
                ${contract.suggestedPrice.toLocaleString()}
              </p>
            </div>
            <Badge>{contract.metadata.projectSize} project</Badge>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button onClick={onSave} className="gap-2">
            <FileText className="h-4 w-4" />
            Save Contract
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
