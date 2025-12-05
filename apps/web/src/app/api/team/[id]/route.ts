import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { teamMembers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/team/[id]
 * Get a single team member by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

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

    return NextResponse.json(teamMember)
  } catch (error: any) {
    console.error('Error fetching team member:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch team member' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/team/[id]
 * Update a team member
 */

const updateTeamMemberSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional().nullable(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['admin', 'team_member']).optional(),
  status: z.enum(['active', 'deactivated']).optional(),
  hourlyRate: z.number().min(0).optional().nullable(),
  commissionRate: z.number().min(0).max(100).optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = updateTeamMemberSchema.parse(body)

    // Check if team member exists and belongs to company
    const existingMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.id, id),
        eq(teamMembers.companyId, context.companyId)
      ),
    })

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Can't change role of owner
    if (existingMember.role === 'owner' && validatedData.role) {
      return NextResponse.json(
        { error: 'Cannot change role of company owner' },
        { status: 400 }
      )
    }

    // Can't deactivate owner
    if (
      existingMember.role === 'owner' &&
      validatedData.status === 'deactivated'
    ) {
      return NextResponse.json(
        { error: 'Cannot deactivate company owner' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validatedData.firstName !== undefined)
      updateData.firstName = validatedData.firstName
    if (validatedData.lastName !== undefined)
      updateData.lastName = validatedData.lastName
    if (validatedData.email !== undefined)
      updateData.email = validatedData.email
    if (validatedData.phone !== undefined)
      updateData.phone = validatedData.phone
    if (validatedData.role !== undefined) updateData.role = validatedData.role
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status
    if (validatedData.hourlyRate !== undefined)
      updateData.hourlyRate = validatedData.hourlyRate?.toString() || null
    if (validatedData.commissionRate !== undefined)
      updateData.commissionRate =
        validatedData.commissionRate?.toString() || null
    if (validatedData.addressLine1 !== undefined)
      updateData.addressLine1 = validatedData.addressLine1
    if (validatedData.addressLine2 !== undefined)
      updateData.addressLine2 = validatedData.addressLine2
    if (validatedData.city !== undefined) updateData.city = validatedData.city
    if (validatedData.state !== undefined)
      updateData.state = validatedData.state
    if (validatedData.zipCode !== undefined)
      updateData.zipCode = validatedData.zipCode

    // Update team member
    const [updated] = await db
      .update(teamMembers)
      .set(updateData)
      .where(
        and(
          eq(teamMembers.id, id),
          eq(teamMembers.companyId, context.companyId)
        )
      )
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating team member:', error)

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
      { error: 'Failed to update team member' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/team/[id]
 * Remove a team member
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    // Check if team member exists and belongs to company
    const existingMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.id, id),
        eq(teamMembers.companyId, context.companyId)
      ),
    })

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Can't delete owner
    if (existingMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove company owner' },
        { status: 400 }
      )
    }

    // Delete team member
    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.id, id),
          eq(teamMembers.companyId, context.companyId)
        )
      )

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
    })
  } catch (error: any) {
    console.error('Error removing team member:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    )
  }
}
