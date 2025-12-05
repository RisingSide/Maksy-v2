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
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Pencil,
  Trash2,
  Calendar,
} from 'lucide-react'
import { Customer } from '@/hooks/use-customers'

interface CustomerCardProps {
  customer: Customer
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  onClick?: (customer: Customer) => void
}

export function CustomerCard({
  customer,
  onEdit,
  onDelete,
  onClick,
}: CustomerCardProps) {
  const initials =
    `${customer.firstName[0] || ''}${customer.lastName[0] || ''}`.toUpperCase()
  const fullName = `${customer.firstName} ${customer.lastName}`
  const fullAddress = [
    customer.addressLine1,
    customer.city,
    customer.state,
    customer.zipCode,
  ]
    .filter(Boolean)
    .join(', ')

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return d.toLocaleDateString()
  }

  return (
    <Card
      className="glass-card p-6 cursor-pointer transition-all hover:border-primary/30"
      onClick={() => onClick?.(customer)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
          <div>
            <h3 className="font-semibold">{fullName}</h3>
            <div className="flex items-center gap-2 mt-1">
              {customer.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {customer.companyName && (
                <span className="text-xs text-muted-foreground">
                  {customer.companyName}
                </span>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onEdit(customer)
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = `/jobs?customer=${customer.id}`
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Jobs
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(customer)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {customer.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        {customer.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            {customer.phone}
          </div>
        )}
        {fullAddress && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{fullAddress}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/40">
        <div>
          <p className="text-xs text-muted-foreground">Jobs</p>
          <p className="text-lg font-semibold">{customer.totalJobs}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            LTV
          </p>
          <p className="text-lg font-semibold text-green-600">
            {formatCurrency(customer.lifetimeValue)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Last Job</p>
          <p className="text-sm font-medium">
            {formatDate(customer.lastJobDate)}
          </p>
        </div>
      </div>
    </Card>
  )
}
