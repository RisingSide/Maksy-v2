import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import {
  estimates,
  customers,
  companies,
  teamMembers,
  userProfiles,
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendEstimateApprovedNotification } from '@/lib/notifications'

/**
 * POST /api/estimates/[id]/approve
 * Approve an estimate (can be called by customer via public link or by company)
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

    // Get estimate with customer
    const estimateResult = await db
      .select({
        estimate: estimates,
        customer: customers,
      })
      .from(estimates)
      .innerJoin(customers, eq(estimates.customerId, customers.id))
      .where(
        and(eq(estimates.id, id), eq(estimates.companyId, context.companyId))
      )
      .limit(1)

    if (!estimateResult || estimateResult.length === 0) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    const { estimate: existingEstimate, customer } = estimateResult[0]

    // Check if estimate can be approved
    if (existingEstimate.status === 'approved') {
      return NextResponse.json(
        { error: 'Estimate is already approved' },
        { status: 400 }
      )
    }

    if (existingEstimate.status === 'declined') {
      return NextResponse.json(
        { error: 'Cannot approve a declined estimate' },
        { status: 400 }
      )
    }

    // Check expiration
    if (existingEstimate.expirationDate) {
      const expirationDate = new Date(existingEstimate.expirationDate)
      if (expirationDate < new Date()) {
        return NextResponse.json(
          { error: 'Estimate has expired' },
          { status: 400 }
        )
      }
    }

    // Update estimate
    const [updated] = await db
      .update(estimates)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(eq(estimates.id, id), eq(estimates.companyId, context.companyId))
      )
      .returning()

    // Get company and owner info for notification
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, context.companyId),
    })

    if (company) {
      // Get owner team member
      const ownerMember = await db
        .select({
          teamMember: teamMembers,
          profile: userProfiles,
        })
        .from(teamMembers)
        .leftJoin(userProfiles, eq(teamMembers.userId, userProfiles.userId))
        .where(
          and(
            eq(teamMembers.companyId, context.companyId),
            eq(teamMembers.role, 'owner')
          )
        )
        .limit(1)

      if (ownerMember.length > 0) {
        const owner = ownerMember[0]
        const ownerEmail = owner.teamMember.email

        if (ownerEmail) {
          const appUrl =
            process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

          // Send notification to owner (fire and forget - don't block response)
          sendEstimateApprovedNotification({
            ownerEmail,
            ownerName: owner.profile?.firstName || 'there',
            customerName: `${customer.firstName} ${customer.lastName}`,
            estimateNumber: existingEstimate.estimateNumber,
            amount: parseFloat(existingEstimate.total?.toString() || '0'),
            dashboardLink: `${appUrl}/estimates/${id}`,
          }).catch((err) => {
            console.error('Failed to send estimate approved notification:', err)
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Estimate approved',
      estimate: updated,
    })
  } catch (error: unknown) {
    console.error('Error approving estimate:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    if (
      errorMessage === 'Unauthorized' ||
      errorMessage === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to approve estimate' },
      { status: 500 }
    )
  }
}
