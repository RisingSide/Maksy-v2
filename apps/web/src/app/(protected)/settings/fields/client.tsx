'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Database,
  Plus,
  GripVertical,
  Trash2,
  Loader2,
  Type,
  Hash,
  Calendar,
  ChevronDown,
  CheckSquare,
  AlignLeft,
  Globe,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CustomField {
  id: string
  fieldName: string
  fieldSlug: string
  fieldType: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'textarea'
  dropdownOptions: string[] | null
  isRequired: boolean
  showOnBookingPage: boolean
  sortOrder: number
}

interface CustomerFieldsClientProps {
  fields: CustomField[]
  planType: string
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'dropdown', label: 'Dropdown', icon: ChevronDown },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'textarea', label: 'Long Text', icon: AlignLeft },
]

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export function CustomerFieldsClient({
  fields: initialFields,
  planType,
}: CustomerFieldsClientProps) {
  const [fields, setFields] = useState(initialFields)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    fieldName: '',
    fieldSlug: '',
    fieldType: 'text' as CustomField['fieldType'],
    dropdownOptions: '',
    isRequired: false,
    showOnBookingPage: false,
  })

  const resetForm = () => {
    setFormData({
      fieldName: '',
      fieldSlug: '',
      fieldType: 'text',
      dropdownOptions: '',
      isRequired: false,
      showOnBookingPage: false,
    })
    setEditingField(null)
  }

  const handleOpenDialog = (field?: CustomField) => {
    if (field) {
      setEditingField(field)
      setFormData({
        fieldName: field.fieldName,
        fieldSlug: field.fieldSlug,
        fieldType: field.fieldType,
        dropdownOptions: field.dropdownOptions?.join(', ') || '',
        isRequired: field.isRequired,
        showOnBookingPage: field.showOnBookingPage,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.fieldName) {
      toast.error('Please enter a field name')
      return
    }

    if (formData.fieldType === 'dropdown' && !formData.dropdownOptions.trim()) {
      toast.error('Please enter dropdown options')
      return
    }

    setIsSubmitting(true)
    try {
      const url = editingField
        ? `/api/customer-fields/${editingField.id}`
        : '/api/customer-fields'
      const method = editingField ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName: formData.fieldName,
          fieldSlug: formData.fieldSlug || generateSlug(formData.fieldName),
          fieldType: formData.fieldType,
          dropdownOptions:
            formData.fieldType === 'dropdown'
              ? formData.dropdownOptions
                  .split(',')
                  .map((o) => o.trim())
                  .filter(Boolean)
              : null,
          isRequired: formData.isRequired,
          showOnBookingPage: formData.showOnBookingPage,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save field')
      }

      const data = await response.json()

      if (editingField) {
        setFields((prev) =>
          prev.map((f) => (f.id === editingField.id ? data.field : f))
        )
        toast.success('Field updated!')
      } else {
        setFields((prev) => [...prev, data.field])
        toast.success('Field created!')
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save field'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (fieldId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this field? Customer data for this field will be lost.'
      )
    )
      return

    try {
      const response = await fetch(`/api/customer-fields/${fieldId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete field')

      setFields((prev) => prev.filter((f) => f.id !== fieldId))
      toast.success('Field deleted!')
    } catch (error) {
      toast.error('Failed to delete field')
    }
  }

  const getFieldIcon = (type: string) => {
    const fieldType = FIELD_TYPES.find((t) => t.value === type)
    return fieldType?.icon || Type
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Customer Fields
          </h1>
          <p className="text-muted-foreground">
            Add custom fields to capture additional customer information
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingField ? 'Edit Field' : 'Add Custom Field'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Field Name *</Label>
                <Input
                  value={formData.fieldName}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      fieldName: e.target.value,
                      fieldSlug: editingField
                        ? formData.fieldSlug
                        : generateSlug(e.target.value),
                    })
                  }}
                  placeholder="e.g., Property Size"
                />
              </div>

              <div>
                <Label>Field Slug</Label>
                <Input
                  value={formData.fieldSlug}
                  onChange={(e) =>
                    setFormData({ ...formData, fieldSlug: e.target.value })
                  }
                  placeholder="property_size"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used for API access and integrations
                </p>
              </div>

              <div>
                <Label>Field Type</Label>
                <Select
                  value={formData.fieldType}
                  onValueChange={(value: CustomField['fieldType']) =>
                    setFormData({ ...formData, fieldType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {formData.fieldType === 'dropdown' && (
                <div>
                  <Label>Dropdown Options</Label>
                  <Input
                    value={formData.dropdownOptions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dropdownOptions: e.target.value,
                      })
                    }
                    placeholder="Option 1, Option 2, Option 3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separate options with commas
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Required</Label>
                  <p className="text-xs text-muted-foreground">
                    Field must be filled in
                  </p>
                </div>
                <Switch
                  checked={formData.isRequired}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRequired: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Label>Show on Booking Page</Label>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Display this field on your public booking page
                  </p>
                </div>
                <Switch
                  checked={formData.showOnBookingPage}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, showOnBookingPage: checked })
                  }
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingField ? (
                    'Update Field'
                  ) : (
                    'Add Field'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Default Fields Info */}
      <Card className="glass-card p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          <strong>Default fields:</strong> First Name, Last Name, Email, Phone,
          Address, and Notes are always available. Add custom fields below to
          capture additional information specific to your business.
        </p>
      </Card>

      {/* Fields List */}
      {fields.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No custom fields yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add custom fields to capture additional customer information
          </p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {fields.map((field) => {
            const Icon = getFieldIcon(field.fieldType)
            return (
              <Card key={field.id} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="cursor-grab text-muted-foreground hover:text-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.fieldName}</span>
                        <code className="text-xs text-muted-foreground bg-muted px-1 rounded">
                          {field.fieldSlug}
                        </code>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="capitalize">{field.fieldType}</span>
                        {field.isRequired && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {field.showOnBookingPage && (
                          <Badge variant="outline" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            Booking
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(field)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(field.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {field.fieldType === 'dropdown' && field.dropdownOptions && (
                  <div className="mt-3 ml-14 flex flex-wrap gap-1">
                    {field.dropdownOptions.map((option, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {option}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
