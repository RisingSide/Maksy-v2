'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bell,
  Mail,
  MessageSquare,
  Moon,
  Loader2,
  Calendar,
  CreditCard,
  FileText,
  Users,
  BarChart3,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'

interface NotificationPreferences {
  emailNewBooking: boolean
  emailJobReminder: boolean
  emailPaymentReceived: boolean
  emailInvoiceOverdue: boolean
  emailEstimateApproved: boolean
  emailTeamInvite: boolean
  emailWeeklyReport: boolean
  smsNewBooking: boolean
  smsJobReminder: boolean
  smsPaymentReceived: boolean
  pushEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

interface NotificationsSettingsClientProps {
  preferences: NotificationPreferences
  planType: string
}

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return `${hour}:00`
})

export function NotificationsSettingsClient({
  preferences: initialPreferences,
  planType,
}: NotificationsSettingsClientProps) {
  const [preferences, setPreferences] = useState(initialPreferences)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // In a real implementation, this would save to the database
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('Notification preferences saved!')
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const updatePreference = (
    key: keyof NotificationPreferences,
    value: boolean | string
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const NotificationRow = ({
    icon: Icon,
    title,
    description,
    emailKey,
    smsKey,
    smsBadge,
  }: {
    icon: React.ElementType
    title: string
    description: string
    emailKey: keyof NotificationPreferences
    smsKey?: keyof NotificationPreferences
    smsBadge?: string
  }) => (
    <div className="flex items-center justify-between py-4 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <Switch
            checked={preferences[emailKey] as boolean}
            onCheckedChange={(checked) => updatePreference(emailKey, checked)}
          />
        </div>
        {smsKey && (
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            {smsBadge ? (
              <div className="flex items-center gap-1">
                <Switch
                  checked={preferences[smsKey] as boolean}
                  onCheckedChange={(checked) =>
                    updatePreference(smsKey, checked)
                  }
                  disabled={planType === 'pro'}
                />
                <Badge variant="secondary" className="text-xs">
                  {smsBadge}
                </Badge>
              </div>
            ) : (
              <Switch
                checked={preferences[smsKey] as boolean}
                onCheckedChange={(checked) => updatePreference(smsKey, checked)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Choose how you want to be notified about activity
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {/* Header Legend */}
      <div className="flex items-center justify-end gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <span>Email</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>SMS</span>
        </div>
      </div>

      {/* Booking & Jobs */}
      <Card className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Bookings & Jobs
        </h3>
        <div className="divide-y">
          <NotificationRow
            icon={Calendar}
            title="New Booking"
            description="When a customer books an appointment"
            emailKey="emailNewBooking"
            smsKey="smsNewBooking"
            smsBadge="Pro"
          />
          <NotificationRow
            icon={Clock}
            title="Job Reminder"
            description="Reminders before scheduled jobs"
            emailKey="emailJobReminder"
            smsKey="smsJobReminder"
          />
        </div>
      </Card>

      {/* Payments */}
      <Card className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Payments
        </h3>
        <div className="divide-y">
          <NotificationRow
            icon={CreditCard}
            title="Payment Received"
            description="When a customer pays an invoice"
            emailKey="emailPaymentReceived"
            smsKey="smsPaymentReceived"
            smsBadge="Pro"
          />
          <NotificationRow
            icon={FileText}
            title="Invoice Overdue"
            description="When an invoice becomes overdue"
            emailKey="emailInvoiceOverdue"
          />
        </div>
      </Card>

      {/* Documents */}
      <Card className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Documents
        </h3>
        <div className="divide-y">
          <NotificationRow
            icon={FileText}
            title="Estimate Approved"
            description="When a customer approves an estimate"
            emailKey="emailEstimateApproved"
          />
        </div>
      </Card>

      {/* Team */}
      <Card className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Team
        </h3>
        <div className="divide-y">
          <NotificationRow
            icon={Users}
            title="Team Invite"
            description="When you're invited to a team"
            emailKey="emailTeamInvite"
          />
        </div>
      </Card>

      {/* Reports */}
      <Card className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Reports
        </h3>
        <div className="divide-y">
          <NotificationRow
            icon={BarChart3}
            title="Weekly Report"
            description="Weekly summary of your business activity"
            emailKey="emailWeeklyReport"
          />
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Quiet Hours</h3>
          </div>
          <Switch
            checked={preferences.quietHoursEnabled}
            onCheckedChange={(checked) =>
              updatePreference('quietHoursEnabled', checked)
            }
          />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Pause non-urgent notifications during specific hours
        </p>

        {preferences.quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label>Start Time</Label>
              <Select
                value={preferences.quietHoursStart}
                onValueChange={(value) =>
                  updatePreference('quietHoursStart', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>End Time</Label>
              <Select
                value={preferences.quietHoursEnd}
                onValueChange={(value) =>
                  updatePreference('quietHoursEnd', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
