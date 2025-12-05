'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useMaksyChat, setGlobalOpenChat } from '@/lib/maksy-chat-context'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function MaksyChat() {
  const { isOpen, openChat, closeChat, initialMessage, clearInitialMessage } =
    useMaksyChat()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Register global open function
  useEffect(() => {
    setGlobalOpenChat(openChat)
    return () => setGlobalOpenChat(() => {})
  }, [openChat])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Add welcome message when chat opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hi! I'm Maksy, your AI business assistant. I can help you with:

• Creating jobs and tasks
• Analyzing your business data
• Generating reports
• Answering questions about your business

What would you like to do today?`,
          timestamp: new Date(),
        },
      ])
    }
  }, [isOpen, messages.length])

  // Handle initial message from context
  useEffect(() => {
    if (isOpen && initialMessage) {
      setMessage(initialMessage)
      clearInitialMessage()
      // Optionally auto-send the message
      // We'll leave it in the input for the user to review and send
    }
  }, [isOpen, initialMessage, clearInitialMessage])

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/maksy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const data = await response.json()

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send message'
      toast.error(errorMessage)

      // Add error message to chat
      const errorResponse: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <Button
          onClick={() => openChat()}
          size="lg"
          className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 animate-bounce-slow group"
          data-action="open-maksy-chat"
        >
          <div className="relative">
            <Sparkles className="h-7 w-7 text-white" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 h-[600px] flex flex-col glass-chat shadow-2xl animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/40 bg-gradient-to-r from-primary to-orange-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Maksy AI</h3>
                <p className="text-xs text-white/80">Your Business Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeChat}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : ''
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}
                <Card
                  className={cn(
                    'p-3 max-w-[80%]',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </Card>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-white animate-pulse" />
                </div>
                <Card className="p-3 bg-muted/50">
                  <div className="flex gap-1">
                    <div
                      className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    ></div>
                  </div>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/40">
            <div className="flex gap-2">
              <Input
                placeholder="Ask Maksy anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="bg-gradient-to-br from-primary to-orange-600"
                disabled={!message.trim() || isLoading}
                onClick={sendMessage}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by GPT-4o-mini
            </p>
          </div>
        </Card>
      )}
    </>
  )
}
