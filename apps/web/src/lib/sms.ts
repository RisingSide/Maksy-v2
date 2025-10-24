import twilio from 'twilio'

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const tok = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !tok) throw new Error('Twilio credentials missing')
  // @ts-ignore
  return twilio(sid, tok)
}

export async function sendSms(opts: { to: string; body: string }) {
  const client = getClient()
  const params: Record<string, any> = { to: opts.to, body: opts.body }
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) params.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
  else if (process.env.TWILIO_FROM_NUMBER) params.from = process.env.TWILIO_FROM_NUMBER
  else throw new Error('Set TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER')
  return client.messages.create(params)
}
