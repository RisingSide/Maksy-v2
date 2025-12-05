import { NextResponse } from 'next/server'
import { db } from '@/db/index.server'
import { companies, services, customers, jobs } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { sanitizeInput, sanitizeEmail, sanitizePhone } from '@/lib/sanitization'
import { sendJobReminderNotification } from '@/lib/notifications'

/**
 * POST /api/public/book/[slug]
 * Public endpoint for customers to book appointments
 * No authentication required
 */

const bookingSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  customer: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
    notes: z.string().optional(),
  }),
})

// Generate unique job number
function generateJobNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `JOB-${timestamp}${random}`
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = bookingSchema.parse(body)

    // Get company by slug
    const company = await db.query.companies.findFirst({
      where: eq(companies.slug, slug),
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get service and verify it belongs to company
    const service = await db.query.services.findFirst({
      where: and(
        eq(services.id, validatedData.serviceId),
        eq(services.companyId, company.id),
        eq(services.isPublic, true)
      ),
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found or not available' },
        { status: 404 }
      )
    }

    // Sanitize customer data
    const sanitizedCustomer = {
      firstName: sanitizeInput(validatedData.customer.firstName),
      lastName: sanitizeInput(validatedData.customer.lastName),
      email: validatedData.customer.email
        ? sanitizeEmail(validatedData.customer.email)
        : null,
      phone: validatedData.customer.phone
        ? sanitizePhone(validatedData.customer.phone)
        : null,
      notes: validatedData.customer.notes
        ? sanitizeInput(validatedData.customer.notes)
        : null,
    }

    // Check if customer already exists (by email or phone)
    let customer = null
    if (sanitizedCustomer.email) {
      customer = await db.query.customers.findFirst({
        where: and(
          eq(customers.companyId, company.id),
          eq(customers.email, sanitizedCustomer.email)
        ),
      })
    }

    if (!customer && sanitizedCustomer.phone) {
      customer = await db.query.customers.findFirst({
        where: and(
          eq(customers.companyId, company.id),
          eq(customers.phone, sanitizedCustomer.phone)
        ),
      })
    }

    // Create customer if not exists
    if (!customer) {
      const [newCustomer] = await db
        .insert(customers)
        .values({
          companyId: company.id,
          firstName: sanitizedCustomer.firstName,
          lastName: sanitizedCustomer.lastName,
          email: sanitizedCustomer.email || '',
          phone: sanitizedCustomer.phone || '',
          notes: `Created via online booking`,
        })
        .returning()

      customer = newCustomer
    }

    // Create the job
    const jobNumber = generateJobNumber()
    const [job] = await db
      .insert(jobs)
      .values({
        companyId: company.id,
        customerId: customer.id,
        serviceId: service.id,
        jobNumber,
        scheduledDate: validatedData.date,
        scheduledTime: validatedData.time,
        durationMinutes: service.durationMinutes,
        status: 'scheduled',
        notes: sanitizedCustomer.notes || null,
        customerNotes: `Booked online on ${new Date().toLocaleDateString()}`,
        totalPrice: service.price,
        paymentStatus: 'unpaid',
      })
      .returning()

    // Send confirmation email to customer (if email provided)
    if (sanitizedCustomer.email) {
      sendJobReminderNotification({
        channels: ['email'],
        customerEmail: sanitizedCustomer.email,
        customerPhone: sanitizedCustomer.phone || undefined,
        customerName: `${sanitizedCustomer.firstName} ${sanitizedCustomer.lastName}`,
        companyName: company.companyName,
        companyPhone: company.businessPhone || undefined,
        serviceName: service.name,
        jobDate: validatedData.date,
        jobTime: validatedData.time,
      }).catch((err) => {
        console.error('Failed to send booking confirmation:', err)
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed',
      booking: {
        id: job.id,
        jobNumber: job.jobNumber,
        service: service.name,
        date: validatedData.date,
        time: validatedData.time,
        duration: service.durationMinutes,
      },
    })
  } catch (error: unknown) {
    console.error('Error creating booking:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/public/book/[slug]
 * Get available booking slots for a company
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')

    // Get company by slug
    const company = await db.query.companies.findFirst({
      where: eq(companies.slug, slug),
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get company settings for business hours
    const { companySettings } = await import('@/db/schema')
    const settings = await db.query.companySettings.findFirst({
      where: eq(companySettings.companyId, company.id),
    })

    // Get available services
    const availableServices = await db
      .select()
      .from(services)
      .where(
        and(eq(services.companyId, company.id), eq(services.isPublic, true))
      )
      .orderBy(services.sortOrder)

    // If date and service provided, get existing bookings for that day
    let existingBookings: { time: string; duration: number }[] = []
    if (date && serviceId) {
      const dayJobs = await db
        .select({
          time: jobs.scheduledTime,
          duration: jobs.durationMinutes,
        })
        .from(jobs)
        .where(
          and(eq(jobs.companyId, company.id), eq(jobs.scheduledDate, date))
        )

      existingBookings = dayJobs.map((j) => ({
        time: j.time,
        duration: j.duration,
      }))
    }

    return NextResponse.json({
      company: {
        name: company.companyName,
        slug: company.slug,
        timeZone: company.timeZone,
      },
      services: availableServices.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: parseFloat(s.price?.toString() || '0'),
        durationMinutes: s.durationMinutes,
        color: s.color,
      })),
      // Note: businessHours field needs to be added to company_settings schema
      // For now, use default business hours
      businessHours: {
        monday: { open: '09:00', close: '17:00', enabled: true },
        tuesday: { open: '09:00', close: '17:00', enabled: true },
        wednesday: { open: '09:00', close: '17:00', enabled: true },
        thursday: { open: '09:00', close: '17:00', enabled: true },
        friday: { open: '09:00', close: '17:00', enabled: true },
        saturday: { open: '09:00', close: '17:00', enabled: false },
        sunday: { open: '09:00', close: '17:00', enabled: false },
      },
      existingBookings,
    })
  } catch (error: unknown) {
    console.error('Error fetching booking info:', error)

    return NextResponse.json(
      { error: 'Failed to fetch booking information' },
      { status: 500 }
    )
  }
}
