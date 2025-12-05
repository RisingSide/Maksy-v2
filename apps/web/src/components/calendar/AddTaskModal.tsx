'use client'

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

interface AddTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTaskModal({ open, onOpenChange }: AddTaskModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>Create a new task for your team</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Title *</Label>
            <Input id="task-title" placeholder="Enter task title..." />
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assigned-to">Assigned To</Label>
            <Select>
              <SelectTrigger id="assigned-to">
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mike-ross">Mike Ross</SelectItem>
                <SelectItem value="david-chen">David Chen</SelectItem>
                <SelectItem value="team-a">Team A</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date</Label>
            <Input id="due-date" type="date" placeholder="Select due date" />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select>
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
