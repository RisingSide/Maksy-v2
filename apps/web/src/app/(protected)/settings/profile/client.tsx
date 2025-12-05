'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Camera, Save, Loader2, User, Shield } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ProfileSettingsClientProps {
  profile: {
    firstName: string
    lastName: string
    phone: string | null
    avatarUrl: string | null
    timeZone: string
    language: string
  } | null
  role: 'owner' | 'admin' | 'team_member'
  email: string
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
]

export function ProfileSettingsClient({
  profile,
  role,
  email,
}: ProfileSettingsClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    phone: profile?.phone || '',
    timeZone: profile?.timeZone || 'America/New_York',
    language: profile?.language || 'en',
  })

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('First name and last name are required')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      toast.success('Profile updated successfully')
      router.refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update profile'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadge = () => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-primary">Owner</Badge>
      case 'admin':
        return <Badge variant="secondary">Admin</Badge>
      default:
        return <Badge variant="outline">Team Member</Badge>
    }
  }

  const initials =
    `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.toUpperCase()

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
            Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your personal information
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="glass-card p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-orange-600 text-white">
                {initials || <User className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              disabled
              title="Avatar upload coming soon"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {/* Basic Info Display */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold">
                {formData.firstName} {formData.lastName}
              </h2>
              {getRoleBadge()}
            </div>
            <p className="text-muted-foreground">{email}</p>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Personal Information
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="John"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">
              Email is managed through your account settings
            </p>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
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
        </div>
      </Card>

      {/* Preferences */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Preferences
        </h3>

        <div className="space-y-4">
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

          <div>
            <Label htmlFor="language">Language</Label>
            <Select
              value={formData.language}
              onValueChange={(value) =>
                setFormData({ ...formData, language: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Link href="/settings">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={isLoading}>
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
    </div>
  )
}
