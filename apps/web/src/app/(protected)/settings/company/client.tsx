'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Save,
  Loader2,
  Link as LinkIcon,
  Image,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface CompanySettingsClientProps {
  company: {
    id: string
    name: string
    slug: string
    industry: string | null
    timeZone: string
    phone: string | null
    email: string | null
    website: string | null
    address: {
      line1: string | null
      line2: string | null
      city: string | null
      state: string | null
      zip: string | null
      country: string
    }
    logoUrl: string | null
    coverPhotoUrl: string | null
    googleReviewLink: string | null
    facebookUrl: string | null
    instagramUrl: string | null
    twitterUrl: string | null
  }
  isOwner: boolean
}

const INDUSTRIES = [
  'Cleaning Services',
  'Landscaping',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Pest Control',
  'Pool Services',
  'Handyman',
  'Moving Services',
  'Painting',
  'Roofing',
  'Auto Detailing',
  'Pet Services',
  'Home Inspection',
  'Other',
]

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
]

const US_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
]

export function CompanySettingsClient({
  company,
  isOwner,
}: CompanySettingsClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: company.name,
    slug: company.slug,
    industry: company.industry || '',
    timeZone: company.timeZone,
    phone: company.phone || '',
    email: company.email || '',
    website: company.website || '',
    addressLine1: company.address.line1 || '',
    addressLine2: company.address.line2 || '',
    city: company.address.city || '',
    state: company.address.state || '',
    zip: company.address.zip || '',
    googleReviewLink: company.googleReviewLink || '',
    facebookUrl: company.facebookUrl || '',
    instagramUrl: company.instagramUrl || '',
    twitterUrl: company.twitterUrl || '',
  })

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Company name is required')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.name,
          industry: formData.industry || null,
          timeZone: formData.timeZone,
          businessPhone: formData.phone || null,
          businessEmail: formData.email || null,
          websiteUrl: formData.website || null,
          addressLine1: formData.addressLine1 || null,
          addressLine2: formData.addressLine2 || null,
          city: formData.city || null,
          state: formData.state || null,
          zipCode: formData.zip || null,
          googleReviewLink: formData.googleReviewLink || null,
          facebookUrl: formData.facebookUrl || null,
          instagramUrl: formData.instagramUrl || null,
          twitterUrl: formData.twitterUrl || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update company')
      }

      toast.success('Company settings updated')
      router.refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update company'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const bookingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${company.slug}/book`

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Company Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your business information
          </p>
        </div>
      </div>

      {/* Booking Page Link */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Your Public Booking Page</p>
              <p className="text-sm text-muted-foreground">{bookingUrl}</p>
            </div>
          </div>
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-1" />
              Preview
            </Button>
          </a>
        </div>
      </Card>

      {/* Basic Information */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Basic Information
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Acme Services"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="slug">Booking URL Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Contact support to change your URL
              </p>
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) =>
                  setFormData({ ...formData, industry: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="timeZone">Time Zone</Label>
            <Select
              value={formData.timeZone}
              onValueChange={(value) =>
                setFormData({ ...formData, timeZone: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time zone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          Contact Information
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Business Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="email">Business Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="contact@acme.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              placeholder="https://www.acme.com"
            />
          </div>
        </div>
      </Card>

      {/* Address */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Business Address
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="addressLine1">Street Address</Label>
            <Input
              id="addressLine1"
              value={formData.addressLine1}
              onChange={(e) =>
                setFormData({ ...formData, addressLine1: e.target.value })
              }
              placeholder="123 Main St"
            />
          </div>

          <div>
            <Label htmlFor="addressLine2">Suite / Unit (optional)</Label>
            <Input
              id="addressLine2"
              value={formData.addressLine2}
              onChange={(e) =>
                setFormData({ ...formData, addressLine2: e.target.value })
              }
              placeholder="Suite 100"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="New York"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Select
                value={formData.state}
                onValueChange={(value) =>
                  setFormData({ ...formData, state: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) =>
                  setFormData({ ...formData, zip: e.target.value })
                }
                placeholder="10001"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Social Links */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          Social & Review Links
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="googleReviewLink">Google Review Link</Label>
            <Input
              id="googleReviewLink"
              type="url"
              value={formData.googleReviewLink}
              onChange={(e) =>
                setFormData({ ...formData, googleReviewLink: e.target.value })
              }
              placeholder="https://g.page/..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used for requesting reviews after job completion
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="facebookUrl">Facebook</Label>
              <Input
                id="facebookUrl"
                type="url"
                value={formData.facebookUrl}
                onChange={(e) =>
                  setFormData({ ...formData, facebookUrl: e.target.value })
                }
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input
                id="instagramUrl"
                type="url"
                value={formData.instagramUrl}
                onChange={(e) =>
                  setFormData({ ...formData, instagramUrl: e.target.value })
                }
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Link href="/settings">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={isLoading || !isOwner}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {!isOwner && (
        <p className="text-sm text-muted-foreground text-center">
          Only the company owner can edit these settings
        </p>
      )}
    </div>
  )
}
