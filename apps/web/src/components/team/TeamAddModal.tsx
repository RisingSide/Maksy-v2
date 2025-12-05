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
import { Loader2, Copy, Check, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface TeamAddModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function TeamAddModal({
  open,
  onOpenChange,
  onSuccess,
}: TeamAddModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [createdMember, setCreatedMember] = useState<{
    email: string
    password: string
    name: string
  } | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'team_member' as 'admin' | 'team_member',
    password: generatePassword(),
    hourlyRate: '',
    commissionRate: '',
  })

  const regeneratePassword = () => {
    setFormData({ ...formData, password: generatePassword() })
  }

  const copyCredentials = async () => {
    if (!createdMember) return

    const text = `Email: ${createdMember.email}\nPassword: ${createdMember.password}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Credentials copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/team/create-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          role: formData.role,
          password: formData.password,
          hourlyRate: formData.hourlyRate
            ? parseFloat(formData.hourlyRate)
            : undefined,
          commissionRate: formData.commissionRate
            ? parseFloat(formData.commissionRate)
            : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add team member')
      }

      // Show success with credentials
      setCreatedMember({
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`,
      })

      toast.success(`${formData.firstName} has been added to your team!`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add team member'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (createdMember) {
      onSuccess()
    }
    // Reset form
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'team_member',
      password: generatePassword(),
      hourlyRate: '',
      commissionRate: '',
    })
    setCreatedMember(null)
    setCopied(false)
    onOpenChange(false)
  }

  // Success view with credentials
  if (createdMember) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-green-600">
              Team Member Added! ✓
            </DialogTitle>
            <DialogDescription>
              {createdMember.name} has been added to your team. Share these
              login credentials with them.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="font-mono text-sm">{createdMember.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Temporary Password
              </Label>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm flex-1">
                  {showPassword ? createdMember.password : '••••••••••••'}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> The team member should change their
              password after first login.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={copyCredentials}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Credentials
                </>
              )}
            </Button>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Create a new team member account directly. You&apos;ll receive
              login credentials to share with them.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="colleague@company.com"
                required
              />
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
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

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={regeneratePassword}
                  title="Generate new password"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-generated secure password. They should change it after
                first login.
              </p>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'team_member') =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_member">Team Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.role === 'admin'
                  ? 'Admins can manage team members and company settings'
                  : 'Team members can view and complete assigned tasks'}
              </p>
            </div>

            {/* Pay Rates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourlyRate: e.target.value })
                  }
                  placeholder="25.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissionRate">Commission (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.commissionRate}
                  onChange={(e) =>
                    setFormData({ ...formData, commissionRate: e.target.value })
                  }
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Team Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
