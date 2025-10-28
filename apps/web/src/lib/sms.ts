import twilio from 'twilio'
import type { MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message'

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const tok = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !tok) throw new Error('Twilio credentials missing')
  // @ts-ignore allows test creds in dev; runtime is fine
  return twilio(sid, tok)
}

/** Send a message via Messaging Service (preferred) or From number. */
export async function sendSms(opts: { to: string; body: string }) {
  const client = getClient()

  // ✅ Use Twilio’s official type so CI passes
  const params: MessageListInstanceCreateOptions = {
    to: opts.to,
    body: opts.body,
  }

  const serviceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
  const fromNumber = process.env.TWILIO_FROM_NUMBER

  if (serviceSid) {
    params.messagingServiceSid = serviceSid
  } else if (fromNumber) {
    params.from = fromNumber
  } else {
    throw new Error('Set TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER')
  }

  return client.messages.create(params)
}
