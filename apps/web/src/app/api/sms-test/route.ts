import { NextResponse } from 'next/server'
import { sendSms } from '@/lib/sms'

export async function GET() {
  try {
    await sendSms({ to: '+16167172871', body: 'Maksy: live trial SMS 🚗✨' }) // verified number
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
