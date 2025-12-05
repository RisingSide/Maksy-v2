'use client'

import { ProtectedError } from '@/components/protected-error'

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ProtectedError error={error} reset={reset} pageName="Jobs" />
}
