import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { db } from '@/db/index.server'
import { jobs, jobMedia } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES_PER_JOB = 20
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
  'video/quicktime',
]

/**
 * POST /api/upload/job-media
 * Upload media (photos/videos) for a job
 */
export async function POST(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const jobId = formData.get('jobId') as string | null
    const caption = formData.get('caption') as string | null
    const isBeforePhoto = formData.get('isBeforePhoto') === 'true'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Verify job belongs to company
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, jobId), eq(jobs.companyId, context.companyId)),
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check existing media count
    const [mediaCount] = await db
      .select({ count: count() })
      .from(jobMedia)
      .where(eq(jobMedia.jobId, jobId))

    if (mediaCount.count + files.length > MAX_FILES_PER_JOB) {
      return NextResponse.json(
        {
          error: `Maximum ${MAX_FILES_PER_JOB} files per job. Current: ${mediaCount.count}`,
        },
        { status: 400 }
      )
    }

    const uploadedMedia: any[] = []
    const errors: string[] = []

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(
          `${file.name}: Invalid file type. Allowed: JPEG, PNG, WebP, HEIC, MP4, MOV`
        )
        continue
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large. Maximum size is 10MB`)
        continue
      }

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'jpg'
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(7)
      const filename = `${context.companyId}/${jobId}/${timestamp}-${random}.${ext}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('job-media')
        .upload(filename, file, {
          contentType: file.type,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        errors.push(`${file.name}: Upload failed`)
        continue
      }

      // Get URL (private bucket - use signed URL)
      const { data: signedUrlData } = await supabase.storage
        .from('job-media')
        .createSignedUrl(filename, 60 * 60 * 24 * 7) // 7 day expiry

      // Determine media type
      const mediaType = file.type.startsWith('video/') ? 'video' : 'photo'

      // Create media record
      const [media] = await db
        .insert(jobMedia)
        .values({
          companyId: context.companyId,
          jobId,
          mediaType: isBeforePhoto ? 'before' : 'after',
          fileUrl: filename, // Store path, not full URL (for signed URL generation)
          caption: caption || null,
          uploadedBy: context.userId,
        })
        .returning()

      uploadedMedia.push({
        ...media,
        signedUrl: signedUrlData?.signedUrl,
      })
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedMedia.length,
      failed: errors.length,
      media: uploadedMedia,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error uploading job media:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to upload job media' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/upload/job-media
 * Get all media for a job
 */
export async function GET(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Verify job belongs to company
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, jobId), eq(jobs.companyId, context.companyId)),
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Get media
    const media = await db
      .select()
      .from(jobMedia)
      .where(eq(jobMedia.jobId, jobId))
      .orderBy(jobMedia.uploadedAt)

    // Generate signed URLs for each
    const mediaWithUrls = await Promise.all(
      media.map(async (m) => {
        const { data } = await supabase.storage
          .from('job-media')
          .createSignedUrl(m.fileUrl, 60 * 60 * 24) // 24 hour expiry

        return {
          ...m,
          signedUrl: data?.signedUrl,
        }
      })
    )

    return NextResponse.json({
      media: mediaWithUrls,
      total: mediaWithUrls.length,
    })
  } catch (error: any) {
    console.error('Error fetching job media:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch job media' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/upload/job-media
 * Delete a media item
 */
export async function DELETE(request: Request) {
  try {
    const context = await getAuthContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get('mediaId')

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      )
    }

    // Get media with job to verify ownership
    const media = await db.query.jobMedia.findFirst({
      where: eq(jobMedia.id, mediaId),
    })

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Verify job belongs to company
    const job = await db.query.jobs.findFirst({
      where: and(
        eq(jobs.id, media.jobId),
        eq(jobs.companyId, context.companyId)
      ),
    })

    if (!job) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete from storage
    await supabase.storage.from('job-media').remove([media.fileUrl])

    // Delete record
    await db.delete(jobMedia).where(eq(jobMedia.id, mediaId))

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting job media:', error)

    if (
      error.message === 'Unauthorized' ||
      error.message === 'No company found for user'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to delete job media' },
      { status: 500 }
    )
  }
}
