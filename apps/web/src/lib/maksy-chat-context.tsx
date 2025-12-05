'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'

interface MaksyChatContextType {
  isOpen: boolean
  openChat: (initialMessage?: string) => void
  closeChat: () => void
  toggleChat: () => void
  initialMessage: string | null
  clearInitialMessage: () => void
}

const MaksyChatContext = createContext<MaksyChatContextType | null>(null)

export function MaksyChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialMessage, setInitialMessage] = useState<string | null>(null)

  const openChat = useCallback((message?: string) => {
    if (message) {
      setInitialMessage(message)
    }
    setIsOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const clearInitialMessage = useCallback(() => {
    setInitialMessage(null)
  }, [])

  return (
    <MaksyChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        initialMessage,
        clearInitialMessage,
      }}
    >
      {children}
    </MaksyChatContext.Provider>
  )
}

export function useMaksyChat() {
  const context = useContext(MaksyChatContext)
  if (!context) {
    throw new Error('useMaksyChat must be used within a MaksyChatProvider')
  }
  return context
}

// Global function for opening chat from anywhere (including non-React code)
let globalOpenChat: ((message?: string) => void) | null = null

export function setGlobalOpenChat(fn: (message?: string) => void) {
  globalOpenChat = fn
}

export function openMaksyChat(initialMessage?: string) {
  if (globalOpenChat) {
    globalOpenChat(initialMessage)
  } else {
    console.warn('MaksyChat is not mounted yet')
  }
}
