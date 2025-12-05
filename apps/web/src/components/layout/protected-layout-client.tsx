'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'
import { MaksyChat } from '@/components/maksy-chat'
import { ErrorBoundary } from '@/components/error-boundary'
import { MaksyChatProvider } from '@/lib/maksy-chat-context'

interface ProtectedLayoutClientProps {
  children: ReactNode
}

export function ProtectedLayoutClient({
  children,
}: ProtectedLayoutClientProps) {
  return (
    <ErrorBoundary>
      <MaksyChatProvider>
        <div className="min-h-screen relative overflow-hidden">
          {/* Animated Gradient Background (Dark & Light Modes) - Scrolls with content */}
          <div className="gradient-bg">
            <div className="gradient-orb gradient-orb-1"></div>
            <div className="gradient-orb gradient-orb-2"></div>
            <div className="gradient-orb gradient-orb-3"></div>
          </div>

          {/* Sidebar */}
          <Sidebar />

          {/* Main Content Area - Fixed height with internal scroll */}
          <div className="lg:pl-64 relative z-10 flex flex-col h-screen">
            {/* Top Bar - Sticky at top */}
            <TopBar />

            {/* Page Content - Scrollable area */}
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>

          {/* Maksy AI Chat Bubble */}
          <MaksyChat />
        </div>
      </MaksyChatProvider>
    </ErrorBoundary>
  )
}
