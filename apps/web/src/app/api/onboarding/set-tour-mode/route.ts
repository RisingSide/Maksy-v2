import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { onboardingProgress } from '@/db/schema'
import { eq } from 'drizzle-orm'

export interface SetTourModeRequest {
  tourMode: 'pending' | 'guided' | 'checklist' | 'completed' | 'dismissed'
}

/**
 * POST /api/onboarding/set-tour-mode
 * Update user's tour mode preference
 */
export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId } = context
    const body: SetTourModeRequest = await request.json()

    // Validate tour mode
    const validModes = [
      'pending',
      'guided',
      'checklist',
      'completed',
      'dismissed',
    ]
    if (!validModes.includes(body.tourMode)) {
      return NextResponse.json({ error: 'Invalid tour mode' }, { status: 400 })
    }

    // Update tour mode
    await db
      .update(onboardingProgress)
      .set({
        tourMode: body.tourMode,
        dismissedAt: body.tourMode === 'dismissed' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(onboardingProgress.companyId, companyId))

    return NextResponse.json({
      message: 'Tour mode updated successfully',
      tourMode: body.tourMode,
      success: true,
    })
  } catch (error) {
    console.error('Error setting tour mode:', error)
    return NextResponse.json(
      { error: 'Failed to set tour mode' },
      { status: 500 }
    )
  }
}
