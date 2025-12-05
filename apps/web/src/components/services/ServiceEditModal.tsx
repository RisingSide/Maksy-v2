'use client'

import { useState } from 'react'
import Image from 'next/image'
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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useServiceMutations,
  Service,
  ServiceCategory,
} from '@/hooks/use-services'
import { Loader2, Upload, X } from 'lucide-react'

interface ServiceEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  service: Service | null
  categories: ServiceCategory[]
}

function getInitialFormData(service: Service | null) {
  return {
    name: service?.name || '',
    slug: service?.slug || '',
    description: service?.description || '',
    price: service?.price?.toString() || '',
    durationMinutes: service?.durationMinutes?.toString() || '60',
    categoryId: service?.categoryId || '',
    color: service?.color || '#f4a125',
    isPublic: service?.isPublic ?? true,
    iconUrl: service?.iconUrl || '',
  }
}

// Inner form component that resets state when key changes
function ServiceEditFormContent({
  service,
  categories,
  onOpenChange,
  onSuccess,
}: Omit<ServiceEditModalProps, 'open'>) {
  const { updateService, isLoading } = useServiceMutations()
  const [formData, setFormData] = useState(getInitialFormData(service))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!service) return

    try {
      await updateService(service.id, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        price: parseFloat(formData.price) || 0,
        durationMinutes: parseInt(formData.durationMinutes) || 60,
        categoryId: formData.categoryId || null,
        color: formData.color,
        isPublic: formData.isPublic,
        iconUrl: formData.iconUrl || undefined,
      })

      onSuccess()
      onOpenChange(false)
    } catch {
      // Error is handled by the hook
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formDataUpload = new FormData()
    formDataUpload.append('file', file)

    try {
      const response = await fetch('/api/upload/service-icon', {
        method: 'POST',
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData({ ...formData, iconUrl: data.url })
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Edit Service</DialogTitle>
        <DialogDescription>
          Update service details. Fields marked with * are required.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {/* Service Image */}
        <div className="space-y-2">
          <Label>Service Image</Label>
          <div className="flex items-center gap-4">
            {formData.iconUrl ? (
              <div className="relative">
                <Image
                  src={formData.iconUrl}
                  alt="Service icon"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-lg object-cover border"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, iconUrl: '' })}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="service-image-edit"
              />
              <Label
                htmlFor="service-image-edit"
                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
              >
                {formData.iconUrl ? 'Change Image' : 'Upload Image'}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 2MB
              </p>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="edit-name">Service Name *</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="AC Repair"
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="edit-slug">URL Slug *</Label>
          <Input
            id="edit-slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="ac-repair"
            required
            pattern="^[a-z0-9-]+$"
          />
          <p className="text-xs text-muted-foreground">
            Used in booking URLs. Lowercase letters, numbers, and hyphens only.
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="edit-description">Description</Label>
          <Textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe what this service includes..."
            rows={3}
          />
        </div>

        {/* Price and Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-price">Price ($) *</Label>
            <Input
              id="edit-price"
              type="text"
              inputMode="decimal"
              value={formData.price}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '')
                const parts = value.split('.')
                const sanitized =
                  parts.length > 2
                    ? parts[0] + '.' + parts.slice(1).join('')
                    : value
                setFormData({ ...formData, price: sanitized })
              }}
              placeholder="150"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-duration">Duration (minutes) *</Label>
            <Input
              id="edit-duration"
              type="text"
              inputMode="numeric"
              value={formData.durationMinutes}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '')
                setFormData({ ...formData, durationMinutes: value })
              }}
              placeholder="60"
              required
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="edit-category">Category</Label>
          <Select
            value={formData.categoryId || 'none'}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                categoryId: value === 'none' ? '' : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Category</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label htmlFor="edit-color">Service Color</Label>
          <div className="flex items-center gap-3">
            <Input
              id="edit-color"
              type="color"
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
              placeholder="#f4a125"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Used in dashboard charts and service labels
          </p>
        </div>

        {/* Public Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="edit-isPublic">Public Service</Label>
            <p className="text-xs text-muted-foreground">
              Show on your public booking page
            </p>
          </div>
          <Switch
            id="edit-isPublic"
            checked={formData.isPublic}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isPublic: checked })
            }
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

export function ServiceEditModal({
  open,
  onOpenChange,
  onSuccess,
  service,
  categories,
}: ServiceEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {/* Key resets form state when service changes */}
        <ServiceEditFormContent
          key={service?.id || 'new'}
          service={service}
          categories={categories}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
