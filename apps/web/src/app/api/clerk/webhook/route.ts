import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/db/index.server'
import {
  userProfiles,
  companies,
  teamMembers,
  companySettings,
  subscriptions,
  onboardingProgress,
} from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
    )
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the event
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, unsafe_metadata } =
      evt.data

    if (!id || !email_addresses || email_addresses.length === 0) {
      return new Response('Error occured -- missing data', {
        status: 400,
      })
    }

    const email = email_addresses[0].email_address
    const plan = (unsafe_metadata?.plan as 'pro' | 'scale' | 'team') || 'pro' // Default to pro trial

    try {
      // IDEMPOTENCY CHECK: See if user records already exist
      // This handles the case where onboarding form created records before webhook fired
      const existingTeamMember = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, id),
      })

      if (existingTeamMember) {
        console.log(
          'User records already exist (onboarding form created them), skipping webhook creation for:',
          id
        )
        return new Response('User already exists', { status: 200 })
      }

      // Default timezone - user can update in settings after onboarding
      const defaultTimeZone = 'America/New_York'

      // 1. Check & create user_profile (may exist from a partial previous attempt)
      const existingProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, id),
      })

      if (!existingProfile) {
        await db.insert(userProfiles).values({
          userId: id,
          firstName: first_name || email.split('@')[0],
          lastName: last_name || '',
          timeZone: defaultTimeZone,
        })
      }

      // 2. Create company
      const initialSlug = email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
      const [company] = await db
        .insert(companies)
        .values({
          ownerUserId: id,
          companyName: 'My Company',
          slug: `${initialSlug}-${Math.random().toString(36).substring(2, 6)}`,
          timeZone: defaultTimeZone,
        })
        .returning()

      // 3. Create team_member (Owner)
      await db.insert(teamMembers).values({
        companyId: company.id,
        userId: id,
        firstName: first_name || email.split('@')[0],
        lastName: last_name || '',
        email: email,
        role: 'owner',
        status: 'active',
        acceptedAt: new Date(),
      })

      // 4. Create company_settings
      await db.insert(companySettings).values({
        companyId: company.id,
      })

      // 5. Create subscription
      // Pro and Scale plans get 14-day trial, Team plan starts active
      await db.insert(subscriptions).values({
        companyId: company.id,
        planType: plan,
        status: plan === 'team' ? 'active' : 'trialing',
        trialEndsAt:
          plan !== 'team'
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            : null,
        seatCount: plan === 'team' ? 1 : null,
      })

      // 6. Create onboarding progress
      await db.insert(onboardingProgress).values({
        companyId: company.id,
        criticalCompleted: false,
        tasksCompleted: {
          add_services: false,
          import_customers: false,
          create_first_job: false,
          connect_stripe: false,
          customize_booking_page: false,
          add_team_members: false,
          setup_automation: false,
        },
        completionPercentage: 0,
        tourMode: 'pending',
      })

      console.log('Webhook successfully created user records for:', id)
      return new Response('User created successfully', { status: 200 })
    } catch (error) {
      console.error('Error creating user in DB:', error)
      return new Response('Error creating user in DB', { status: 500 })
    }
  }

  return new Response('', { status: 200 })
}
