'use server'
import { sendSms } from '@/lib/sms'
type TemplateKey = 'booking_confirmed' | 'tech_on_the_way' | 'job_complete'
const templates: Record<TemplateKey, (p: any) => string> = {
  booking_confirmed: ({ orgName, date, time, service, link }) => `${orgName}: Thanks for booking ${service}! 📅 ${date} @ ${time}. ${link ?? ''}`.trim(),
  tech_on_the_way: ({ orgName, eta, techName }) => `${orgName}: Our team${techName ? ' (' + techName + ')' : ''} is on the way. ETA ${eta}.`,
  job_complete: ({ orgName, reviewLink }) => `${orgName}: Your service is complete. Review? ${reviewLink ?? ''}`.trim()
}
export async function sendBookingUpdate(opts: { to: string; orgName: string; type: TemplateKey; vars?: Record<string, any> }) {
  if (!opts.to?.startsWith('+')) throw new Error('to must be E.164, e.g. +1XXXXXXXXXX')
  const body = templates[opts.type]({ orgName: opts.orgName, ...(opts.vars ?? {}) })
  const res = await sendSms({ to: opts.to, body })
  return { sid: (res as any)?.sid ?? null, body }
}
