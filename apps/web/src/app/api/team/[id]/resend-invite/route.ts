import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { teamMembers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendEmail } from '@/lib/resend'
import {
  generateTeamInviteEmail,
  getTeamInviteSubject,
} from '@/lib/email-templates'

/**
 * POST /api/team/[id]/resend-invite
 * Resend invitation email to a team member
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    // Get team member
    const teamMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.id, id),
        eq(teamMembers.companyId, context.companyId)
      ),
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Check if member is in invited status
    if (teamMember.status !== 'invited') {
      return NextResponse.json(
        { error: 'Can only resend invitations to members with invited status' },
        { status: 400 }
      )
    }

    // Generate new invitation token
    const invitationToken = crypto.randomUUID()

    // Update invitation token and timestamp
    const [updated] = await db
      .update(teamMembers)
      .set({
        invitationToken,
        invitationSentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(teamMembers.id, id),
          eq(teamMembers.companyId, context.companyId)
        )
      )
      .returning()

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${appUrl}/accept-invite?token=${invitationToken}`

    const emailResult = await sendEmail({
      to: teamMember.email,
      subject: `Reminder: ${getTeamInviteSubject(context.companyName)}`,
      html: generateTeamInviteEmail({
        inviteeName: teamMember.firstName,
        inviterName: context.userName || 'Your team',
        companyName: context.companyName,
        inviteLink,
        role: teamMember.role as 'admin' | 'team_member',
        expiresIn: '7 days',
      }),
    })

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success,
      message: emailResult.success
        ? `Invitation resent to ${teamMember.email}`
        : `Invitation updated but email failed to send. Share this link: ${inviteLink}`,
      inviteLink: !emailResult.success ? inviteLink : undefined,
    })
  } catch (error: any) {
    console.error('Error resending invitation:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to resend invitation' },
      { status: 500 }
    )
  }
}
