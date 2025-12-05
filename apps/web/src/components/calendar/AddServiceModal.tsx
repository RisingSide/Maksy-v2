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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

interface AddServiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddServiceModal({ open, onOpenChange }: AddServiceModalProps) {
  const [isPublic, setIsPublic] = useState(true)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Service</DialogTitle>
          <DialogDescription>
            Create a new service for your catalog
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Service Name */}
          <div className="space-y-2">
            <Label htmlFor="service-name">Service Name *</Label>
            <Input id="service-name" placeholder="e.g., AC Repair" />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger id="category" className="flex-1">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="landscaping">Landscaping</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click + to add new category
            </p>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                className="pl-7"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration-hours">Hours</Label>
              <Input
                id="duration-hours"
                type="number"
                placeholder="0"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration-minutes">Minutes</Label>
              <Input
                id="duration-minutes"
                type="number"
                placeholder="0"
                min="0"
                max="59"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the service..."
              rows={4}
            />
          </div>

          {/* Icon/Image Upload */}
          <div className="space-y-2">
            <Label>Icon/Image</Label>
            <div className="border border-dashed border-border rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Upload service icon or image
              </p>
              <Button variant="outline" size="sm">
                Choose File
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Max size: 2MB
              </p>
            </div>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="public-toggle">Public Service</Label>
              <p className="text-xs text-muted-foreground">
                {isPublic ? 'Shows on booking page' : 'Internal only'}
              </p>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Add-ons Section (Pro/Scale) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Add-ons</Label>
              <Badge variant="secondary" className="text-xs">
                Pro/Scale
              </Badge>
            </div>
            <div className="border border-border rounded-lg p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Add additional services to upsell with this service
              </p>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Add-on
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>Create Service</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
