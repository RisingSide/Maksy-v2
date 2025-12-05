import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { companies } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * POST /api/upload/company-logo
 * Upload a company logo
 */
export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png'
    const filename = `${context.companyId}/logo-${Date.now()}.${ext}`

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(filename, file, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('company-logos').getPublicUrl(filename)

    // Update company record
    const [updated] = await db
      .update(companies)
      .set({
        logoUrl: publicUrl,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, context.companyId))
      .returning()

    return NextResponse.json({
      success: true,
      url: publicUrl,
      company: updated,
    })
  } catch (error: any) {
    console.error('Error uploading company logo:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to upload company logo' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/upload/company-logo
 * Remove the company logo
 */
export async function DELETE(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current company to find existing logo
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, context.companyId),
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Delete from storage if exists
    if (company.logoUrl) {
      // Extract filename from URL
      const urlParts = company.logoUrl.split('/company-logos/')
      if (urlParts[1]) {
        await supabase.storage.from('company-logos').remove([urlParts[1]])
      }
    }

    // Update company record
    const [updated] = await db
      .update(companies)
      .set({
        logoUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, context.companyId))
      .returning()

    return NextResponse.json({
      success: true,
      company: updated,
    })
  } catch (error: any) {
    console.error('Error deleting company logo:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to delete company logo' },
      { status: 500 }
    )
  }
}
