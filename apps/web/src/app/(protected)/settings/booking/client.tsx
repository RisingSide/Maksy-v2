'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Globe,
  Clock,
  Palette,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Calendar,
  Settings2,
} from 'lucide-react'
import { toast } from 'sonner'

interface BusinessHours {
  [key: string]: {
    open: string
    close: string
    enabled: boolean
  }
}

interface BookingSettings {
  bookingLeadTimeHours: number
  bookingSlotSizeMinutes: number
  schedulingWindowDays: number
  cancellationHoursBefore: number
  enableDoubleBooking: boolean
  bookingPagePrimaryColor: string
  bookingPageButtonColor: string
  removeMaksyBranding: boolean
  businessHours: BusinessHours
}

interface BookingSettingsClientProps {
  companySlug: string
  companyName: string
  settings: BookingSettings
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? '00' : '30'
  return `${hour.toString().padStart(2, '0')}:${minute}`
})

export function BookingSettingsClient({
  companySlug,
  companyName,
  settings: initialSettings,
}: BookingSettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const bookingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${companySlug}/book`

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    toast.success('Booking link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/company/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingLeadTimeHours: settings.bookingLeadTimeHours,
          bookingSlotSizeMinutes: settings.bookingSlotSizeMinutes,
          schedulingWindowDays: settings.schedulingWindowDays,
          cancellationHoursBefore: settings.cancellationHoursBefore,
          enableDoubleBooking: settings.enableDoubleBooking,
          bookingPagePrimaryColor: settings.bookingPagePrimaryColor,
          bookingPageButtonColor: settings.bookingPageButtonColor,
          removeMaksyBranding: settings.removeMaksyBranding,
          businessHours: settings.businessHours,
        }),
      })

      if (!response.ok) throw new Error('Failed to save settings')

      toast.success('Booking settings saved!')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const updateBusinessHours = (
    day: string,
    field: 'open' | 'close' | 'enabled',
    value: string | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value,
        },
      },
    }))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Booking Page
          </h1>
          <p className="text-muted-foreground">
            Customize your public booking page for customers
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

      {/* Booking URL */}
      <Card className="glass-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Your Booking Link</h2>
            <p className="text-sm text-muted-foreground">
              Share this link with customers to let them book appointments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
          <code className="flex-1 text-sm truncate">{bookingUrl}</code>
          <Button variant="ghost" size="sm" onClick={handleCopyUrl}>
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="hours" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Business Hours
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduling
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Business Hours Tab */}
        <TabsContent value="hours">
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Business Hours
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Set your available hours for each day. Customers can only book
              during these times.
            </p>

            <div className="space-y-4">
              {DAYS.map((day) => (
                <div
                  key={day.key}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-28">
                    <span className="font-medium">{day.label}</span>
                  </div>
                  <Switch
                    checked={settings.businessHours[day.key]?.enabled}
                    onCheckedChange={(checked) =>
                      updateBusinessHours(day.key, 'enabled', checked)
                    }
                  />
                  {settings.businessHours[day.key]?.enabled ? (
                    <>
                      <Select
                        value={settings.businessHours[day.key]?.open}
                        onValueChange={(value) =>
                          updateBusinessHours(day.key, 'open', value)
                        }
                      >
                        <SelectTrigger className="w-28">
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
                      <span className="text-muted-foreground">to</span>
                      <Select
                        value={settings.businessHours[day.key]?.close}
                        onValueChange={(value) =>
                          updateBusinessHours(day.key, 'close', value)
                        }
                      >
                        <SelectTrigger className="w-28">
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
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Closed
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Scheduling Tab */}
        <TabsContent value="scheduling">
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Scheduling Rules
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label>Minimum Lead Time</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  How far in advance must customers book?
                </p>
                <Select
                  value={settings.bookingLeadTimeHours.toString()}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      bookingLeadTimeHours: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Time Slot Duration</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Interval between available time slots
                </p>
                <Select
                  value={settings.bookingSlotSizeMinutes.toString()}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      bookingSlotSizeMinutes: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Scheduling Window</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  How far ahead can customers book?
                </p>
                <Select
                  value={settings.schedulingWindowDays.toString()}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      schedulingWindowDays: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cancellation Policy</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Minimum notice for cancellations
                </p>
                <Select
                  value={settings.cancellationHoursBefore.toString()}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      cancellationHoursBefore: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Double Booking</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow multiple bookings at the same time
                  </p>
                </div>
                <Switch
                  checked={settings.enableDoubleBooking}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      enableDoubleBooking: checked,
                    }))
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Branding & Colors
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label>Primary Color</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Main accent color for your booking page
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.bookingPagePrimaryColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        bookingPagePrimaryColor: e.target.value,
                      }))
                    }
                    className="h-10 w-20 rounded cursor-pointer"
                  />
                  <Input
                    value={settings.bookingPagePrimaryColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        bookingPagePrimaryColor: e.target.value,
                      }))
                    }
                    className="w-28 font-mono"
                  />
                </div>
              </div>

              <div>
                <Label>Button Color</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Color for buttons and CTAs
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.bookingPageButtonColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        bookingPageButtonColor: e.target.value,
                      }))
                    }
                    className="h-10 w-20 rounded cursor-pointer"
                  />
                  <Input
                    value={settings.bookingPageButtonColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        bookingPageButtonColor: e.target.value,
                      }))
                    }
                    className="w-28 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Label>Remove Maksy Branding</Label>
                    <Badge variant="secondary">Scale</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Hide &quot;Powered by Maksy&quot; from your booking page
                  </p>
                </div>
                <Switch
                  checked={settings.removeMaksyBranding}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      removeMaksyBranding: checked,
                    }))
                  }
                />
              </div>
            </div>
          </Card>

          {/* Preview Card */}
          <Card className="glass-card p-6 mt-6">
            <h3 className="font-semibold mb-4">Preview</h3>
            <div
              className="rounded-lg p-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${settings.bookingPagePrimaryColor}, ${settings.bookingPageButtonColor})`,
              }}
            >
              <h4 className="text-xl font-bold mb-2">{companyName}</h4>
              <p className="text-white/80 mb-4">Book your appointment online</p>
              <button
                className="px-6 py-2 rounded-lg font-medium"
                style={{ backgroundColor: settings.bookingPageButtonColor }}
              >
                Book Now
              </button>
              {!settings.removeMaksyBranding && (
                <p className="text-xs text-white/50 mt-4">Powered by Maksy</p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
