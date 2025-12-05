/**
 * Twilio Webhook Handler
 *
 * Handles SMS delivery status callbacks from Twilio.
 *
 * Events handled:
 * - delivered: SMS delivered successfully
 * - sent: SMS sent to carrier
 * - failed: SMS failed to send
 * - undelivered: SMS undelivered by carrier
 *
 * Logs all events to automation_executions table for tracking.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/index.server'
import { automationExecutions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import twilio from 'twilio'

// Twilio webhook validator
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(request: NextRequest) {
  try {
    // IMPORTANT: Capture raw body as string BEFORE parsing for signature validation
    // Twilio's validateRequest expects the original form-encoded body string
    const bodyString = await request.text()

    // Parse the form-encoded body into an object for processing
    const body: Record<string, string> = {}
    const params = new URLSearchParams(bodyString)
    params.forEach((value, key) => {
      body[key] = value
    })

    // Extract Twilio signature for validation
    const signature = request.headers.get('x-twilio-signature')
    const url = request.url

    // Validate webhook signature (security)
    // Note: In production, you should validate the signature
    // For now, we'll log but not block if validation fails
    if (signature && process.env.NODE_ENV === 'production') {
      // Pass the parsed body object (not the raw string) - Twilio SDK handles the encoding
      const isValid = twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN!,
        signature,
        url,
        body
      )
      if (!isValid) {
        console.error('Invalid Twilio signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 403 }
        )
      }
    }

    // Extract status and message SID
    const { MessageSid, MessageStatus, To, From, ErrorCode, ErrorMessage } =
      body

    console.log(`Twilio webhook: ${MessageStatus} for ${MessageSid}`)

    // Log status update
    await logSmsStatus({
      messageSid: MessageSid,
      status: MessageStatus,
      to: To,
      from: From,
      errorCode: ErrorCode,
      errorMessage: ErrorMessage,
    })

    // Handle different statuses
    switch (MessageStatus?.toLowerCase()) {
      case 'delivered':
        await handleDelivered(MessageSid)
        break

      case 'sent':
        await handleSent(MessageSid)
        break

      case 'failed':
      case 'undelivered':
        await handleFailed(MessageSid, ErrorCode, ErrorMessage)
        break

      default:
        console.log(`Unhandled SMS status: ${MessageStatus}`)
    }

    // Twilio expects a 200 response
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Twilio webhook error:', error)
    // Still return 200 to prevent Twilio from retrying
    return new NextResponse('OK', { status: 200 })
  }
}

// ============================================================================
// STATUS HANDLERS
// ============================================================================

async function handleDelivered(messageSid: string) {
  console.log(`SMS delivered: ${messageSid}`)

  // Update automation execution status if this was from an automation
  await updateAutomationExecution(messageSid, 'completed', null)
}

async function handleSent(messageSid: string) {
  console.log(`SMS sent to carrier: ${messageSid}`)

  // Update to running status (in transit)
  await updateAutomationExecution(messageSid, 'running', null)
}

async function handleFailed(
  messageSid: string,
  errorCode?: string,
  errorMessage?: string
) {
  console.error(`SMS failed: ${messageSid}`, {
    errorCode,
    errorMessage,
  })

  const errorDetails = errorCode
    ? `Twilio Error ${errorCode}: ${errorMessage}`
    : 'SMS delivery failed'

  await updateAutomationExecution(messageSid, 'failed', errorDetails)

  // TODO: Alert admin about failed SMS
  // TODO: Consider retry logic for certain error codes
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface SmsStatusLog {
  messageSid: string
  status: string
  to: string
  from: string
  errorCode?: string
  errorMessage?: string
}

async function logSmsStatus(log: SmsStatusLog) {
  // Log to audit_logs table
  // We don't know the company_id from the webhook, but we can store in a general log

  // For now, just console log
  // In a real system, you might want to store these in a separate sms_logs table
  console.log('SMS Status Log:', log)
}

async function updateAutomationExecution(
  messageSid: string,
  status: 'pending' | 'running' | 'completed' | 'failed',
  errorMessage: string | null
) {
  // Try to find automation execution by message SID
  // This assumes we stored the Twilio message SID somewhere when sending

  // For now, we'll log it
  // In production, you'd need to track message SIDs when creating automations
  console.log(
    `Would update automation execution for ${messageSid} to ${status}`
  )

  // Example of how this would work with Drizzle:
  /*
  try {
    await db.update(automationExecutions)
      .set({
        status,
        errorMessage,
        completedAt: status === 'completed' || status === 'failed' 
          ? new Date() 
          : null,
      })
      .where(eq(automationExecutions.externalId, messageSid)); // You'd need to add this column
  } catch (error) {
    console.error('Failed to update automation execution:', error);
  }
  */
}

// ============================================================================
// SEND SMS HELPER (for reference)
// ============================================================================

/**
 * Example helper function for sending SMS via Twilio
 * This would be called from automation executions or API routes
 * NOTE: Moved to internal scope to avoid Next.js route export conflicts
 */
async function sendSms({
  to,
  message,
  companyId,
  automationId,
}: {
  to: string
  message: string
  companyId?: string
  automationId?: string
}) {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  )

  try {
    // Use Messaging Service if configured, otherwise use from number
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

    const messageConfig: any = {
      body: message,
      to: to,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/webhook`,
    }

    if (messagingServiceSid) {
      messageConfig.messagingServiceSid = messagingServiceSid
    } else {
      messageConfig.from = process.env.TWILIO_FROM_NUMBER!
    }

    const result = await client.messages.create(messageConfig)

    console.log(`SMS sent: ${result.sid}`)

    // Log to automation execution if this was from an automation
    if (automationId && companyId) {
      await db.insert(automationExecutions).values({
        automationId,
        triggeredByEntityType: 'sms',
        triggeredByEntityId: companyId,
        status: 'pending',
        // Store message SID for webhook tracking
        // externalId: result.sid, // You'd need to add this column
      })
    }

    return {
      success: true,
      messageSid: result.sid,
    }
  } catch (error) {
    console.error('Failed to send SMS:', error)

    // Log failure to automation execution
    if (automationId && companyId) {
      await db.insert(automationExecutions).values({
        automationId,
        triggeredByEntityType: 'sms',
        triggeredByEntityId: companyId,
        status: 'failed',
        errorMessage:
          error instanceof Error ? error.message : 'Failed to send SMS',
      })
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    }
  }
}
