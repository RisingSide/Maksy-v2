/**
 * SMS Service - Twilio SMS Helper Functions
 *
 * This module provides a clean interface for sending SMS messages via Twilio.
 * Use this instead of directly calling Twilio in API routes.
 */

import twilio from 'twilio'
import { db } from '@/db/index.server'
import { automationExecutions } from '@/db/schema'

// Initialize Twilio client
const getTwilioClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured')
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
}

export interface SendSmsOptions {
  to: string
  message: string
  companyId?: string
  automationId?: string
}

export interface SendSmsResult {
  success: boolean
  messageSid?: string
  error?: string
}

/**
 * Send an SMS message via Twilio
 *
 * @param options - SMS options including recipient, message, and optional tracking IDs
 * @returns Result object with success status and message SID or error
 */
export async function sendSms({
  to,
  message,
  companyId,
  automationId,
}: SendSmsOptions): Promise<SendSmsResult> {
  // Validate phone number format (basic validation)
  const cleanedTo = to.replace(/\D/g, '')
  if (cleanedTo.length < 10) {
    return {
      success: false,
      error: 'Invalid phone number format',
    }
  }

  // Ensure E.164 format
  const formattedTo = cleanedTo.startsWith('1')
    ? `+${cleanedTo}`
    : `+1${cleanedTo}`

  try {
    const client = getTwilioClient()

    // Use Messaging Service if configured, otherwise use from number
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

    const messageConfig: any = {
      body: message,
      to: formattedTo,
    }

    // Add status callback URL for webhook tracking
    if (process.env.NEXT_PUBLIC_APP_URL) {
      messageConfig.statusCallback = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/webhook`
    }

    if (messagingServiceSid) {
      messageConfig.messagingServiceSid = messagingServiceSid
    } else if (process.env.TWILIO_FROM_NUMBER) {
      messageConfig.from = process.env.TWILIO_FROM_NUMBER
    } else {
      return {
        success: false,
        error: 'No Twilio phone number or messaging service configured',
      }
    }

    const result = await client.messages.create(messageConfig)

    console.log(`SMS sent: ${result.sid} to ${formattedTo}`)

    // Log to automation execution if this was from an automation
    if (automationId && companyId) {
      try {
        await db.insert(automationExecutions).values({
          automationId,
          triggeredByEntityType: 'sms',
          triggeredByEntityId: companyId,
          status: 'pending',
          // Note: We store the message SID in notes for tracking
          // A proper solution would add an external_id column
        })
      } catch (dbError) {
        console.error('Failed to log automation execution:', dbError)
        // Don't fail the SMS send if logging fails
      }
    }

    return {
      success: true,
      messageSid: result.sid,
    }
  } catch (error) {
    console.error('Failed to send SMS:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to send SMS'

    // Log failure to automation execution
    if (automationId && companyId) {
      try {
        await db.insert(automationExecutions).values({
          automationId,
          triggeredByEntityType: 'sms',
          triggeredByEntityId: companyId,
          status: 'failed',
          errorMessage: errorMessage,
        })
      } catch (dbError) {
        console.error('Failed to log automation execution failure:', dbError)
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Send a job reminder SMS to a customer
 */
export async function sendJobReminderSms({
  customerPhone,
  customerName,
  jobDate,
  jobTime,
  companyName,
  companyId,
  automationId,
}: {
  customerPhone: string
  customerName: string
  jobDate: string
  jobTime: string
  companyName: string
  companyId?: string
  automationId?: string
}): Promise<SendSmsResult> {
  const message = `Hi ${customerName}! This is a reminder from ${companyName} about your appointment on ${jobDate} at ${jobTime}. Reply CONFIRM to confirm or call us to reschedule.`

  return sendSms({
    to: customerPhone,
    message,
    companyId,
    automationId,
  })
}

/**
 * Send an invoice reminder SMS
 */
export async function sendInvoiceReminderSms({
  customerPhone,
  customerName,
  invoiceNumber,
  amountDue,
  dueDate,
  paymentLink,
  companyName,
  companyId,
  automationId,
}: {
  customerPhone: string
  customerName: string
  invoiceNumber: string
  amountDue: string
  dueDate: string
  paymentLink?: string
  companyName: string
  companyId?: string
  automationId?: string
}): Promise<SendSmsResult> {
  let message = `Hi ${customerName}, this is ${companyName}. Invoice #${invoiceNumber} for ${amountDue} is due on ${dueDate}.`

  if (paymentLink) {
    message += ` Pay securely here: ${paymentLink}`
  }

  return sendSms({
    to: customerPhone,
    message,
    companyId,
    automationId,
  })
}

/**
 * Send a custom SMS (for automation triggers)
 */
export async function sendCustomSms({
  to,
  template,
  variables,
  companyId,
  automationId,
}: {
  to: string
  template: string
  variables: Record<string, string>
  companyId?: string
  automationId?: string
}): Promise<SendSmsResult> {
  // Replace template variables
  let message = template
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }

  return sendSms({
    to,
    message,
    companyId,
    automationId,
  })
}
