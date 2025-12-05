import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { subscriptions, companies, teamMembers } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { BillingSettingsClient } from './client'

export default async function BillingSettingsPage() {
  const context = await getAuthContext()

  if (!context) {
    return null
  }

  // Get subscription
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.companyId, context.companyId),
  })

  // Get company
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, context.companyId),
  })

  // Get team member count
  const [teamCount] = await db
    .select({ count: count() })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.companyId, context.companyId),
        eq(teamMembers.status, 'active')
      )
    )

  return (
    <BillingSettingsClient
      subscription={
        subscription
          ? {
              id: subscription.id,
              planType: subscription.planType,
              status: subscription.status,
              currentPeriodStart:
                subscription.currentPeriodStart?.toISOString() || null,
              currentPeriodEnd:
                subscription.currentPeriodEnd?.toISOString() || null,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              stripeCustomerId: subscription.stripeCustomerId,
              stripeSubscriptionId: subscription.stripeSubscriptionId,
              seatCount: subscription.seatCount ?? 1,
            }
          : null
      }
      companyName={company?.companyName || ''}
      teamMemberCount={teamCount.count}
      isOwner={context.role === 'owner'}
    />
  )
}
