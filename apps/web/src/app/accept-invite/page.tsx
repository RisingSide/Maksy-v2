import { Suspense } from 'react'
import { AcceptInviteClient } from './client'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function AcceptInviteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-6">
      <Card className="glass-card p-8 max-w-md w-full text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Loading...</h2>
        <p className="text-muted-foreground mt-2">
          Please wait while we load your invitation.
        </p>
      </Card>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AcceptInviteLoading />}>
      <AcceptInviteClient />
    </Suspense>
  )
}
