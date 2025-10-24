import { NextRequest, NextResponse } from 'next/server'
import { sendBookingUpdate } from '@/app/actions/notify'
export async function POST(req: NextRequest) {
  try {
    const { to, orgName, type, vars } = await req.json()
    if (!to || !orgName || !type) return NextResponse.json({ ok:false, error:'Missing to, orgName, type' }, { status: 400 })
    const { sid, body } = await sendBookingUpdate({ to, orgName, type, vars })
    return NextResponse.json({ ok:true, sid, body })
  } catch (e:any) { return NextResponse.json({ ok:false, error:e.message }, { status:500 }) }
}
