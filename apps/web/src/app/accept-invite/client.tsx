'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useUser, SignIn, SignUp } from '@clerk/nextjs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  CheckCircle,
  XCircle,
  UserPlus,
  Shield,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

interface InviteDetails {
  valid: boolean
  teamMember: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: 'admin' | 'team_member' | 'owner'
  }
  companyName: string
}

export function AcceptInviteClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isSignedIn, isLoaded, user } = useUser()

  const token = searchParams.get('token')

  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [showAuth, setShowAuth] = useState<'sign-in' | 'sign-up' | null>(null)
  const [accepted, setAccepted] = useState(false)

  // Validate the invitation token
  useEffect(() => {
    async function validateInvite() {
      if (!token) {
        setError('No invitation token provided')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/team/accept-invite?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Invalid invitation')
          setIsLoading(false)
          return
        }

        setInviteDetails(data)
        setIsLoading(false)
      } catch {
        setError('Failed to validate invitation')
        setIsLoading(false)
      }
    }

    validateInvite()
  }, [token])

  // Accept the invitation once signed in
  async function acceptInvitation() {
    if (!token || !isSignedIn) return

    setIsAccepting(true)
    try {
      const response = await fetch('/api/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to accept invitation')
        setIsAccepting(false)
        return
      }

      setAccepted(true)
      setIsAccepting(false) // Reset loading state on success
      toast.success('Welcome to the team!')

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch {
      toast.error('Failed to accept invitation')
      setIsAccepting(false)
    }
  }

  // Loading state
  if (isLoading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-6">
        <Card className="glass-card p-8 max-w-md w-full text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Validating Invitation...</h2>
          <p className="text-muted-foreground mt-2">
            Please wait while we verify your invitation.
          </p>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-6">
        <Card className="glass-card p-8 max-w-md w-full text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Invalid Invitation</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button className="mt-6" onClick={() => router.push('/')}>
            Go to Homepage
          </Button>
        </Card>
      </div>
    )
  }

  // Success state - invitation accepted
  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-6">
        <Card className="glass-card p-8 max-w-md w-full text-center animate-scale-in">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Welcome to the Team!</h2>
          <p className="text-muted-foreground mt-2">
            You&apos;ve successfully joined{' '}
            <strong>{inviteDetails?.companyName}</strong>.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Redirecting to your dashboard...
          </p>
        </Card>
      </div>
    )
  }

  // Show auth forms if not signed in
  if (!isSignedIn && showAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">
              Join {inviteDetails?.companyName}
            </h1>
            <p className="text-muted-foreground">
              {showAuth === 'sign-up'
                ? 'Create your account to continue'
                : 'Sign in to accept the invitation'}
            </p>
          </div>

          {showAuth === 'sign-up' ? (
            <SignUp
              routing="hash"
              afterSignUpUrl={`/accept-invite?token=${token}`}
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'shadow-none border-0',
                },
              }}
            />
          ) : (
            <SignIn
              routing="hash"
              afterSignInUrl={`/accept-invite?token=${token}`}
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'shadow-none border-0',
                },
              }}
            />
          )}

          <div className="text-center mt-4">
            <Button
              variant="ghost"
              onClick={() =>
                setShowAuth(showAuth === 'sign-up' ? 'sign-in' : 'sign-up')
              }
            >
              {showAuth === 'sign-up'
                ? 'Already have an account? Sign in'
                : 'Need an account? Sign up'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Main invitation view
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-6">
      <Card className="glass-card p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">You&apos;re Invited!</h1>
          <p className="text-muted-foreground mt-2">
            Join <strong>{inviteDetails?.companyName}</strong> on Maksy
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Invited as</span>
            <Badge className="gap-1">
              {inviteDetails?.teamMember.role === 'admin' ? (
                <>
                  <Shield className="h-3 w-3" />
                  Admin
                </>
              ) : (
                <>
                  <User className="h-3 w-3" />
                  Team Member
                </>
              )}
            </Badge>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="font-medium">
              {inviteDetails?.teamMember.firstName}{' '}
              {inviteDetails?.teamMember.lastName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="font-medium text-sm">
              {inviteDetails?.teamMember.email}
            </span>
          </div>
        </div>

        {isSignedIn ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Signed in as{' '}
              <strong>{user?.primaryEmailAddress?.emailAddress}</strong>
            </p>
            <Button
              className="w-full"
              size="lg"
              onClick={acceptInvitation}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Invitation
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={() => setShowAuth('sign-up')}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Create Account & Join
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setShowAuth('sign-in')}
            >
              Already have an account? Sign In
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-6">
          By accepting this invitation, you agree to Maksy&apos;s Terms of
          Service and Privacy Policy.
        </p>
      </Card>
    </div>
  )
}
