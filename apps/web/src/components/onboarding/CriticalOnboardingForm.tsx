'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const INDUSTRIES = [
  'HVAC',
  'Plumbing',
  'Landscaping',
  'Construction',
  'Auto Detailing',
  'Carpet Cleaning',
  'Pressure Washing',
  'Electrical',
  'Pool Service',
  'Roofing',
  'Painting',
  'Handyman',
  'Other',
]

interface FormData {
  companyName: string
  industry: string
  businessPhone: string
  businessAddress: {
    street: string
    city: string
    state: string
    zip: string
  }
  slug: string
  website: string
}

export function CriticalOnboardingForm() {
  const router = useRouter()
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)

  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    industry: '',
    businessPhone: '',
    businessAddress: {
      street: '',
      city: '',
      state: '',
      zip: '',
    },
    slug: '',
    website: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  )

  // Auto-generate slug from company name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Check slug availability
  const checkSlug = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null)
      return
    }

    setIsCheckingSlug(true)
    try {
      const response = await fetch(
        `/api/slugs/check?slug=${encodeURIComponent(slug)}`
      )
      const data = await response.json()
      setSlugAvailable(data.available)

      if (!data.available && data.suggestion) {
        setFormData((prev) => ({ ...prev, slug: data.suggestion }))
      }
    } catch (error) {
      console.error('Error checking slug:', error)
    } finally {
      setIsCheckingSlug(false)
    }
  }

  // Handle company name blur - generate slug
  const handleCompanyNameBlur = () => {
    if (formData.companyName && !formData.slug) {
      const generatedSlug = generateSlug(formData.companyName)
      setFormData((prev) => ({ ...prev, slug: generatedSlug }))
      checkSlug(generatedSlug)
    }
  }

  // Handle slug change
  const handleSlugChange = (slug: string) => {
    const cleanSlug = generateSlug(slug)
    setFormData((prev) => ({ ...prev, slug: cleanSlug }))
  }

  // Debounced slug check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.slug) {
        checkSlug(formData.slug)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.slug])

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.companyName)
      newErrors.companyName = 'Company name is required'
    if (!formData.industry) newErrors.industry = 'Industry is required'
    if (!formData.businessPhone)
      newErrors.businessPhone = 'Business phone is required'
    if (!formData.businessAddress.street)
      newErrors.businessAddress = 'Address is required'
    if (!formData.slug) newErrors.slug = 'Custom URL is required'
    if (slugAvailable === false) newErrors.slug = 'This URL is already taken'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/onboarding/complete-critical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      toast.success("Welcome to Maksy! Let's get started 🎉")
      router.push('/dashboard')
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="gradient-bg">
        <div className="gradient-orb gradient-orb-1"></div>
        <div className="gradient-orb gradient-orb-2"></div>
        <div className="gradient-orb gradient-orb-3"></div>
      </div>

      <div className="glass-card p-8 max-w-2xl w-full relative z-10 animate-fade-in">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">👋 Welcome to Maksy!</h1>
          <p className="text-muted-foreground">
            Let&apos;s get your business set up (takes about 60 seconds)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Business Information</h2>

            <FormField
              label="Company Name"
              name="companyName"
              placeholder="ABC Plumbing"
              required
              value={formData.companyName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  companyName: e.target.value,
                }))
              }
              onBlur={handleCompanyNameBlur}
              error={errors.companyName}
              className="mb-4"
            />

            <div className="mb-4">
              <Label htmlFor="industry">
                Industry <span className="text-destructive ml-1">*</span>
              </Label>
              <Select
                value={formData.industry}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, industry: value }))
                }
              >
                <SelectTrigger
                  className={errors.industry ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry.toLowerCase()}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.industry && (
                <p className="text-sm text-destructive mt-1">
                  ⚠ {errors.industry}
                </p>
              )}
            </div>

            <FormField
              label="Business Phone"
              name="businessPhone"
              type="tel"
              placeholder="(555) 123-4567"
              required
              value={formData.businessPhone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  businessPhone: e.target.value,
                }))
              }
              error={errors.businessPhone}
              className="mb-4"
            />

            <FormField
              label="Business Address"
              name="businessAddress"
              placeholder="123 Main St, City, State ZIP"
              required
              value={formData.businessAddress.street}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  businessAddress: {
                    ...prev.businessAddress,
                    street: e.target.value,
                  },
                }))
              }
              error={errors.businessAddress}
              className="mb-4"
            />
          </div>

          {/* Booking Page */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Booking Page</h2>

            <div className="mb-4">
              <Label htmlFor="slug">
                Your Custom URL <span className="text-destructive ml-1">*</span>
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-muted-foreground text-sm">maksy.ai/</span>
                <input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={`flex-1 h-9 rounded-md border bg-transparent px-3 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] ${
                    errors.slug ? 'border-destructive' : ''
                  }`}
                  placeholder="your-business-name"
                />
                {isCheckingSlug && <Loader2 className="h-4 w-4 animate-spin" />}
                {slugAvailable === true && (
                  <span className="text-green-500 text-sm">✓ Available</span>
                )}
                {slugAvailable === false && (
                  <span className="text-destructive text-sm">✗ Taken</span>
                )}
              </div>
              {errors.slug && (
                <p className="text-sm text-destructive mt-1">
                  ⚠ {errors.slug}
                </p>
              )}
              {slugAvailable === true && (
                <p className="text-sm text-muted-foreground mt-1">
                  Your booking page will be at:{' '}
                  <strong>maksy.ai/{formData.slug}</strong>
                </p>
              )}
            </div>

            <FormField
              label="Website (optional)"
              name="website"
              type="url"
              placeholder="https://your-website.com"
              value={formData.website}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, website: e.target.value }))
              }
            />
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={
                isSubmitting || isCheckingSlug || slugAvailable === false
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Complete Setup & Enter Dashboard →'
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
