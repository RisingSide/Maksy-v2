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
import { useServiceMutations } from '@/hooks/use-services'
import { Loader2 } from 'lucide-react'

interface CategoryCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CategoryCreateModal({
  open,
  onOpenChange,
  onSuccess,
}: CategoryCreateModalProps) {
  const { createCategory, isLoading } = useServiceMutations()

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  })

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setFormData({ ...formData, name, slug })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createCategory({
        name: formData.name,
        slug: formData.slug,
      })

      // Reset form
      setFormData({
        name: '',
        slug: '',
      })

      onSuccess()
      onOpenChange(false)
    } catch {
      // Error is handled by the hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your services.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="cat-name">Category Name *</Label>
              <Input
                id="cat-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="HVAC"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="cat-slug">URL Slug *</Label>
              <Input
                id="cat-slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="hvac"
                required
                pattern="^[a-z0-9-]+$"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only.
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
