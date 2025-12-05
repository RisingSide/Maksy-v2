import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { teamMembers, subscriptions } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { z } from 'zod'
import { clerkClient } from '@clerk/nextjs/server'

/**
 * POST /api/team/create-direct
 * Create a team member directly with a Clerk account
 * This bypasses the invitation flow and creates an active team member immediately
 */

const createDirectSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().nullable(),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  role: z.enum(['admin', 'team_member']).default('team_member'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  hourlyRate: z.number().min(0).optional().nullable(),
  commissionRate: z.number().min(0).max(100).optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and owners can add team members directly
    // This is a more privileged action than inviting
    const currentUserMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.companyId, context.companyId),
        eq(teamMembers.userId, context.userId)
      ),
    })

    if (
      !currentUserMember ||
      (currentUserMember.role !== 'owner' && currentUserMember.role !== 'admin')
    ) {
      return NextResponse.json(
        { error: 'Only owners and admins can directly add team members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createDirectSchema.parse(body)

    // Get current subscription to check limits
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.companyId, context.companyId),
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 403 }
      )
    }

    // Check team member limits based on plan
    const [currentCount] = await db
      .select({ count: count() })
      .from(teamMembers)
      .where(eq(teamMembers.companyId, context.companyId))

    const planType = subscription.planType as 'pro' | 'scale' | 'team'

    if (planType === 'pro' && currentCount.count >= 5) {
      return NextResponse.json(
        {
          error:
            'Pro plan is limited to 5 team members. Upgrade to Scale for unlimited team members.',
        },
        { status: 403 }
      )
    }

    if (planType === 'team') {
      const seatCount = subscription.seatCount || 1
      if (currentCount.count >= seatCount) {
        return NextResponse.json(
          {
            error: `Your Team plan has ${seatCount} seats. Purchase additional seats to add more team members.`,
          },
          { status: 403 }
        )
      }
    }

    // Check if email is already used in this company
    const existingMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.companyId, context.companyId),
        eq(teamMembers.email, validatedData.email)
      ),
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'A team member with this email already exists' },
        { status: 409 }
      )
    }

    // Create Clerk user account
    let clerkUser
    try {
      const clerk = await clerkClient()
      clerkUser = await clerk.users.createUser({
        emailAddress: [validatedData.email],
        password: validatedData.password,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName || undefined,
        skipPasswordChecks: false,
        skipPasswordRequirement: false,
      })
    } catch (clerkError: any) {
      console.error('Clerk user creation failed:', clerkError)

      // Handle specific Clerk errors
      if (clerkError.errors) {
        const errorMessages = clerkError.errors
          .map((e: any) => e.message)
          .join(', ')
        return NextResponse.json(
          { error: `Failed to create user account: ${errorMessages}` },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error:
            'Failed to create user account. The email may already be registered.',
        },
        { status: 400 }
      )
    }

    // Create team member with active status
    const [teamMember] = await db
      .insert(teamMembers)
      .values({
        companyId: context.companyId,
        userId: clerkUser.id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName || null,
        email: validatedData.email,
        phone: validatedData.phone || null,
        role: validatedData.role,
        status: 'active',
        acceptedAt: new Date(),
        hourlyRate: validatedData.hourlyRate?.toString() || null,
        commissionRate: validatedData.commissionRate?.toString() || null,
      })
      .returning()

    return NextResponse.json(
      {
        success: true,
        teamMember: {
          id: teamMember.id,
          firstName: teamMember.firstName,
          lastName: teamMember.lastName,
          email: teamMember.email,
          role: teamMember.role,
          status: teamMember.status,
        },
        message: `${validatedData.firstName} has been added to your team`,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating team member directly:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    )
  }
}
