'use client'

import { ProtectedError } from '@/components/protected-error'

export default function BuilderError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ProtectedError error={error} reset={reset} pageName="Automation Builder" />
  )
}
