import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendBookingUpdate } from '@/app/actions/notify'

const Schema = z.object({
  to: z.string().regex(/^\+\d{10,15}$/),
  orgName: z.string().min(1),
  type: z.enum(['booking_confirmed', 'tech_on_the_way', 'job_complete']),
  // ✅ make the key type explicit to avoid TS overload noise in CI
  vars: z.record(z.string(), z.any()).optional().default({}),
})

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const data = Schema.parse(payload)
    const { sid, body } = await sendBookingUpdate(data)
    return NextResponse.json({ ok: true, sid, body })
  } catch (e: any) {
    const msg = e?.issues ? JSON.stringify(e.issues) : e.message
    return NextResponse.json({ ok: false, error: msg }, { status: 400 })
  }
}
