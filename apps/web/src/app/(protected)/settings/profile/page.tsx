import { auth } from '@clerk/nextjs/server'
import { db } from '@/db/index.server'
import { userProfiles, teamMembers } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { ProfileSettingsClient } from './client'

export default async function ProfileSettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  // Get user profile
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  })

  // Get team member record for role info
  const teamMember = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, userId),
  })

  return (
    <ProfileSettingsClient
      profile={
        profile
          ? {
              firstName: profile.firstName,
              lastName: profile.lastName,
              phone: profile.phone,
              avatarUrl: profile.avatarUrl,
              timeZone: profile.timeZone,
              language: profile.language,
            }
          : null
      }
      role={teamMember?.role || 'team_member'}
      email={teamMember?.email || ''}
    />
  )
}
