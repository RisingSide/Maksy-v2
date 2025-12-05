import { inngest } from './client'
import { generateFinancialInsights } from './functions/generate-financial-insights'

// ============================================================================
// USER EVENTS
// ============================================================================

// Send a welcome email when a user signs up
export const sendWelcomeEmail = inngest.createFunction(
  { id: 'send-welcome-email' },
  { event: 'user/created' },
  async ({ event, step }) => {
    await step.run('send-email', async () => {
      const { sendEmail } = await import('@/lib/email')

      await sendEmail({
        to: event.data.email,
        subject: 'Welcome to Maksy! 🎉',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f4a125;">Welcome to Maksy!</h1>
            <p>Hi ${event.data.firstName || 'there'},</p>
            <p>Thank you for signing up! We're excited to have you on board.</p>
            <p>Maksy helps you manage your service business with ease - from scheduling to invoicing.</p>
            <p>Get started by:</p>
            <ul>
              <li>Setting up your company profile</li>
              <li>Adding your services</li>
              <li>Inviting your team</li>
            </ul>
            <p>If you have any questions, just reply to this email!</p>
            <p>Best,<br>The Maksy Team</p>
          </div>
        `,
      })

      return { emailSent: true }
    })

    return { success: true }
  }
)

// ============================================================================
// APPOINTMENT REMINDERS (CRON)
// ============================================================================

// Send appointment reminders 24 hours before
export const sendAppointmentReminders24h = inngest.createFunction(
  { id: 'send-appointment-reminders-24h' },
  { cron: '0 * * * *' }, // Run every hour
  async ({ step }) => {
    const reminders = await step.run(
      'fetch-upcoming-appointments',
      async () => {
        const { db } = await import('@/db/index.server')
        const { jobs, customers, services, companies } = await import(
          '@/db/schema'
        )
        const { eq, and, gte, lte } = await import('drizzle-orm')

        // Get jobs scheduled for 23-25 hours from now
        const now = new Date()
        const start = new Date(now.getTime() + 23 * 60 * 60 * 1000)
        const end = new Date(now.getTime() + 25 * 60 * 60 * 1000)

        const upcomingJobs = await db
          .select({
            jobId: jobs.id,
            jobNumber: jobs.jobNumber,
            scheduledDate: jobs.scheduledDate,
            scheduledTime: jobs.scheduledTime,
            customerEmail: customers.email,
            customerPhone: customers.phone,
            customerFirstName: customers.firstName,
            customerLastName: customers.lastName,
            serviceName: services.name,
            companyName: companies.companyName,
            companyPhone: companies.businessPhone,
          })
          .from(jobs)
          .innerJoin(customers, eq(jobs.customerId, customers.id))
          .innerJoin(services, eq(jobs.serviceId, services.id))
          .innerJoin(companies, eq(jobs.companyId, companies.id))
          .where(eq(jobs.status, 'scheduled'))

        // Filter by scheduled datetime
        return upcomingJobs.filter((job) => {
          const jobDate = new Date(`${job.scheduledDate}T${job.scheduledTime}`)
          return jobDate >= start && jobDate <= end
        })
      }
    )

    // Send reminders
    for (const job of reminders) {
      await step.run(`send-reminder-${job.jobId}`, async () => {
        const { sendJobReminderNotification } = await import(
          '@/lib/notifications'
        )

        await sendJobReminderNotification({
          channels: ['email', 'sms'],
          customerEmail: job.customerEmail,
          customerPhone: job.customerPhone || undefined,
          customerName: `${job.customerFirstName} ${job.customerLastName}`,
          companyName: job.companyName,
          companyPhone: job.companyPhone || undefined,
          serviceName: job.serviceName,
          jobDate: job.scheduledDate,
          jobTime: job.scheduledTime,
        })

        return { sent: true, jobId: job.jobId }
      })
    }

    return { success: true, remindersSent: reminders.length }
  }
)

// Send appointment reminders 1 hour before
export const sendAppointmentReminders1h = inngest.createFunction(
  { id: 'send-appointment-reminders-1h' },
  { cron: '*/15 * * * *' }, // Run every 15 minutes
  async ({ step }) => {
    const reminders = await step.run(
      'fetch-upcoming-appointments',
      async () => {
        const { db } = await import('@/db/index.server')
        const { jobs, customers, services, companies } = await import(
          '@/db/schema'
        )
        const { eq } = await import('drizzle-orm')

        // Get jobs scheduled for 45-75 minutes from now
        const now = new Date()
        const start = new Date(now.getTime() + 45 * 60 * 1000)
        const end = new Date(now.getTime() + 75 * 60 * 1000)

        const upcomingJobs = await db
          .select({
            jobId: jobs.id,
            scheduledDate: jobs.scheduledDate,
            scheduledTime: jobs.scheduledTime,
            customerPhone: customers.phone,
            customerFirstName: customers.firstName,
            serviceName: services.name,
            companyName: companies.companyName,
          })
          .from(jobs)
          .innerJoin(customers, eq(jobs.customerId, customers.id))
          .innerJoin(services, eq(jobs.serviceId, services.id))
          .innerJoin(companies, eq(jobs.companyId, companies.id))
          .where(eq(jobs.status, 'scheduled'))

        return upcomingJobs.filter((job) => {
          const jobDate = new Date(`${job.scheduledDate}T${job.scheduledTime}`)
          return jobDate >= start && jobDate <= end
        })
      }
    )

    // Send SMS reminders only for 1-hour reminders
    for (const job of reminders) {
      if (job.customerPhone) {
        await step.run(`send-sms-reminder-${job.jobId}`, async () => {
          const { sendSms } = await import('@/lib/sms')

          await sendSms({
            to: job.customerPhone!,
            message: `Reminder: Your ${job.serviceName} appointment with ${job.companyName} is in 1 hour at ${job.scheduledTime}.`,
          })

          return { sent: true, jobId: job.jobId }
        })
      }
    }

    return { success: true, remindersSent: reminders.length }
  }
)

// ============================================================================
// INVOICE REMINDERS (CRON)
// ============================================================================

// Check for overdue invoices and send reminders
export const checkOverdueInvoices = inngest.createFunction(
  { id: 'check-overdue-invoices' },
  { cron: '0 9 * * *' }, // Run daily at 9 AM
  async ({ step }) => {
    const overdueInvoices = await step.run(
      'fetch-overdue-invoices',
      async () => {
        const { db } = await import('@/db/index.server')
        const { invoices, customers, companies } = await import('@/db/schema')
        const { eq, and, lt, or } = await import('drizzle-orm')

        const today = new Date().toISOString().split('T')[0]

        return await db
          .select({
            invoiceId: invoices.id,
            invoiceNumber: invoices.invoiceNumber,
            dueDate: invoices.dueDate,
            total: invoices.total,
            amountPaid: invoices.amountPaid,
            customerEmail: customers.email,
            customerFirstName: customers.firstName,
            customerLastName: customers.lastName,
            companyName: companies.companyName,
            companyId: companies.id,
          })
          .from(invoices)
          .innerJoin(customers, eq(invoices.customerId, customers.id))
          .innerJoin(companies, eq(invoices.companyId, companies.id))
          .where(
            and(
              or(eq(invoices.status, 'unpaid'), eq(invoices.status, 'overdue')),
              lt(invoices.dueDate, today)
            )
          )
      }
    )

    // Update status to overdue and send reminders
    for (const invoice of overdueInvoices) {
      await step.run(`process-overdue-${invoice.invoiceId}`, async () => {
        const { db } = await import('@/db/index.server')
        const { invoices } = await import('@/db/schema')
        const { eq } = await import('drizzle-orm')
        const { sendEmail } = await import('@/lib/email')

        // Update status to overdue
        await db
          .update(invoices)
          .set({ status: 'overdue' })
          .where(eq(invoices.id, invoice.invoiceId))

        // Send reminder email
        const balance =
          parseFloat(invoice.total?.toString() || '0') -
          parseFloat(invoice.amountPaid?.toString() || '0')

        await sendEmail({
          to: invoice.customerEmail,
          subject: `Payment Reminder: Invoice ${invoice.invoiceNumber} is overdue`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Payment Reminder</h2>
              <p>Hi ${invoice.customerFirstName},</p>
              <p>This is a friendly reminder that invoice <strong>${invoice.invoiceNumber}</strong> 
              from ${invoice.companyName} is now overdue.</p>
              <p><strong>Amount Due:</strong> $${balance.toFixed(2)}</p>
              <p><strong>Original Due Date:</strong> ${invoice.dueDate}</p>
              <p>Please make payment at your earliest convenience to avoid any late fees.</p>
              <p>If you've already made payment, please disregard this notice.</p>
              <p>Best regards,<br>${invoice.companyName}</p>
            </div>
          `,
        })

        return { updated: true, invoiceId: invoice.invoiceId }
      })
    }

    return { success: true, overdueCount: overdueInvoices.length }
  }
)

