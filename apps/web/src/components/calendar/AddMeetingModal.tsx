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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface AddMeetingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddMeetingModal({ open, onOpenChange }: AddMeetingModalProps) {
  const [locationType, setLocationType] = useState<'online' | 'in-person'>(
    'in-person'
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Meeting</DialogTitle>
          <DialogDescription>Schedule a team meeting</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="meeting-title">Title *</Label>
            <Input id="meeting-title" placeholder="Enter meeting title..." />
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label htmlFor="attendees">Attendees</Label>
            <Select>
              <SelectTrigger id="attendees">
                <SelectValue placeholder="Select team members..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mike-ross">Mike Ross</SelectItem>
                <SelectItem value="david-chen">David Chen</SelectItem>
                <SelectItem value="team-a">Team A</SelectItem>
                <SelectItem value="all">All Team Members</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Multi-select coming soon
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="30"
              min="15"
              step="15"
            />
          </div>

          {/* Location Type */}
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="in-person"
                  name="location"
                  value="in-person"
                  checked={locationType === 'in-person'}
                  onChange={() => setLocationType('in-person')}
                  className="h-4 w-4 text-primary"
                />
                <Label htmlFor="in-person" className="cursor-pointer">
                  In Person
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="online"
                  name="location"
                  value="online"
                  checked={locationType === 'online'}
                  onChange={() => setLocationType('online')}
                  className="h-4 w-4 text-primary"
                />
                <Label htmlFor="online" className="cursor-pointer">
                  Online
                </Label>
              </div>
            </div>
          </div>

          {/* Meeting Link (if online) */}
          {locationType === 'online' && (
            <div className="space-y-2">
              <Label htmlFor="meeting-link">Meeting Link</Label>
              <Input
                id="meeting-link"
                type="url"
                placeholder="https://meet.google.com/..."
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>Schedule Meeting</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
