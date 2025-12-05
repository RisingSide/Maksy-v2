import { NextResponse } from 'next/server'
import { db } from '@/db/index.server'
import { customForms, formSubmissions, customers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { headers } from 'next/headers'

const submitSchema = z.object({
  data: z.record(z.string(), z.union([z.string(), z.boolean()])),
})

/**
 * POST /api/forms/[id]/submit
 * Public endpoint - submit a form
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = submitSchema.parse(body)

    // Get request metadata
    const headersList = await headers()
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    // Fetch form
    const form = await db.query.customForms.findFirst({
      where: and(eq(customForms.id, id), eq(customForms.isActive, true)),
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found or inactive' },
        { status: 404 }
      )
    }

    // Validate required fields
    const fieldsConfig = form.fieldsConfig as Array<{
      id: string
      type: string
      label: string
      required?: boolean
    }>

    for (const field of fieldsConfig) {
      if (field.required && !validatedData.data[field.id]) {
        return NextResponse.json(
          { error: `${field.label} is required` },
          { status: 400 }
        )
      }
    }

    // Try to find or create customer if email is provided
    let customerId: string | null = null
    const emailField = fieldsConfig.find((f) => f.type === 'email')
    const nameField = fieldsConfig.find(
      (f) => f.type === 'text' && f.label.toLowerCase().includes('name')
    )
    const phoneField = fieldsConfig.find((f) => f.type === 'phone')

    if (emailField && validatedData.data[emailField.id]) {
      const email = validatedData.data[emailField.id] as string

      // Check if customer exists
      const existingCustomer = await db.query.customers.findFirst({
        where: and(
          eq(customers.companyId, form.companyId),
          eq(customers.email, email)
        ),
      })

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        // Create new customer
        const name = nameField
          ? (validatedData.data[nameField.id] as string)
          : ''
        const nameParts = name.split(' ')
        const firstName = nameParts[0] || 'Unknown'
        const lastName = nameParts.slice(1).join(' ') || ''
        const phone = phoneField
          ? (validatedData.data[phoneField.id] as string)
          : ''

        const [newCustomer] = await db
          .insert(customers)
          .values({
            companyId: form.companyId,
            firstName,
            lastName,
            email,
            phone: phone || '',
            notes: `Created from form submission: ${form.formName}`,
          })
          .returning()

        customerId = newCustomer.id
      }
    }

    // Create submission
    const [submission] = await db
      .insert(formSubmissions)
      .values({
        formId: form.id,
        submissionData: validatedData.data,
        customerId,
        ipAddress,
        userAgent,
      })
      .returning()

    // Send notification email if configured
    if (form.notificationEmail) {
      try {
        const { sendEmail } = await import('@/lib/email')

        // Format submission data for email
        const formattedData = fieldsConfig
          .map((field) => {
            const value = validatedData.data[field.id]
            return `<strong>${field.label}:</strong> ${value || 'N/A'}`
          })
          .join('<br>')

        await sendEmail({
          to: form.notificationEmail,
          subject: `New form submission: ${form.formName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>New Form Submission</h2>
              <p>You received a new submission for <strong>${form.formTitle}</strong>:</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                ${formattedData}
              </div>
              <p style="color: #666; font-size: 14px;">
                Submitted at ${new Date().toLocaleString()}
              </p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError)
        // Don't fail the submission if email fails
      }
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      successMessage: form.successMessage,
      redirectUrl: form.redirectUrl,
    })
  } catch (error) {
    console.error('Error submitting form:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid submission data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    )
  }
}
