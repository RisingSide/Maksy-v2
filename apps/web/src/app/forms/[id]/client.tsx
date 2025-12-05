'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, CheckCircle2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required?: boolean
  options?: string[]
}

interface PublicFormClientProps {
  form: {
    id: string
    formTitle: string
    formDescription: string | null
    submitButtonText: string
    successMessage: string | null
    redirectUrl: string | null
    fieldsConfig: FormField[]
  }
  company: {
    name: string
    logoUrl: string | null
  }
}

export function PublicFormClient({ form, company }: PublicFormClientProps) {
  const [formData, setFormData] = useState<Record<string, string | boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (fieldId: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    for (const field of form.fieldsConfig) {
      if (field.required && !formData[field.id]) {
        toast.error(`${field.label} is required`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/forms/${form.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formData }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit form')
      }

      setIsSubmitted(true)

      // Redirect if URL is set
      if (form.redirectUrl) {
        setTimeout(() => {
          window.location.href = form.redirectUrl!
        }, 2000)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit form'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <Input
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder}
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
          />
        )

      case 'date':
        return (
          <Input
            type="date"
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
          />
        )

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            rows={4}
          />
        )

      case 'dropdown':
        return (
          <Select
            value={(formData[field.id] as string) || ''}
            onValueChange={(value) => handleChange(field.id, value)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={field.placeholder || 'Select an option'}
              />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.id}
              checked={(formData[field.id] as boolean) || false}
              onCheckedChange={(checked) =>
                handleChange(field.id, checked as boolean)
              }
            />
            <label htmlFor={field.id} className="text-sm cursor-pointer">
              {field.placeholder || field.label}
            </label>
          </div>
        )

      default:
        return (
          <Input
            placeholder={field.placeholder}
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
          />
        )
    }
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/5 backdrop-blur-xl border-white/10">
          <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Thank You!</h1>
          <p className="text-slate-300">
            {form.successMessage || 'Your submission has been received.'}
          </p>
          {form.redirectUrl && (
            <p className="text-sm text-slate-400 mt-4">
              Redirecting you shortly...
            </p>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 bg-white/5 backdrop-blur-xl border-white/10">
        {/* Header */}
        <div className="text-center mb-8">
          {company.logoUrl ? (
            <div className="relative h-12 w-12 rounded-xl overflow-hidden mx-auto mb-4">
              <Image
                src={company.logoUrl}
                alt={company.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">{form.formTitle}</h1>
          {form.formDescription && (
            <p className="text-slate-400 mt-2">{form.formDescription}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.fieldsConfig.map((field) => (
            <div key={field.id}>
              {field.type !== 'checkbox' && (
                <Label className="text-slate-300 mb-2 block">
                  {field.label}
                  {field.required && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                </Label>
              )}
              {renderField(field)}
            </div>
          ))}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              form.submitButtonText
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-sm text-slate-500">
            Powered by{' '}
            <Link href="/" className="text-primary hover:underline">
              Maksy
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
