'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, X, Sparkles } from 'lucide-react'
import { getTasksForPlan } from '@/lib/onboarding/tasks.client'
import type { OnboardingTask } from '@/lib/onboarding/tasks.client'

interface SetupProgressBannerProps {
  planType: 'pro' | 'scale' | 'team'
  onTaskClick: (task: OnboardingTask) => void
  onDismiss: () => void
  onAskMaksy: () => void
}

interface ProgressData {
  criticalCompleted: boolean
  tasksCompleted: Record<string, boolean>
  completionPercentage: number
  tourMode: string
  dismissedAt?: string | null
  completedAt?: string | null
}

export function SetupProgressBanner({
  planType,
  onTaskClick,
  onDismiss,
  onAskMaksy,
}: SetupProgressBannerProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const router = useRouter()

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/onboarding/progress')
      if (response.ok) {
        const data = await response.json()
        // Handle new user or missing progress gracefully
        if (data.isNewUser || !data.progress) {
          setProgress(null)
        } else {
          setProgress(data.progress)
        }
      } else {
        setError(true)
      }
    } catch (err) {
      console.error('Error fetching progress:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProgress()
  }, [])

  // Don't show banner if loading, error, no progress, or already dismissed/completed
  if (
    loading ||
    error ||
    !progress ||
    progress.dismissedAt ||
    progress.completedAt
  ) {
    return null
  }

  // Don't show if completion is 100%
  if (progress.completionPercentage >= 100) {
    return null
  }

  const tasks = getTasksForPlan(planType)
  const tasksCompleted = progress.tasksCompleted || {}
  const completedTasks = tasks.filter((t) => tasksCompleted[t.id])
  const incompleteTasks = tasks.filter((t) => !tasksCompleted[t.id])

  return (
    <Card className="glass-card p-6 mb-6 border-primary/20 animate-slide-in-top">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-semibold text-lg">
              Get Maksy Ready for Your Business
            </h3>
            <p className="text-sm text-muted-foreground">
              Complete these steps to unlock the full power of Maksy
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {progress.completionPercentage}% Complete
          </span>
          <span className="text-sm text-muted-foreground">
            {completedTasks.length} of {tasks.length} tasks
          </span>
        </div>
        <Progress value={progress.completionPercentage} className="h-2" />
      </div>

      <div className="space-y-2">
        {/* Completed tasks */}
        {completedTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 opacity-60"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-sm line-through">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {task.description}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-green-500 border-green-500"
            >
              Complete
            </Badge>
          </div>
        ))}

        {/* Incomplete tasks */}
        {incompleteTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
            onClick={() => onTaskClick(task)}
          >
            <div className="flex items-center gap-3">
              <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div>
                <p className="font-medium text-sm group-hover:text-primary transition-colors">
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {task.description}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="group-hover:bg-primary group-hover:text-primary-foreground"
            >
              Go →
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between pt-4 border-t">
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss for now
        </Button>
        <Button variant="ghost" size="sm" onClick={onAskMaksy}>
          Ask Maksy for Help →
        </Button>
      </div>
    </Card>
  )
}
