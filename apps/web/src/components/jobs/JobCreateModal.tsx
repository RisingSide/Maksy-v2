'use client'

import { useState, useMemo } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Loader2,
  CalendarIcon,
  Clock,
  Check,
  ChevronsUpDown,
  User,
  Wrench,
  Users,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useJobMutations } from '@/hooks/use-jobs'
import { useCustomers } from '@/hooks/use-customers'
import { useServices } from '@/hooks/use-services'
import { useTeam } from '@/hooks/use-team'

interface ServiceAddOn {
  id: string
  name: string
  price: number
  durationMinutes: number
}

interface JobCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const TIME_SLOTS = [
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
]

export function JobCreateModal({
  open,
  onOpenChange,
  onSuccess,
}: JobCreateModalProps) {
  const { createJob, isLoading } = useJobMutations()
  const { customers = [] } = useCustomers({ limit: 100 })
  const { services = [] } = useServices({ limit: 100 })
  const { teamMembers = [] } = useTeam()

  // Popover states
  const [customerOpen, setCustomerOpen] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)
  const [teamMemberOpen, setTeamMemberOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarStep, setCalendarStep] = useState<'date' | 'time'>('date')

  // Form data
  const [formData, setFormData] = useState({
    customerId: '',
    serviceId: '',
    assignedTeamMemberId: '',
    scheduledDate: undefined as Date | undefined,
    scheduledTime: '09:00',
    durationMinutes: '60',
    totalPrice: '',
    notes: '',
  })

  // Selected add-ons
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [serviceAddOns, setServiceAddOns] = useState<ServiceAddOn[]>([])

  // Search states
  const [customerSearch, setCustomerSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [teamSearch, setTeamSearch] = useState('')

  // Get selected entities for display
  const selectedCustomer = customers.find((c) => c.id === formData.customerId)
  const selectedService = services.find((s) => s.id === formData.serviceId)
  const selectedTeamMember = teamMembers.find(
    (m) => m.id === formData.assignedTeamMemberId
  )

  // Filter lists based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers
    const search = customerSearch.toLowerCase()
    return customers.filter(
      (c) =>
        c.firstName?.toLowerCase().includes(search) ||
        c.lastName?.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.phone?.includes(search)
    )
  }, [customers, customerSearch])

  const filteredServices = useMemo(() => {
    if (!serviceSearch) return services
    const search = serviceSearch.toLowerCase()
    return services.filter(
      (s) =>
        s.name?.toLowerCase().includes(search) ||
        s.description?.toLowerCase().includes(search)
    )
  }, [services, serviceSearch])

  const filteredTeamMembers = useMemo(() => {
    if (!teamSearch) return teamMembers
    const search = teamSearch.toLowerCase()
    return teamMembers.filter(
      (m) =>
        m.firstName?.toLowerCase().includes(search) ||
        m.lastName?.toLowerCase().includes(search) ||
        m.email?.toLowerCase().includes(search)
    )
  }, [teamMembers, teamSearch])

  // Fetch add-ons when service is selected
  const fetchAddOns = async (serviceId: string) => {
    if (serviceId) {
      try {
        const res = await fetch(`/api/services/${serviceId}/addons`)
        const data = res.ok ? await res.json() : []
        setServiceAddOns(data || [])
      } catch {
        setServiceAddOns([])
      }
    } else {
      setServiceAddOns([])
      setSelectedAddOns([])
    }
  }

  // Handle service selection with auto-fill
  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId)
    setFormData((prev) => ({
      ...prev,
      serviceId,
      durationMinutes: service?.durationMinutes?.toString() || '60',
      totalPrice: service?.price?.toString() || '',
    }))
    setSelectedAddOns([])
    fetchAddOns(serviceId)
  }

  // Calculate total price including add-ons
  const calculatedTotal = useMemo(() => {
    const basePrice = parseFloat(formData.totalPrice) || 0
    const addOnsPrice = selectedAddOns.reduce((sum, addOnId) => {
      const addOn = serviceAddOns.find((a) => a.id === addOnId)
      return sum + (addOn?.price || 0)
    }, 0)
    return basePrice + addOnsPrice
  }, [formData.totalPrice, selectedAddOns, serviceAddOns])

  // Calculate total duration including add-ons
  const calculatedDuration = useMemo(() => {
    const baseDuration = parseInt(formData.durationMinutes) || 0
    const addOnsDuration = selectedAddOns.reduce((sum, addOnId) => {
      const addOn = serviceAddOns.find((a) => a.id === addOnId)
      return sum + (addOn?.durationMinutes || 0)
    }, 0)
    return baseDuration + addOnsDuration
  }, [formData.durationMinutes, selectedAddOns, serviceAddOns])

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId)
        ? prev.filter((id) => id !== addOnId)
        : [...prev, addOnId]
    )
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, scheduledDate: date }))
      setCalendarStep('time')
    }
  }

  const handleTimeSelect = (time: string) => {
    setFormData((prev) => ({ ...prev, scheduledTime: time }))
    setCalendarOpen(false)
    setCalendarStep('date')
  }

  const formatTime12Hour = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.scheduledDate) return

    try {
      await createJob({
        customerId: formData.customerId,
        serviceId: formData.serviceId,
        assignedTeamMemberId: formData.assignedTeamMemberId || undefined,
        scheduledDate: format(formData.scheduledDate, 'yyyy-MM-dd'),
        scheduledTime: formData.scheduledTime,
        durationMinutes: calculatedDuration,
        totalPrice: calculatedTotal,
        notes: formData.notes || undefined,
        status: 'scheduled',
        paymentStatus: 'unpaid',
        // addOnIds: selectedAddOns, // TODO: Add this when backend supports it
      })

      // Reset form
      setFormData({
        customerId: '',
        serviceId: '',
        assignedTeamMemberId: '',
        scheduledDate: undefined,
        scheduledTime: '09:00',
        durationMinutes: '60',
        totalPrice: '',
        notes: '',
      })
      setSelectedAddOns([])
      setServiceAddOns([])

      onSuccess()
      onOpenChange(false)
    } catch {
      // Error is handled by the hook
    }
  }

  const resetAndClose = () => {
    setFormData({
      customerId: '',
      serviceId: '',
      assignedTeamMemberId: '',
      scheduledDate: undefined,
      scheduledTime: '09:00',
      durationMinutes: '60',
      totalPrice: '',
      notes: '',
    })
    setSelectedAddOns([])
    setServiceAddOns([])
    setCalendarStep('date')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Schedule New Job</DialogTitle>
            <DialogDescription>
              Create a new service appointment. Fields marked with * are
              required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Customer - Searchable */}
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerOpen}
                    className="w-full justify-between"
                  >
                    {selectedCustomer ? (
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                        {selectedCustomer.email && (
                          <span className="text-muted-foreground text-xs">
                            ({selectedCustomer.email})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Search customers...
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search by name, email, or phone..."
                      value={customerSearch}
                      onValueChange={setCustomerSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No customers found.</CommandEmpty>
                      <CommandGroup>
                        {filteredCustomers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.id}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                customerId: customer.id,
                              })
                              setCustomerOpen(false)
                              setCustomerSearch('')
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.customerId === customer.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span>
                                {customer.firstName} {customer.lastName}
                              </span>
                              {customer.email && (
                                <span className="text-xs text-muted-foreground">
                                  {customer.email}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {customers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No customers found. Add a customer first.
                </p>
              )}
            </div>

            {/* Service - Searchable */}
            <div className="space-y-2">
              <Label>Service *</Label>
              <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={serviceOpen}
                    className="w-full justify-between"
                  >
                    {selectedService ? (
                      <span className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        {selectedService.name}
                        <span className="text-[#d4a574] font-medium">
                          ${selectedService.price}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Search services...
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search services..."
                      value={serviceSearch}
                      onValueChange={setServiceSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No services found.</CommandEmpty>
                      <CommandGroup>
                        {filteredServices.map((service) => (
                          <CommandItem
                            key={service.id}
                            value={service.id}
                            onSelect={() => {
                              handleServiceChange(service.id)
                              setServiceOpen(false)
                              setServiceSearch('')
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.serviceId === service.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col flex-1">
                              <div className="flex items-center justify-between">
                                <span>{service.name}</span>
                                <span className="text-[#d4a574] font-medium">
                                  ${service.price}
                                </span>
                              </div>
                              {service.durationMinutes && (
                                <span className="text-xs text-muted-foreground">
                                  {service.durationMinutes} minutes
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {services.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No services found. Add a service first.
                </p>
              )}
            </div>

            {/* Service Add-ons */}
            {serviceAddOns.length > 0 && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add-on Services
                </Label>
                <div className="grid gap-2 pl-1">
                  {serviceAddOns.map((addOn) => (
                    <div
                      key={addOn.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border transition-colors',
                        selectedAddOns.includes(addOn.id)
                          ? 'border-[#d4a574] bg-[#d4a574]/10'
                          : 'border-white/10 hover:border-white/20'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={addOn.id}
                          checked={selectedAddOns.includes(addOn.id)}
                          onCheckedChange={() => handleAddOnToggle(addOn.id)}
                        />
                        <label
                          htmlFor={addOn.id}
                          className="flex flex-col cursor-pointer"
                        >
                          <span className="font-medium">{addOn.name}</span>
                          {addOn.durationMinutes > 0 && (
                            <span className="text-xs text-muted-foreground">
                              +{addOn.durationMinutes} min
                            </span>
                          )}
                        </label>
                      </div>
                      <span className="text-[#d4a574] font-medium">
                        +${addOn.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Member - Searchable */}
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Popover open={teamMemberOpen} onOpenChange={setTeamMemberOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={teamMemberOpen}
                    className="w-full justify-between"
                  >
                    {selectedTeamMember ? (
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {selectedTeamMember.firstName}{' '}
                        {selectedTeamMember.lastName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search team members..."
                      value={teamSearch}
                      onValueChange={setTeamSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No team members found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="unassigned"
                          onSelect={() => {
                            setFormData({
                              ...formData,
                              assignedTeamMemberId: '',
                            })
                            setTeamMemberOpen(false)
                            setTeamSearch('')
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              !formData.assignedTeamMemberId
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          <span className="text-muted-foreground">
                            Unassigned
                          </span>
                        </CommandItem>
                        {filteredTeamMembers.map((member) => (
                          <CommandItem
                            key={member.id}
                            value={member.id}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                assignedTeamMemberId: member.id,
                              })
                              setTeamMemberOpen(false)
                              setTeamSearch('')
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.assignedTeamMemberId === member.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span>
                                {member.firstName} {member.lastName}
                              </span>
                              {member.email && (
                                <span className="text-xs text-muted-foreground">
                                  {member.email}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Date & Time - Calendar with 2-step picker */}
            <div className="space-y-2">
              <Label>Date & Time *</Label>
              <Popover
                open={calendarOpen}
                onOpenChange={(open) => {
                  setCalendarOpen(open)
                  if (!open) setCalendarStep('date')
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.scheduledDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduledDate ? (
                      <span className="flex items-center gap-2">
                        {format(formData.scheduledDate, 'EEEE, MMMM d, yyyy')}
                        <span className="text-[#d4a574]">
                          at {formatTime12Hour(formData.scheduledTime)}
                        </span>
                      </span>
                    ) : (
                      <span>Select date and time</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  {calendarStep === 'date' ? (
                    <div className="p-3">
                      <Calendar
                        mode="single"
                        selected={formData.scheduledDate}
                        onSelect={handleDateSelect}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </div>
                  ) : (
                    <div className="p-4 w-[280px]">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCalendarStep('date')}
                          className="text-muted-foreground hover:text-white"
                        >
                          ← Back to calendar
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formData.scheduledDate &&
                            format(formData.scheduledDate, 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                        {TIME_SLOTS.map((time) => (
                          <Button
                            key={time}
                            variant={
                              formData.scheduledTime === time
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() => handleTimeSelect(time)}
                            className={cn(
                              'text-xs',
                              formData.scheduledTime === time &&
                                'bg-[#d4a574] hover:bg-[#c49464] text-black'
                            )}
                          >
                            {formatTime12Hour(time)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Duration and Price Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <div className="relative">
                  <Input
                    id="duration"
                    type="text"
                    inputMode="numeric"
                    value={formData.durationMinutes}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      setFormData({ ...formData, durationMinutes: value })
                    }}
                    placeholder="60"
                    className="pr-16"
                  />
                  {selectedAddOns.length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#d4a574]">
                      = {calculatedDuration}m
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Base Price ($)</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="text"
                    inputMode="decimal"
                    value={formData.totalPrice}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '')
                      const parts = value.split('.')
                      const sanitized =
                        parts.length > 2
                          ? parts[0] + '.' + parts.slice(1).join('')
                          : value
                      setFormData({ ...formData, totalPrice: sanitized })
                    }}
                    placeholder="150"
                    className="pr-20"
                  />
                  {selectedAddOns.length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#d4a574]">
                      = ${calculatedTotal.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Total Summary when add-ons selected */}
            {selectedAddOns.length > 0 && (
              <div className="p-3 rounded-lg bg-[#d4a574]/10 border border-[#d4a574]/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total with {selectedAddOns.length} add-on
                    {selectedAddOns.length > 1 ? 's' : ''}
                  </span>
                  <span className="text-lg font-semibold text-[#d4a574]">
                    ${calculatedTotal.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {calculatedDuration} minutes total duration
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any special instructions or notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={resetAndClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !formData.customerId ||
                !formData.serviceId ||
                !formData.scheduledDate
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Job
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