// ============================================================================
// REVIEW REQUESTS
// ============================================================================

// Send review request after job completion
export const sendReviewRequest = inngest.createFunction(
  { id: 'send-review-request' },
  { event: 'job/completed' },
  async ({ event, step }) => {
    // Wait 24 hours before sending review request
    await step.sleep('wait-for-review', '24h')

    await step.run('send-review-email', async () => {
      const { db } = await import('@/db/index.server')
      const { jobs, customers, companies } = await import('@/db/schema')
      const { eq } = await import('drizzle-orm')
      const { sendEmail } = await import('@/lib/email')

      // Fetch job details
      const job = await db.query.jobs.findFirst({
        where: eq(jobs.id, event.data.jobId),
      })

      if (!job || !job.customerId) return { skipped: true }

      const customer = await db.query.customers.findFirst({
        where: eq(customers.id, job.customerId),
      })

      const company = await db.query.companies.findFirst({
        where: eq(companies.id, job.companyId),
      })

      if (!customer || !company) return { skipped: true }

      await sendEmail({
        to: customer.email,
        subject: `How was your experience with ${company.companyName}?`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>We'd love your feedback! ⭐</h2>
            <p>Hi ${customer.firstName},</p>
            <p>Thank you for choosing ${company.companyName}!</p>
            <p>We hope you're satisfied with our service. Your feedback helps us improve 
            and helps other customers make informed decisions.</p>
            <p>Would you take a moment to leave us a review?</p>
            <p>Thank you for your business!</p>
            <p>Best regards,<br>${company.companyName}</p>
          </div>
        `,
      })

      return { sent: true }
    })

    return { success: true }
  }
)

// ============================================================================
// DAILY METRICS
// ============================================================================

// Calculate daily metrics for all companies
export const calculateDailyMetrics = inngest.createFunction(
  { id: 'calculate-daily-metrics' },
  { cron: '0 1 * * *' }, // Run daily at 1 AM
  async ({ step }) => {
    await step.run('calculate-metrics', async () => {
      const { db } = await import('@/db/index.server')
      const { companies, jobs, invoices, customers } = await import(
        '@/db/schema'
      )
      const { eq, and, gte, sql } = await import('drizzle-orm')

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      // Get all active companies
      const allCompanies = await db.select({ id: companies.id }).from(companies)

      for (const company of allCompanies) {
        // Count jobs completed yesterday
        const completedJobs = await db
          .select({ count: sql<number>`count(*)` })
          .from(jobs)
          .where(
            and(
              eq(jobs.companyId, company.id),
              eq(jobs.status, 'completed'),
              gte(jobs.updatedAt, new Date(yesterdayStr))
            )
          )

        // Revenue from paid invoices yesterday
        const revenue = await db
          .select({ total: sql<number>`COALESCE(SUM(amount_paid), 0)` })
          .from(invoices)
          .where(
            and(
              eq(invoices.companyId, company.id),
              gte(invoices.paidAt, new Date(yesterdayStr))
            )
          )

        // New customers yesterday
        const newCustomers = await db
          .select({ count: sql<number>`count(*)` })
          .from(customers)
          .where(
            and(
              eq(customers.companyId, company.id),
              gte(customers.createdAt, new Date(yesterdayStr))
            )
          )

        console.log(`Metrics for company ${company.id}:`, {
          completedJobs: completedJobs[0]?.count || 0,
          revenue: revenue[0]?.total || 0,
          newCustomers: newCustomers[0]?.count || 0,
        })
      }

      return { processed: allCompanies.length }
    })

    return { success: true }
  }
)

// ============================================================================
// PAYMENT PROCESSING
// ============================================================================

// Process a payment after checkout
export const processPayment = inngest.createFunction(
  { id: 'process-payment' },
  { event: 'checkout/completed' },
  async ({ event, step }) => {
    const payment = await step.run('fetch-payment', async () => {
      console.log(`Processing payment for ${event.data.customerId}`)
      return { amount: event.data.amount, currency: 'usd' }
    })

    await step.run('charge-customer', async () => {
      console.log(`Charging ${payment.amount} ${payment.currency}`)
      return { charged: true }
    })

    await step.run('send-confirmation', async () => {
      console.log('Sending payment confirmation')
      return { sent: true }
    })

    return { success: true }
  }
)

// ============================================================================
// SCHEDULED REMINDERS
// ============================================================================

// Schedule a custom reminder
export const scheduleReminder = inngest.createFunction(
  { id: 'schedule-reminder' },
  { event: 'reminder/scheduled' },
  async ({ event, step }) => {
    await step.sleep('wait-until-reminder-time', event.data.sendAt)

    await step.run('send-reminder', async () => {
      console.log(`Sending reminder: ${event.data.message}`)
      return { sent: true }
    })

    return { success: true }
  }
)

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const functions = [
  // User events
  sendWelcomeEmail,

  // Appointment reminders
  sendAppointmentReminders24h,
  sendAppointmentReminders1h,

  // Invoice reminders
  checkOverdueInvoices,

  // Review requests
  sendReviewRequest,

  // Metrics
  calculateDailyMetrics,
  generateFinancialInsights,

  // Payments
  processPayment,

  // Custom reminders
  scheduleReminder,
]
