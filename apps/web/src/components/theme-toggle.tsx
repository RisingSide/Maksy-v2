'use client'

import { useEffect, useState, useCallback } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Initialize from localStorage during SSR-safe initialization
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('maksy-theme') as
        | 'light'
        | 'dark'
        | null
      return stored || 'dark'
    }
    return 'dark'
  })

  // Sync DOM on mount and when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('maksy-theme', newTheme)
  }, [theme])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-10 w-10 rounded-full hover:bg-sidebar-accent transition-all"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
