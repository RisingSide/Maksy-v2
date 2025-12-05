'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Calendar,
  User,
  MapPin,
  Play,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Job, useJobMutations } from '@/hooks/use-jobs'

interface JobsTableProps {
  jobs: Job[]
  onJobClick: (job: Job) => void
  onStatusChange: (job: Job, status: Job['status']) => void
  onRefetch: () => void
}

export function JobsTable({
  jobs,
  onJobClick,
  onStatusChange,
  onRefetch,
}: JobsTableProps) {
  const { updateJobStatus } = useJobMutations()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'confirmed':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'in_progress':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  const handleStatusChange = async (job: Job, newStatus: Job['status']) => {
    try {
      await updateJobStatus(job.id, newStatus)
      onStatusChange(job, newStatus)
      onRefetch()
    } catch {
      // Error handled by hook
    }
  }

  const getCustomerInitials = (job: Job) => {
    if (!job.customer) return '?'
    return `${job.customer.firstName[0] || ''}${job.customer.lastName[0] || ''}`.toUpperCase()
  }

  const getCustomerName = (job: Job) => {
    if (!job.customer) return 'Unknown'
    return `${job.customer.firstName} ${job.customer.lastName}`
  }

  return (
    <Card className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="text-left p-4 font-semibold text-sm">Customer</th>
              <th className="text-left p-4 font-semibold text-sm">Service</th>
              <th className="text-left p-4 font-semibold text-sm">
                Date & Time
              </th>
              <th className="text-left p-4 font-semibold text-sm">
                Technician
              </th>
              <th className="text-left p-4 font-semibold text-sm">Status</th>
              <th className="text-left p-4 font-semibold text-sm">Price</th>
              <th className="text-left p-4 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="border-b border-border/30 hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => onJobClick(job)}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                      {getCustomerInitials(job)}
                    </div>
                    <div>
                      <p className="font-medium">{getCustomerName(job)}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.customer?.city || 'No address'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <p className="font-medium">
                    {job.service?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {job.durationMinutes} min duration
                  </p>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p>{formatDate(job.scheduledDate)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(job.scheduledTime)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {job.teamMember
                        ? `${job.teamMember.firstName} ${job.teamMember.lastName}`
                        : 'Unassigned'}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <Badge className={getStatusColor(job.status)}>
                    {job.status.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="p-4">
                  <span className="font-semibold">
                    {formatCurrency(job.totalPrice)}
                  </span>
                </td>
                <td className="p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {job.status === 'scheduled' && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(job, 'confirmed')
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm
                        </DropdownMenuItem>
                      )}
                      {(job.status === 'scheduled' ||
                        job.status === 'confirmed') && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(job, 'in_progress')
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Job
                        </DropdownMenuItem>
                      )}
                      {job.status === 'in_progress' && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(job, 'completed')
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete
                        </DropdownMenuItem>
                      )}
                      {job.status !== 'cancelled' &&
                        job.status !== 'completed' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(job, 'cancelled')
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
