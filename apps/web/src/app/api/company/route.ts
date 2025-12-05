import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { companies, companySettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

/**
 * GET /api/company
 * Get the current user's company profile and settings
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get company
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, context.companyId),
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get company settings
    const settings = await db.query.companySettings.findFirst({
      where: eq(companySettings.companyId, context.companyId),
    })

    return NextResponse.json({
      company,
      settings,
    })
  } catch (error: any) {
    console.error('Error fetching company:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/company
 * Update company profile
 */

const updateCompanySchema = z.object({
  companyName: z.string().min(1, 'Company name is required').optional(),
  industry: z.string().optional().nullable(),
  businessPhone: z.string().optional().nullable(),
  businessEmail: z.string().email().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  timeZone: z.string().optional(),
  // Social links
  facebookUrl: z.string().url().optional().nullable(),
  instagramUrl: z.string().url().optional().nullable(),
  twitterUrl: z.string().url().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  yelpUrl: z.string().url().optional().nullable(),
  googleBusinessUrl: z.string().url().optional().nullable(),
})

export async function PATCH(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()

    // Validate request body
    const validatedData = updateCompanySchema.parse(body)

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    }

    // Map all fields
    if (validatedData.companyName !== undefined)
      updateData.companyName = validatedData.companyName
    if (validatedData.industry !== undefined)
      updateData.industry = validatedData.industry
    if (validatedData.businessPhone !== undefined)
      updateData.businessPhone = validatedData.businessPhone
    if (validatedData.businessEmail !== undefined)
      updateData.businessEmail = validatedData.businessEmail
    if (validatedData.websiteUrl !== undefined)
      updateData.websiteUrl = validatedData.websiteUrl
    if (validatedData.addressLine1 !== undefined)
      updateData.addressLine1 = validatedData.addressLine1
    if (validatedData.addressLine2 !== undefined)
      updateData.addressLine2 = validatedData.addressLine2
    if (validatedData.city !== undefined) updateData.city = validatedData.city
    if (validatedData.state !== undefined)
      updateData.state = validatedData.state
    if (validatedData.zipCode !== undefined)
      updateData.zipCode = validatedData.zipCode
    if (validatedData.country !== undefined)
      updateData.country = validatedData.country
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description
    if (validatedData.tagline !== undefined)
      updateData.tagline = validatedData.tagline
    if (validatedData.timeZone !== undefined)
      updateData.timeZone = validatedData.timeZone
    if (validatedData.facebookUrl !== undefined)
      updateData.facebookUrl = validatedData.facebookUrl
    if (validatedData.instagramUrl !== undefined)
      updateData.instagramUrl = validatedData.instagramUrl
    if (validatedData.twitterUrl !== undefined)
      updateData.twitterUrl = validatedData.twitterUrl
    if (validatedData.linkedinUrl !== undefined)
      updateData.linkedinUrl = validatedData.linkedinUrl
    if (validatedData.yelpUrl !== undefined)
      updateData.yelpUrl = validatedData.yelpUrl
    if (validatedData.googleBusinessUrl !== undefined)
      updateData.googleBusinessUrl = validatedData.googleBusinessUrl

    // Update company
    const [updated] = await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.id, context.companyId))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating company:', error)

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
      { error: 'Failed to update company' },
      { status: 500 }
    )
  }
}
