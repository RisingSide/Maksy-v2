'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  DollarSign,
  FileText,
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  PlayCircle,
  PauseCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Job {
  id: string
  jobNumber: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  scheduledDate: string
  scheduledTime: string
  durationMinutes: number
  notes: string | null
  customerNotes: string | null
  totalPrice: number | null
  paymentStatus: string | null
  createdAt: string
  updatedAt: string
}

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: {
    line1: string | null
    line2: string | null
    city: string | null
    state: string | null
    zip: string | null
  } | null
}

interface Service {
  id: string
  name: string
  color: string
  price: number | null
  durationMinutes: number
}

interface TeamMember {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  role?: string
}

interface Media {
  id: string
  url: string
  type: 'before' | 'after' | 'other'
  caption: string | null
  uploadedAt: string
}

interface JobDetailClientProps {
  job: Job
  customer: Customer | null
  service: Service | null
  assignedMember: TeamMember | null
  media: Media[]
  teamMembers: TeamMember[]
}

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-500', icon: Calendar },
  confirmed: { label: 'Confirmed', color: 'bg-purple-500', icon: CheckCircle2 },
  in_progress: {
    label: 'In Progress',
    color: 'bg-yellow-500',
    icon: PlayCircle,
  },
  completed: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle },
}

const PAYMENT_STATUS_CONFIG: Record<
  string,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  unpaid: { label: 'Unpaid', variant: 'secondary' },
  partial: { label: 'Partial', variant: 'outline' },
  paid: { label: 'Paid', variant: 'default' },
}

export function JobDetailClient({
  job,
  customer,
  service,
  assignedMember,
  media,
  teamMembers,
}: JobDetailClientProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState(job.status)
  const [currentAssignee, setCurrentAssignee] = useState(
    assignedMember?.id || ''
  )
  const [notes, setNotes] = useState(job.notes || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  const statusConfig = STATUS_CONFIG[currentStatus]
  const StatusIcon = statusConfig.icon

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')

      setCurrentStatus(newStatus as Job['status'])
      toast.success(
        `Job status updated to ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG].label}`
      )
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAssigneeChange = async (userId: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId || null }),
      })

      if (!response.ok) throw new Error('Failed to assign team member')

      setCurrentAssignee(userId)
      toast.success(userId ? 'Team member assigned' : 'Assignment removed')
    } catch (error) {
      toast.error('Failed to update assignment')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveNotes = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) throw new Error('Failed to save notes')

      toast.success('Notes saved')
    } catch (error) {
      toast.error('Failed to save notes')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatAddress = (address: Customer['address']) => {
    if (!address?.line1) return null
    const parts = [
      address.line1,
      address.line2,
      [address.city, address.state, address.zip].filter(Boolean).join(', '),
    ].filter(Boolean)
    return parts.join('\n')
  }

  const beforePhotos = media.filter((m) => m.type === 'before')
  const afterPhotos = media.filter((m) => m.type === 'after')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Job {job.jobNumber}</h1>
              <Badge className={cn('text-white', statusConfig.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Created{' '}
              {format(new Date(job.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={currentStatus}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule Card */}
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Schedule
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(new Date(job.scheduledDate), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{job.scheduledTime}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {job.durationMinutes >= 60
                    ? `${Math.floor(job.durationMinutes / 60)}h ${job.durationMinutes % 60 ? `${job.durationMinutes % 60}m` : ''}`
                    : `${job.durationMinutes} min`}
                </p>
              </div>
            </div>
          </Card>

          {/* Service Card */}
          {service && (
            <Card className="glass-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Service
              </h3>
              <div className="flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: service.color + '20' }}
                >
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: service.color }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {service.durationMinutes} min
                  </p>
                </div>
                {service.price && (
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      ${service.price.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Notes Card */}
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Internal Notes
            </h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this job..."
              rows={4}
              className="mb-4"
            />
            <Button
              onClick={handleSaveNotes}
              disabled={isUpdating || notes === (job.notes || '')}
              size="sm"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Notes'
              )}
            </Button>

            {job.customerNotes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Customer Notes
                </p>
                <p className="text-sm bg-muted/50 rounded-lg p-3">
                  {job.customerNotes}
                </p>
              </div>
            )}
          </Card>

          {/* Before/After Photos */}
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Photos
              </h3>
              <Dialog
                open={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Photos</DialogTitle>
                  </DialogHeader>
                  <div className="py-8 text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Photo upload coming soon</p>
                    <p className="text-sm">
                      Drag and drop or click to upload before/after photos
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-3">Before</p>
                {beforePhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {beforePhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative aspect-square rounded-lg overflow-hidden"
                      >
                        <Image
                          src={photo.url}
                          alt={photo.caption || 'Before photo'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      No before photos
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-3">After</p>
                {afterPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {afterPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative aspect-square rounded-lg overflow-hidden"
                      >
                        <Image
                          src={photo.url}
                          alt={photo.caption || 'After photo'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      No after photos
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Card */}
          {customer && (
            <Card className="glass-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Customer
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">
                    {customer.firstName} {customer.lastName}
                  </p>
                </div>
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {customer.email}
                  </a>
                )}
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {customer.phone}
                  </a>
                )}
                {customer.address?.line1 && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span className="whitespace-pre-line">
                      {formatAddress(customer.address)}
                    </span>
                  </div>
                )}
                <Link href={`/customers?id=${customer.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Customer
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Assignment Card */}
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Assigned To
            </h3>
            <Select
              value={currentAssignee}
              onValueChange={handleAssigneeChange}
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatarUrl || undefined} />
                        <AvatarFallback>
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {member.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {currentAssignee && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {(() => {
                  const member = teamMembers.find(
                    (m) => m.id === currentAssignee
                  )
                  return member ? (
                    <>
                      <Avatar>
                        <AvatarImage src={member.avatarUrl || undefined} />
                        <AvatarFallback>
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </>
                  ) : null
                })()}
              </div>
            )}
          </Card>

          {/* Payment Card */}
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Payment
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl font-bold">
                  ${(job.totalPrice || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={
                    PAYMENT_STATUS_CONFIG[job.paymentStatus || 'unpaid']
                      ?.variant || 'secondary'
                  }
                >
                  {PAYMENT_STATUS_CONFIG[job.paymentStatus || 'unpaid']
                    ?.label || 'Unpaid'}
                </Badge>
              </div>
              <Button variant="outline" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Invoice
              </Button>
            </div>
          </Card>

          {/* Actions Card */}
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4">Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Send className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel Job
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
