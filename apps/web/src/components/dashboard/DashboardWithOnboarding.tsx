'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SetupProgressBanner } from '@/components/onboarding/SetupProgressBanner'
import { TaskSpotlight } from '@/components/onboarding/TaskSpotlight'
import { CompletionConfetti } from '@/components/onboarding/CompletionConfetti'
import type { OnboardingTask } from '@/lib/onboarding/tasks.client'
import { toast } from 'sonner'
import { useMaksyChat } from '@/lib/maksy-chat-context'

interface DashboardWithOnboardingProps {
  companyId: string
  planType: 'pro' | 'scale' | 'team'
  showBanner: boolean
  children: React.ReactNode
}

export function DashboardWithOnboarding({
  companyId,
  planType,
  showBanner,
  children,
}: DashboardWithOnboardingProps) {
  const router = useRouter()
  const { openChat } = useMaksyChat()
  const [activeTask, setActiveTask] = useState<OnboardingTask | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleTaskClick = (task: OnboardingTask) => {
    // Navigate to the target route
    router.push(task.targetRoute)

    // Set active task for spotlight (after short delay to allow navigation)
    setTimeout(() => {
      setActiveTask(task)
    }, 500)
  }

  const handleCloseSpotlight = async () => {
    if (!activeTask) return

    // Mark task as complete
    try {
      const response = await fetch('/api/onboarding/complete-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: activeTask.id }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Great! ${activeTask.title} completed 🎉`)

        // Show confetti if all complete
        if (data.allComplete) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 5000)
        }

        // Refresh to update banner
        router.refresh()
      }
    } catch (error) {
      console.error('Error completing task:', error)
    }

    setActiveTask(null)
  }

  const handleDismiss = async () => {
    try {
      await fetch('/api/onboarding/set-tour-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tourMode: 'dismissed' }),
      })
      router.refresh()
    } catch (error) {
      console.error('Error dismissing onboarding:', error)
    }
  }

  const handleAskMaksy = () => {
    openChat("I'm new to Maksy. Can you help me get started?")
  }

  return (
    <>
      {showBanner && (
        <SetupProgressBanner
          planType={planType}
          onTaskClick={handleTaskClick}
          onDismiss={handleDismiss}
          onAskMaksy={handleAskMaksy}
        />
      )}

      {children}

      {activeTask && (
        <TaskSpotlight
          targetSelector={activeTask.spotlightSelector}
          helperText={activeTask.helperText}
          onClose={handleCloseSpotlight}
        />
      )}

      {showConfetti && <CompletionConfetti />}
    </>
  )
}
