'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  Link,
  Pencil,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { Task, useTaskMutations } from '@/hooks/use-tasks'

interface TaskListProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onRefetch: () => void
}

export function TaskList({ tasks, onTaskClick, onRefetch }: TaskListProps) {
  const { toggleTaskComplete, deleteTask, isLoading } = useTaskMutations()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'low':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'No due date'
    const d = new Date(date)
    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    if (diffDays < 7) return `Due in ${diffDays} days`
    return d.toLocaleDateString()
  }

  const isOverdue = (date: string | null) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  const handleToggleComplete = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await toggleTaskComplete(task.id)
      onRefetch()
    } catch {
      // Error handled by hook
    }
  }

  const handleDelete = async (task: Task) => {
    try {
      await deleteTask(task.id)
      onRefetch()
    } catch {
      // Error handled by hook
    }
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className={`glass-card p-4 cursor-pointer transition-all hover:border-primary/30 ${
            task.status === 'complete' ? 'opacity-60' : ''
          }`}
          onClick={() => onTaskClick(task)}
        >
          <div className="flex items-start gap-4">
            {/* Checkbox */}
            <div
              className="pt-1"
              onClick={(e) => handleToggleComplete(task, e)}
            >
              <Checkbox
                checked={task.status === 'complete'}
                disabled={isLoading}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3
                  className={`font-medium ${
                    task.status === 'complete' ? 'line-through' : ''
                  }`}
                >
                  {task.title}
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskClick(task)
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
                          handleDelete(task)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {task.dueDate && (
                  <div
                    className={`flex items-center gap-1 ${
                      isOverdue(task.dueDate) && task.status === 'incomplete'
                        ? 'text-red-500'
                        : ''
                    }`}
                  >
                    {isOverdue(task.dueDate) && task.status === 'incomplete' ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      <Calendar className="h-3 w-3" />
                    )}
                    {formatDate(task.dueDate)}
                  </div>
                )}
                {task.assignedTo && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {task.assignedTo.firstName} {task.assignedTo.lastName}
                  </div>
                )}
                {(task.customer || task.job) && (
                  <div className="flex items-center gap-1">
                    <Link className="h-3 w-3" />
                    {task.customer
                      ? `${task.customer.firstName} ${task.customer.lastName}`
                      : task.job?.jobNumber}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
