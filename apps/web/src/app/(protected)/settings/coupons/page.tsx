import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { coupons } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { CouponsSettingsClient } from './client'

export default async function CouponsSettingsPage() {
  const context = await getAuthContext()

  if (!context) {
    return <div>Unauthorized</div>
  }

  // Fetch all coupons for this company
  const companyCoupons = await db
    .select()
    .from(coupons)
    .where(eq(coupons.companyId, context.companyId))
    .orderBy(desc(coupons.createdAt))

  return (
    <CouponsSettingsClient
      coupons={companyCoupons.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        discountType: c.discountType as 'percentage' | 'fixed',
        discountValue: parseFloat(c.discountValue),
        startDate: c.startDate,
        endDate: c.endDate,
        totalUsageLimit: c.totalUsageLimit,
        usagePerCustomerLimit: c.usagePerCustomerLimit,
        isActive: c.isActive,
        minimumOrderValue: c.minimumOrderValue
          ? parseFloat(c.minimumOrderValue)
          : null,
      }))}
      planType={context.planType}
    />
  )
}
