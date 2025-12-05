'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TaskSpotlightProps {
  targetSelector: string
  helperText: string
  onClose: () => void
}

export function TaskSpotlight({
  targetSelector,
  helperText,
  onClose,
}: TaskSpotlightProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const element = document.querySelector(targetSelector) as HTMLElement
      if (element) {
        setTargetElement(element)

        // Calculate bubble position
        const rect = element.getBoundingClientRect()
        setBubblePosition({
          top: rect.bottom + window.scrollY + 16,
          left: rect.left + window.scrollX,
        })

        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [targetSelector])

  if (!targetElement) {
    return null
  }

  const rect = targetElement.getBoundingClientRect()

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-[100] animate-fade-in"
        onClick={onClose}
      />

      {/* Spotlight highlight */}
      <div
        className="fixed z-[101] pointer-events-none"
        style={{
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        }}
      >
        <div className="absolute inset-0 ring-4 ring-primary rounded-lg animate-pulse-slow" />
        <div className="absolute inset-0 bg-background/10 rounded-lg" />
      </div>

      {/* Helper bubble */}
      <div
        className="fixed z-[102] max-w-sm animate-scale-in"
        style={{
          top: bubblePosition.top,
          left: bubblePosition.left,
        }}
      >
        <div className="glass-card p-4 shadow-2xl border-primary/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">{helperText}</p>
              <Button
                size="sm"
                onClick={onClose}
                variant="outline"
                className="mt-2"
              >
                Got it!
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Arrow pointing up */}
          <div className="absolute -top-2 left-8 w-4 h-4 bg-card border-t border-l border-primary/50 rotate-45" />
        </div>
      </div>
    </>
  )
}
