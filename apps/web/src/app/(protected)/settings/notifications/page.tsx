import { getAuthContext } from '@/lib/auth-helpers'
import { NotificationsSettingsClient } from './client'

export default async function NotificationsSettingsPage() {
  const context = await getAuthContext()

  if (!context) {
    return <div>Unauthorized</div>
  }

  // Default notification preferences (would be stored in user_settings or company_settings)
  const defaultPreferences = {
    // Email notifications
    emailNewBooking: true,
    emailJobReminder: true,
    emailPaymentReceived: true,
    emailInvoiceOverdue: true,
    emailEstimateApproved: true,
    emailTeamInvite: true,
    emailWeeklyReport: true,

    // SMS notifications
    smsNewBooking: false,
    smsJobReminder: true,
    smsPaymentReceived: false,

    // Push notifications (future)
    pushEnabled: false,

    // Quiet hours
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  }

  return (
    <NotificationsSettingsClient
      preferences={defaultPreferences}
      planType={context.planType}
    />
  )
}
