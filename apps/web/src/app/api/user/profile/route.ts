import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db/index.server'
import { userProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { sanitizeInput, sanitizePhone } from '@/lib/sanitization'

/**
 * GET /api/user/profile
 * Get current user's profile
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error: unknown) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/profile
 * Update current user's profile
 */
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().optional().nullable(),
  timeZone: z.string().optional(),
  language: z.string().optional(),
})

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Check if profile exists
    const existingProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    })

    // Sanitize inputs
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (validatedData.firstName !== undefined) {
      updateData.firstName = sanitizeInput(validatedData.firstName)
    }
    if (validatedData.lastName !== undefined) {
      updateData.lastName = sanitizeInput(validatedData.lastName)
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone
        ? sanitizePhone(validatedData.phone)
        : null
    }
    if (validatedData.timeZone !== undefined) {
      updateData.timeZone = validatedData.timeZone
    }
    if (validatedData.language !== undefined) {
      updateData.language = validatedData.language
    }

    let profile

    if (existingProfile) {
      // Update existing profile
      const [updated] = await db
        .update(userProfiles)
        .set(updateData)
        .where(eq(userProfiles.userId, userId))
        .returning()

      profile = updated
    } else {
      // Create new profile
      const [created] = await db
        .insert(userProfiles)
        .values({
          userId,
          firstName: (updateData.firstName as string) || 'User',
          lastName: (updateData.lastName as string) || '',
          phone: updateData.phone as string | null,
          timeZone: (updateData.timeZone as string) || 'America/New_York',
          language: (updateData.language as string) || 'en',
        })
        .returning()

      profile = created
    }

    return NextResponse.json(profile)
  } catch (error: unknown) {
    console.error('Error updating profile:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
