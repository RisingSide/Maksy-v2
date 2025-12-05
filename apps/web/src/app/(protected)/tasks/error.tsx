'use client'

import { ProtectedError } from '@/components/protected-error'

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ProtectedError error={error} reset={reset} pageName="Tasks" />
}
