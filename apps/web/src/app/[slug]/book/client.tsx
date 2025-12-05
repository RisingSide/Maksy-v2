'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { format, addDays, startOfDay, isBefore, isToday } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  durationMinutes: number
  color: string
}

interface Company {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  coverPhotoUrl: string | null
  industry: string | null
  phone: string | null
  email: string | null
  address: {
    line1: string | null
    line2: string | null
    city: string | null
    state: string | null
    zip: string | null
  } | null
  timeZone: string
}

interface BusinessHours {
  [key: string]: {
    open: string
    close: string
    enabled: boolean
  }
}

interface BookingPageClientProps {
  company: Company
  services: Service[]
  businessHours: BusinessHours | null
}

type BookingStep = 'service' | 'datetime' | 'details' | 'confirm'

const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { open: '09:00', close: '17:00', enabled: true },
  tuesday: { open: '09:00', close: '17:00', enabled: true },
  wednesday: { open: '09:00', close: '17:00', enabled: true },
  thursday: { open: '09:00', close: '17:00', enabled: true },
  friday: { open: '09:00', close: '17:00', enabled: true },
  saturday: { open: '09:00', close: '13:00', enabled: false },
  sunday: { open: '09:00', close: '13:00', enabled: false },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins ? `${hours}h ${mins}m` : `${hours}h`
}

