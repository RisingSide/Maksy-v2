import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { companySettings, companies } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { BookingSettingsClient } from './client'

export default async function BookingSettingsPage() {
  const context = await getAuthContext()

  if (!context) {
    return <div>Unauthorized</div>
  }

  // Get company info
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, context.companyId),
    columns: {
      id: true,
      slug: true,
      companyName: true,
    },
  })

  // Get company settings
  const settings = await db.query.companySettings.findFirst({
    where: eq(companySettings.companyId, context.companyId),
  })

  // Default business hours
  const defaultBusinessHours = {
    monday: { open: '09:00', close: '17:00', enabled: true },
    tuesday: { open: '09:00', close: '17:00', enabled: true },
    wednesday: { open: '09:00', close: '17:00', enabled: true },
    thursday: { open: '09:00', close: '17:00', enabled: true },
    friday: { open: '09:00', close: '17:00', enabled: true },
    saturday: { open: '09:00', close: '13:00', enabled: false },
    sunday: { open: '09:00', close: '13:00', enabled: false },
  }

  return (
    <BookingSettingsClient
      companySlug={company?.slug || ''}
      companyName={company?.companyName || ''}
      settings={{
        bookingLeadTimeHours: settings?.bookingLeadTimeHours ?? 2,
        bookingSlotSizeMinutes: settings?.bookingSlotSizeMinutes ?? 30,
        schedulingWindowDays: settings?.schedulingWindowDays ?? 30,
        cancellationHoursBefore: settings?.cancellationHoursBefore ?? 24,
        enableDoubleBooking: settings?.enableDoubleBooking ?? false,
        bookingPagePrimaryColor: settings?.bookingPagePrimaryColor ?? '#f4a125',
        bookingPageButtonColor: settings?.bookingPageButtonColor ?? '#f4a125',
        removeMaksyBranding: settings?.removeMaksyBranding ?? false,
        businessHours: defaultBusinessHours,
      }}
    />
  )
}
