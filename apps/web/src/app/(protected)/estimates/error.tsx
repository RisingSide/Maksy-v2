'use client'

import { ProtectedError } from '@/components/protected-error'

export default function EstimatesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ProtectedError error={error} reset={reset} pageName="Estimates" />
}
