import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { services } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

/**
 * POST /api/upload/service-icon
 * Upload a service icon
 */
export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const serviceId = formData.get('serviceId') as string | null
    const cropStyle = formData.get('cropStyle') as string | null // 'circle', 'square', 'rounded'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    // Verify service belongs to company
    const service = await db.query.services.findFirst({
      where: and(
        eq(services.id, serviceId),
        eq(services.companyId, context.companyId)
      ),
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, SVG' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 1MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png'
    const filename = `${context.companyId}/${serviceId}-${Date.now()}.${ext}`

    // Delete old icon if exists
    if (service.iconUrl) {
      const urlParts = service.iconUrl.split('/service-icons/')
      if (urlParts[1]) {
        await supabase.storage.from('service-icons').remove([urlParts[1]])
      }
    }

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('service-icons')
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
    } = supabase.storage.from('service-icons').getPublicUrl(filename)

    // Update service record
    const [updated] = await db
      .update(services)
      .set({
        iconUrl: publicUrl,
        iconCropStyle: cropStyle || 'circle',
        updatedAt: new Date(),
      })
      .where(eq(services.id, serviceId))
      .returning()

    return NextResponse.json({
      success: true,
      url: publicUrl,
      service: updated,
    })
  } catch (error: any) {
    console.error('Error uploading service icon:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to upload service icon' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/upload/service-icon
 * Remove a service icon
 */
export async function DELETE(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    // Verify service belongs to company
    const service = await db.query.services.findFirst({
      where: and(
        eq(services.id, serviceId),
        eq(services.companyId, context.companyId)
      ),
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Delete from storage if exists
    if (service.iconUrl) {
      const urlParts = service.iconUrl.split('/service-icons/')
      if (urlParts[1]) {
        await supabase.storage.from('service-icons').remove([urlParts[1]])
      }
    }

    // Update service record
    const [updated] = await db
      .update(services)
      .set({
        iconUrl: null,
        iconCropStyle: null,
        updatedAt: new Date(),
      })
      .where(eq(services.id, serviceId))
      .returning()

    return NextResponse.json({
      success: true,
      service: updated,
    })
  } catch (error: any) {
    console.error('Error deleting service icon:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to delete service icon' },
      { status: 500 }
    )
  }
}
