import { getAuthContext } from '@/lib/auth-helpers'
import { SecuritySettingsClient } from './client'

export default async function SecuritySettingsPage() {
  const context = await getAuthContext()

  if (!context) {
    return <div>Unauthorized</div>
  }

  return <SecuritySettingsClient />
}
