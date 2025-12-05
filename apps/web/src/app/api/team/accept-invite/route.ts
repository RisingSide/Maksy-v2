import { NextResponse } from 'next/server'
import { db } from '@/db/index.server'
import { teamMembers, companies } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'

const acceptInviteSchema = z.object({
  token: z.string().uuid('Invalid invitation token'),
})

/**
 * GET /api/team/accept-invite?token=xxx
 * Validate an invitation token and return team member details
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Find team member by invitation token
    const teamMember = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.invitationToken, token),
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    if (teamMember.status !== 'invited') {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    // Check if invitation is expired (7 days)
    if (teamMember.invitationSentAt) {
      const expirationDate = new Date(teamMember.invitationSentAt)
      expirationDate.setDate(expirationDate.getDate() + 7)

      if (new Date() > expirationDate) {
        return NextResponse.json(
          {
            error:
              'This invitation has expired. Please ask for a new invitation.',
          },
          { status: 410 }
        )
      }
    }

    // Get company name
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, teamMember.companyId),
    })

    return NextResponse.json({
      valid: true,
      teamMember: {
        id: teamMember.id,
        firstName: teamMember.firstName,
        lastName: teamMember.lastName,
        email: teamMember.email,
        role: teamMember.role,
      },
      companyName: company?.companyName || 'Unknown Company',
    })
  } catch (error) {
    console.error('Error validating invitation:', error)
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/team/accept-invite
 * Accept an invitation and link the Clerk user to the team member
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'You must be signed in to accept an invitation' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { token } = acceptInviteSchema.parse(body)

    // Find team member by invitation token
    const teamMember = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.invitationToken, token),
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    if (teamMember.status !== 'invited') {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    // Check if this Clerk user is already linked to another team member
    const existingLink = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
    })

    if (existingLink) {
      return NextResponse.json(
        {
          error:
            'Your account is already linked to a team. Please use a different account or contact support.',
        },
        { status: 409 }
      )
    }

    // Update team member with Clerk user ID and activate
    const [updated] = await db
      .update(teamMembers)
      .set({
        userId,
        status: 'active',
        acceptedAt: new Date(),
        invitationToken: null, // Clear the token
        updatedAt: new Date(),
      })
      .where(eq(teamMembers.id, teamMember.id))
      .returning()

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      teamMember: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        role: updated.role,
        status: updated.status,
      },
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
