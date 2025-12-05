'use client'

import { useEffect } from 'react'

export function CompletionConfetti() {
  useEffect(() => {
    // Create confetti particles
    const colors = ['#f4a125', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
    const confettiCount = 50

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div')
      confetti.className = 'confetti-particle'
      confetti.style.cssText = `
        position: fixed;
        width: ${Math.random() * 10 + 5}px;
        height: ${Math.random() * 10 + 5}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        top: -10px;
        left: ${Math.random() * 100}vw;
        opacity: ${Math.random() * 0.7 + 0.3};
        z-index: 9999;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        animation: confetti-fall ${Math.random() * 3 + 2}s linear forwards;
      `
      document.body.appendChild(confetti)

      // Remove after animation
      setTimeout(() => {
        confetti.remove()
      }, 5000)
    }

    // Add confetti animation styles
    const style = document.createElement('style')
    style.textContent = `
      @keyframes confetti-fall {
        to {
          transform: translateY(100vh) rotate(${Math.random() * 720}deg);
          opacity: 0;
        }
      }
      @keyframes pulse-slow {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      style.remove()
    }
  }, [])

  return null
}
