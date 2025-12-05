'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, CheckSquare, AlertCircle, Clock } from 'lucide-react'
import { useTasks, Task } from '@/hooks/use-tasks'
import { TaskList, TaskCreateModal } from '@/components/tasks'
import { EmptyState, LoadingState, ErrorState } from '@/components/shared'

type TaskFilter = 'all' | 'incomplete' | 'complete' | 'overdue'
type PriorityFilter = 'all' | Task['priority']

export default function TasksPage() {
  // State
  const [statusFilter, setStatusFilter] = useState<TaskFilter>('incomplete')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Hooks
  const { tasks, total, isLoading, error, refetch } = useTasks({
    status:
      statusFilter === 'all' || statusFilter === 'overdue'
        ? undefined
        : statusFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
    overdue: statusFilter === 'overdue',
    sort: 'dueDate',
    limit: 100,
  })

  // Calculate stats
  const incompleteTasks = tasks.filter((t) => t.status === 'incomplete').length
  const overdueTasks = tasks.filter(
    (t) =>
      t.status === 'incomplete' && t.dueDate && new Date(t.dueDate) < new Date()
  ).length
  const completedToday = tasks.filter((t) => {
    if (t.status !== 'complete' || !t.completedAt) return false
    const today = new Date().toISOString().split('T')[0]
    return t.completedAt.startsWith(today)
  }).length

  // Handlers
  const handleTaskClick = useCallback((task: Task) => {
    // Task click handler - could open detail/edit view
    // For now, tasks are edited inline via the TaskList component
  }, [])

  // Render error state
  if (error && !isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Tasks</h1>
          <p className="text-muted-foreground">Manage your to-do list</p>
        </div>
        <ErrorState
          title="Failed to load tasks"
          message={error}
          onRetry={refetch}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Tasks</h1>
          <p className="text-muted-foreground">Manage your to-do list</p>
        </div>
        <Button
          className="shadow-lg gap-2"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
              <CheckSquare className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Pending Tasks
              </p>
              <p className="font-tabular text-lg font-bold">
                {incompleteTasks}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Overdue</p>
              <p className="font-tabular text-lg font-bold text-red-500">
                {overdueTasks}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Completed Today
              </p>
              <p className="font-tabular text-lg font-bold">{completedToday}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <div className="flex gap-1">
              {(['all', 'incomplete', 'complete', 'overdue'] as const).map(
                (status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="capitalize"
                  >
                    {status === 'overdue' && overdueTasks > 0 && (
                      <Badge
                        variant="destructive"
                        className="mr-1 h-5 px-1.5 text-xs"
                      >
                        {overdueTasks}
                      </Badge>
                    )}
                    {status}
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Priority:</span>
            <Select
              value={priorityFilter}
              onValueChange={(value) =>
                setPriorityFilter(value as PriorityFilter)
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <LoadingState type="cards" count={4} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={
            statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'No tasks found'
              : 'No tasks yet'
          }
          description={
            statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first task to start tracking your to-dos.'
          }
          action={
            statusFilter === 'all' && priorityFilter === 'all'
              ? {
                  label: 'Add Task',
                  onClick: () => setCreateModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <TaskList
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onRefetch={refetch}
        />
      )}

      {/* Modals */}
      <TaskCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={refetch}
      />
    </div>
  )
}
