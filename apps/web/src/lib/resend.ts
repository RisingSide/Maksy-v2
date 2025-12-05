import { Resend } from 'resend'

// Initialize Resend client
// Requires RESEND_API_KEY environment variable
export const resend = new Resend(process.env.RESEND_API_KEY)

// Default sender configuration
// Use Resend's test domain for development, or your verified domain for production
// To send from your own domain, verify it at https://resend.com/domains
export const EMAIL_FROM =
  process.env.EMAIL_FROM || 'Maksy <onboarding@resend.dev>'

// Email sending helper with error handling
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = EMAIL_FROM,
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}) {
  // Check if Resend is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured - email not sent')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || stripHtml(html),
    })

    if (error) {
      console.error('[Email] Failed to send:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[Email] Exception:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// Simple HTML to plain text converter
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
