'use client'

import Image from 'next/image'
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
  DollarSign,
  Clock,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Wrench,
} from 'lucide-react'
import { Service } from '@/hooks/use-services'

interface ServiceCardProps {
  service: Service
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
  onClick?: (service: Service) => void
}

export function ServiceCard({
  service,
  onEdit,
  onDelete,
  onClick,
}: ServiceCardProps) {
  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <Card
      className="glass-card p-6 cursor-pointer transition-all hover:border-primary/30"
      onClick={() => onClick?.(service)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${service.color}20` }}
          >
            {service.iconUrl ? (
              <Image
                src={service.iconUrl}
                alt={service.name}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            ) : (
              <Wrench className="h-6 w-6" style={{ color: service.color }} />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{service.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {service.isPublic ? (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Eye className="h-3 w-3" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs gap-1">
                  <EyeOff className="h-3 w-3" />
                  Private
                </Badge>
              )}
              {service.category && (
                <Badge variant="outline" className="text-xs">
                  {service.category.name}
                </Badge>
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
                onEdit(service)
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(service)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      {service.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {service.description}
        </p>
      )}

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Price
          </div>
          <span className="font-semibold text-lg">
            {formatCurrency(service.price)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Duration
          </div>
          <span className="text-sm">
            {formatDuration(service.durationMinutes)}
          </span>
        </div>
      </div>

      {/* Color indicator */}
      <div className="pt-4 border-t border-border/40">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Service Color</p>
          <div
            className="h-4 w-8 rounded"
            style={{ backgroundColor: service.color }}
          />
        </div>
      </div>
    </Card>
  )
}