export function BookingPageClient({
  company,
  services,
  businessHours,
}: BookingPageClientProps) {
  const [step, setStep] = useState<BookingStep>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)

  // Customer details form
  const [customerDetails, setCustomerDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  })

  const hours = businessHours || DEFAULT_BUSINESS_HOURS

  // Generate available dates (next 30 days)
  const availableDates = useMemo(() => {
    const dates: Date[] = []
    const today = startOfDay(new Date())

    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i)
      const dayName = format(date, 'EEEE').toLowerCase()
      const dayHours = hours[dayName]

      if (dayHours?.enabled) {
        dates.push(date)
      }
    }

    return dates
  }, [hours])

  // Generate available time slots for selected date
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !selectedService) return []

    const dayName = format(selectedDate, 'EEEE').toLowerCase()
    const dayHours = hours[dayName]

    if (!dayHours?.enabled) return []

    const slots: string[] = []
    const [openHour, openMin] = dayHours.open.split(':').map(Number)
    const [closeHour, closeMin] = dayHours.close.split(':').map(Number)

    const openMinutes = openHour * 60 + openMin
    const closeMinutes = closeHour * 60 + closeMin
    const duration = selectedService.durationMinutes

    // Generate 30-minute interval slots
    for (let time = openMinutes; time + duration <= closeMinutes; time += 30) {
      const hour = Math.floor(time / 60)
      const minute = time % 60
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

      // Skip past times for today
      if (isToday(selectedDate)) {
        const now = new Date()
        const slotTime = new Date(selectedDate)
        slotTime.setHours(hour, minute, 0, 0)
        if (isBefore(slotTime, now)) continue
      }

      slots.push(timeString)
    }

    return slots
  }, [selectedDate, selectedService, hours])

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setStep('datetime')
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null) // Reset time when date changes
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep('details')
  }

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return

    // Validate form
    if (!customerDetails.firstName || !customerDetails.lastName) {
      toast.error('Please enter your name')
      return
    }
    if (!customerDetails.email && !customerDetails.phone) {
      toast.error('Please provide email or phone number')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/public/book/${company.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          customer: customerDetails,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to book appointment')
      }

      setBookingComplete(true)
      setStep('confirm')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to book appointment'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Booking complete view
  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container max-w-2xl mx-auto py-12 px-4">
          <Card className="p-8 text-center bg-white/5 backdrop-blur-xl border-white/10">
            <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-slate-300 mb-6">
              Your appointment has been scheduled. You&apos;ll receive a
              confirmation email shortly.
            </p>

            <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Service</span>
                  <span className="text-white font-medium">
                    {selectedService?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date</span>
                  <span className="text-white font-medium">
                    {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time</span>
                  <span className="text-white font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-white font-medium">
                    {selectedService &&
                      formatDuration(selectedService.durationMinutes)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Book Another Appointment
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="relative">
        {company.coverPhotoUrl && (
          <div className="absolute inset-0 h-48 overflow-hidden">
            <Image
              src={company.coverPhotoUrl}
              alt=""
              fill
              className="object-cover opacity-30"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
          </div>
        )}

        <div className="container max-w-4xl mx-auto pt-8 px-4 relative">
          <div className="flex items-center gap-4 mb-6">
            {company.logoUrl ? (
              <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-white/10">
                <Image
                  src={company.logoUrl}
                  alt={company.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{company.name}</h1>
              {company.industry && (
                <p className="text-slate-400">{company.industry}</p>
              )}
            </div>
          </div>

          {/* Contact info */}
          <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-8">
            {company.phone && (
              <a
                href={`tel:${company.phone}`}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <Phone className="h-4 w-4" />
                {company.phone}
              </a>
            )}
            {company.email && (
              <a
                href={`mailto:${company.email}`}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <Mail className="h-4 w-4" />
                {company.email}
              </a>
            )}
            {company.address?.line1 && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {company.address.city}, {company.address.state}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="container max-w-4xl mx-auto px-4 mb-8">
        <div className="flex items-center justify-center gap-2">
          {['service', 'datetime', 'details'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  step === s || ['datetime', 'details'].indexOf(step) > i
                    ? 'bg-primary text-white'
                    : 'bg-white/10 text-slate-400'
                )}
              >
                {i + 1}
              </div>
              {i < 2 && (
                <div
                  className={cn(
                    'w-12 h-0.5 mx-2',
                    ['datetime', 'details'].indexOf(step) > i
                      ? 'bg-primary'
                      : 'bg-white/10'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-8 mt-2 text-sm text-slate-400">
          <span className={step === 'service' ? 'text-white' : ''}>
            Service
          </span>
          <span className={step === 'datetime' ? 'text-white' : ''}>
            Date & Time
          </span>
          <span className={step === 'details' ? 'text-white' : ''}>
            Your Details
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-4 pb-12">
        {/* Step 1: Service Selection */}
        {step === 'service' && (
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <Card
                key={service.id}
                className={cn(
                  'p-6 cursor-pointer transition-all bg-white/5 backdrop-blur-xl border-white/10 hover:border-primary/50 hover:bg-white/10',
                  selectedService?.id === service.id &&
                    'border-primary bg-primary/10'
                )}
                onClick={() => handleServiceSelect(service)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="h-3 w-3 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: service.color }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="text-sm text-slate-400 mb-3">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <Badge
                        variant="secondary"
                        className="bg-white/10 text-white"
                      >
                        {formatCurrency(service.price)}
                      </Badge>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(service.durationMinutes)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {services.length === 0 && (
              <Card className="col-span-2 p-12 text-center bg-white/5 backdrop-blur-xl border-white/10">
                <p className="text-slate-400">
                  No services available for booking at this time.
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {step === 'datetime' && selectedService && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Date Selection */}
            <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Select Date
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {availableDates.slice(0, 21).map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateSelect(date)}
                    className={cn(
                      'p-2 rounded-lg text-center transition-colors',
                      selectedDate?.toDateString() === date.toDateString()
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    )}
                  >
                    <div className="text-xs opacity-70">
                      {format(date, 'EEE')}
                    </div>
                    <div className="font-medium">{format(date, 'd')}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Time Selection */}
            <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Select Time
              </h3>
              {selectedDate ? (
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {availableTimeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className={cn(
                        'p-3 rounded-lg text-center transition-colors',
                        selectedTime === time
                          ? 'bg-primary text-white'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      )}
                    >
                      {time}
                    </button>
                  ))}
                  {availableTimeSlots.length === 0 && (
                    <p className="col-span-3 text-slate-400 text-center py-4">
                      No available times for this date
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">
                  Please select a date first
                </p>
              )}
            </Card>

            {/* Back button */}
            <div className="md:col-span-2">
              <Button
                variant="ghost"
                onClick={() => setStep('service')}
                className="text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Services
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Customer Details */}
        {step === 'details' &&
          selectedService &&
          selectedDate &&
          selectedTime && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Form */}
              <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10">
                <h3 className="font-semibold text-white mb-4">Your Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-slate-300">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        value={customerDetails.firstName}
                        onChange={(e) =>
                          setCustomerDetails({
                            ...customerDetails,
                            firstName: e.target.value,
                          })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-slate-300">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        value={customerDetails.lastName}
                        onChange={(e) =>
                          setCustomerDetails({
                            ...customerDetails,
                            lastName: e.target.value,
                          })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-slate-300">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) =>
                        setCustomerDetails({
                          ...customerDetails,
                          email: e.target.value,
                        })
                      }
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-slate-300">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerDetails.phone}
                      onChange={(e) =>
                        setCustomerDetails({
                          ...customerDetails,
                          phone: e.target.value,
                        })
                      }
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes" className="text-slate-300">
                      Notes (optional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={customerDetails.notes}
                      onChange={(e) =>
                        setCustomerDetails({
                          ...customerDetails,
                          notes: e.target.value,
                        })
                      }
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Any special requests or notes..."
                      rows={3}
                    />
                  </div>
                </div>
              </Card>

              {/* Summary */}
              <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10 h-fit">
                <h3 className="font-semibold text-white mb-4">
                  Booking Summary
                </h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service</span>
                    <span className="text-white font-medium">
                      {selectedService.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date</span>
                    <span className="text-white font-medium">
                      {format(selectedDate, 'EEEE, MMMM d')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Time</span>
                    <span className="text-white font-medium">
                      {selectedTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-white font-medium">
                      {formatDuration(selectedService.durationMinutes)}
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between">
                    <span className="text-slate-400">Total</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(selectedService.price)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              </Card>

              {/* Back button */}
              <div className="md:col-span-2">
                <Button
                  variant="ghost"
                  onClick={() => setStep('datetime')}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Date & Time
                </Button>
              </div>
            </div>
          )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-6">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            Powered by{' '}
            <Link href="/" className="text-primary hover:underline">
              Maksy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
