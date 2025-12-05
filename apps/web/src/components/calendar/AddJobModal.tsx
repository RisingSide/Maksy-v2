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
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

interface AddJobModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: string
  initialTime?: string
}

export function AddJobModal({
  open,
  onOpenChange,
  initialDate,
  initialTime,
}: AddJobModalProps) {
  const [isRecurring, setIsRecurring] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Job</DialogTitle>
          <DialogDescription>
            Schedule a new service appointment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select>
              <SelectTrigger id="customer">
                <SelectValue placeholder="Select customer..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="john-doe">John Doe</SelectItem>
                <SelectItem value="alice-brown">Alice Brown</SelectItem>
                <SelectItem value="bob-wilson">Bob Wilson</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service */}
          <div className="space-y-2">
            <Label htmlFor="service">Service *</Label>
            <Select>
              <SelectTrigger id="service">
                <SelectValue placeholder="Select service..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ac-repair">AC Repair</SelectItem>
                <SelectItem value="pool-cleaning">Pool Cleaning</SelectItem>
                <SelectItem value="lawn-mowing">Lawn Mowing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                defaultValue={initialDate}
                placeholder="Select date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                defaultValue={initialTime}
                placeholder="Select time"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              type="text"
              placeholder="Auto-filled from service"
              disabled
            />
          </div>

          {/* Team Member */}
          <div className="space-y-2">
            <Label htmlFor="team-member">Team Member</Label>
            <Select>
              <SelectTrigger id="team-member">
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mike-ross">Mike Ross</SelectItem>
                <SelectItem value="david-chen">David Chen</SelectItem>
                <SelectItem value="team-a">Team A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recurring */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked === true)}
            />
            <Label htmlFor="recurring" className="cursor-pointer">
              Recurring appointment
            </Label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>Save Job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
