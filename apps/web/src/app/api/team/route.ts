import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { teamMembers, subscriptions } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { z } from 'zod'
import { sendEmail } from '@/lib/resend'
import {
  generateTeamInviteEmail,
  getTeamInviteSubject,
} from '@/lib/email-templates'

/**
 * GET /api/team
 * List all team members for the authenticated user's company
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') // 'invited', 'active', 'deactivated'
    const role = searchParams.get('role') // 'owner', 'admin', 'team_member'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where conditions
    const whereConditions = [eq(teamMembers.companyId, context.companyId)]

    if (status) {
      whereConditions.push(eq(teamMembers.status, status as any))
    }

    if (role) {
      whereConditions.push(eq(teamMembers.role, role as any))
    }

    // Execute query
    const results = await db
      .select()
      .from(teamMembers)
      .where(and(...whereConditions))
      .orderBy(teamMembers.role, teamMembers.firstName)
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const [totalCount] = await db
      .select({ count: count() })
      .from(teamMembers)
      .where(eq(teamMembers.companyId, context.companyId))

    return NextResponse.json({
      teamMembers: results,
      total: totalCount.count,
      has_more: offset + results.length < totalCount.count,
    })
  } catch (error: any) {
    console.error('Error fetching team members:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/team
 * Add a new team member (creates invite)
 */

const createTeamMemberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().nullable(),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  role: z.enum(['admin', 'team_member']).default('team_member'),
  hourlyRate: z.number().min(0).optional().nullable(),
  commissionRate: z.number().min(0).max(100).optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()

    // Validate request body
    const validatedData = createTeamMemberSchema.parse(body)

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

    // Pro: 5 team members, Scale: unlimited, Team: based on seats
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

    // Generate invitation token
    const invitationToken = crypto.randomUUID()

    // Create team member with invited status
    const [teamMember] = await db
      .insert(teamMembers)
      .values({
        companyId: context.companyId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName || null,
        email: validatedData.email,
        phone: validatedData.phone || null,
        role: validatedData.role,
        status: 'invited',
        invitationToken,
        invitationSentAt: new Date(),
        hourlyRate: validatedData.hourlyRate?.toString() || null,
        commissionRate: validatedData.commissionRate?.toString() || null,
      })
      .returning()

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${appUrl}/accept-invite?token=${invitationToken}`

    const emailResult = await sendEmail({
      to: validatedData.email,
      subject: getTeamInviteSubject(context.companyName),
      html: generateTeamInviteEmail({
        inviteeName: validatedData.firstName,
        inviterName: context.userName || 'Your team',
        companyName: context.companyName,
        inviteLink,
        role: validatedData.role,
        expiresIn: '7 days',
      }),
    })

    // Log email status but don't fail the request if email fails
    if (!emailResult.success) {
      console.warn('[Team Invite] Email failed to send:', emailResult.error)
    }

    return NextResponse.json(
      {
        ...teamMember,
        emailSent: emailResult.success,
        inviteLink: !emailResult.success ? inviteLink : undefined, // Provide link if email failed
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating team member:', error)

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
