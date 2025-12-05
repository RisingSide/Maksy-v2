'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  FileText,
  Plus,
  ExternalLink,
  Copy,
  Trash2,
  Loader2,
  Check,
  Eye,
  Inbox,
  Code,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Form {
  id: string
  formName: string
  formTitle: string
  formDescription: string | null
  isActive: boolean
  createdAt: string
  submissionCount: number
}

interface FormsSettingsClientProps {
  forms: Form[]
  planType: string
}

export function FormsSettingsClient({
  forms: initialForms,
  planType,
}: FormsSettingsClientProps) {
  const [forms, setForms] = useState(initialForms)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [embedDialogOpen, setEmbedDialogOpen] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    formName: '',
    formTitle: '',
    formDescription: '',
  })

  // Check form limits based on plan
  const formLimit = planType === 'scale' ? Infinity : 1
  const canCreateForm = forms.length < formLimit

  const handleCreateForm = async () => {
    if (!formData.formName || !formData.formTitle) {
      toast.error('Please fill in required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formName: formData.formName,
          formTitle: formData.formTitle,
          formDescription: formData.formDescription || null,
          fieldsConfig: [
            { id: 'name', type: 'text', label: 'Name', required: true },
            { id: 'email', type: 'email', label: 'Email', required: true },
            {
              id: 'message',
              type: 'textarea',
              label: 'Message',
              required: false,
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create form')
      }

      const data = await response.json()
      setForms((prev) => [data.form, ...prev])
      toast.success('Form created!')
      setIsDialogOpen(false)
      setFormData({ formName: '', formTitle: '', formDescription: '' })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create form'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (form: Form) => {
    try {
      const response = await fetch(`/api/forms/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !form.isActive }),
      })

      if (!response.ok) throw new Error('Failed to update form')

      setForms((prev) =>
        prev.map((f) =>
          f.id === form.id ? { ...f, isActive: !f.isActive } : f
        )
      )
      toast.success(`Form ${form.isActive ? 'deactivated' : 'activated'}!`)
    } catch (error) {
      toast.error('Failed to update form')
    }
  }

  const handleDelete = async (formId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this form? All submissions will be lost.'
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete form')

      setForms((prev) => prev.filter((f) => f.id !== formId))
      toast.success('Form deleted!')
    } catch (error) {
      toast.error('Failed to delete form')
    }
  }

  const getFormUrl = (formId: string) => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/forms/${formId}`
  }

  const getEmbedCode = (formId: string) => {
    const url = getFormUrl(formId)
    return `<iframe src="${url}" width="100%" height="500" frameborder="0"></iframe>`
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Custom Forms
          </h1>
          <p className="text-muted-foreground">
            Create forms to capture leads and customer information
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canCreateForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Internal Name *</Label>
                <Input
                  value={formData.formName}
                  onChange={(e) =>
                    setFormData({ ...formData, formName: e.target.value })
                  }
                  placeholder="e.g., Contact Form"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For your reference only
                </p>
              </div>

              <div>
                <Label>Form Title *</Label>
                <Input
                  value={formData.formTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, formTitle: e.target.value })
                  }
                  placeholder="e.g., Get in Touch"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Displayed to visitors
                </p>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.formDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      formDescription: e.target.value,
                    })
                  }
                  placeholder="Tell visitors what this form is for..."
                  rows={3}
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
                  onClick={handleCreateForm}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Form'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plan limit info */}
      {planType !== 'scale' && (
        <Card className="glass-card p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <strong>Pro Plan:</strong> {forms.length}/{formLimit} form used.
              Upgrade to Scale for unlimited forms.
            </p>
            <Link href="/settings/billing">
              <Button variant="outline" size="sm">
                Upgrade
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Forms List */}
      {forms.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first form to start capturing leads
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            disabled={!canCreateForm}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Form
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <Card key={form.id} className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'h-12 w-12 rounded-xl flex items-center justify-center',
                      form.isActive
                        ? 'bg-gradient-to-br from-primary to-orange-600'
                        : 'bg-muted'
                    )}
                  >
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{form.formName}</h3>
                      <Badge variant={form.isActive ? 'default' : 'secondary'}>
                        {form.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {form.formTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Submission count */}
                  <div className="text-right">
                    <p className="text-2xl font-bold">{form.submissionCount}</p>
                    <p className="text-sm text-muted-foreground">submissions</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={() => handleToggleActive(form)}
                    />

                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={getFormUrl(form.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>

                    <Link href={`/settings/forms/${form.id}/submissions`}>
                      <Button variant="ghost" size="icon">
                        <Inbox className="h-4 w-4" />
                      </Button>
                    </Link>

                    <Dialog
                      open={embedDialogOpen === form.id}
                      onOpenChange={(open) =>
                        setEmbedDialogOpen(open ? form.id : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Code className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Embed Form</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label>Direct Link</Label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                value={getFormUrl(form.id)}
                                readOnly
                                className="font-mono text-sm"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  copyToClipboard(getFormUrl(form.id))
                                }
                              >
                                {copied ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label>Embed Code</Label>
                            <div className="mt-1">
                              <Textarea
                                value={getEmbedCode(form.id)}
                                readOnly
                                className="font-mono text-sm"
                                rows={3}
                              />
                              <Button
                                variant="outline"
                                className="w-full mt-2"
                                onClick={() =>
                                  copyToClipboard(getEmbedCode(form.id))
                                }
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Embed Code
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Link href={`/settings/forms/${form.id}`}>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(form.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Created {format(new Date(form.createdAt), 'MMM d, yyyy')}
                </span>
                <a
                  href={getFormUrl(form.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Form
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
