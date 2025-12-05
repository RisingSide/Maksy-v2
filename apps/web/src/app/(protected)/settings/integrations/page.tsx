import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { companySettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { IntegrationsSettingsClient } from './client'

export default async function IntegrationsSettingsPage() {
  const context = await getAuthContext()

  if (!context) {
    return <div>Unauthorized</div>
  }

  // Get company settings for integration status
  const settings = await db.query.companySettings.findFirst({
    where: eq(companySettings.companyId, context.companyId),
  })

  return (
    <IntegrationsSettingsClient
      integrations={{
        stripeConnected: settings?.stripeConnected ?? false,
        quickbooksConnected: false, // Future: check OAuth token
        googleCalendarConnected: false,
        googleBusinessConnected: false,
        twilioConnected: !!process.env.TWILIO_ACCOUNT_SID,
        resendConnected: !!process.env.RESEND_API_KEY,
      }}
      planType={context.planType}
    />
  )
}
