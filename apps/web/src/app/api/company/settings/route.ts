import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { companySettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/company/settings
 * Get company settings
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await db.query.companySettings.findFirst({
      where: eq(companySettings.companyId, context.companyId),
    })

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error fetching company settings:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch company settings' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/company/settings
 * Update company settings
 */

// Business hours schema for validation
const businessHoursDaySchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
  enabled: z.boolean(),
})

const businessHoursSchema = z.object({
  monday: businessHoursDaySchema.optional(),
  tuesday: businessHoursDaySchema.optional(),
  wednesday: businessHoursDaySchema.optional(),
  thursday: businessHoursDaySchema.optional(),
  friday: businessHoursDaySchema.optional(),
  saturday: businessHoursDaySchema.optional(),
  sunday: businessHoursDaySchema.optional(),
})

const updateSettingsSchema = z.object({
  // Invoice settings
  defaultPaymentTermsDays: z.number().int().min(0).max(365).optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  invoicePrefix: z.string().max(10).optional(),
  invoiceFooterText: z.string().optional().nullable(),

  // Estimate settings
  estimatePrefix: z.string().max(10).optional(),
  estimateValidDays: z.number().int().min(1).max(365).optional(),
  estimateFooterText: z.string().optional().nullable(),

  // Job settings
  jobPrefix: z.string().max(10).optional(),
  defaultJobDurationMinutes: z.number().int().min(15).max(480).optional(),
  requireJobPhotos: z.boolean().optional(),

  // Notification settings
  emailNotificationsEnabled: z.boolean().optional(),
  smsNotificationsEnabled: z.boolean().optional(),
  pushNotificationsEnabled: z.boolean().optional(),

  // Calendar settings
  businessHoursStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  businessHoursEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  workingDays: z.array(z.number().int().min(0).max(6)).optional(),

  // Booking settings
  allowOnlineBooking: z.boolean().optional(),
  bookingBufferMinutes: z.number().int().min(0).max(120).optional(),
  minBookingNoticeHours: z.number().int().min(0).max(168).optional(),
  maxBookingAdvanceDays: z.number().int().min(1).max(365).optional(),
  bookingLeadTimeHours: z.number().int().min(0).max(168).optional(),
  bookingSlotSizeMinutes: z.number().int().min(15).max(120).optional(),
  schedulingWindowDays: z.number().int().min(1).max(365).optional(),
  cancellationHoursBefore: z.number().int().min(0).max(168).optional(),
  enableDoubleBooking: z.boolean().optional(),
  bookingPagePrimaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  bookingPageButtonColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  removeMaksyBranding: z.boolean().optional(),
  businessHours: businessHoursSchema.optional(),

  // Currency
  currency: z.string().length(3).optional(),
})

export async function PATCH(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()

    // Validate request body
    const validatedData = updateSettingsSchema.parse(body)

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    }

    // Map all fields
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value
      }
    })

    // Update settings
    const [updated] = await db
      .update(companySettings)
      .set(updateData)
      .where(eq(companySettings.companyId, context.companyId))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating company settings:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to update company settings' },
      { status: 500 }
    )
  }
}
