'use client'

import { ProtectedError } from '@/components/protected-error'

export default function TimeGpsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ProtectedError error={error} reset={reset} pageName="Time & GPS" />
}
