import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  const f = await req.formData()
  const row = {
    provider: 'twilio',
    external_sid: String(f.get('MessageSid') || ''),
    to_number: String(f.get('To') || ''),
    status: String(f.get('MessageStatus') || ''),
    error_code: String(f.get('ErrorCode') || '') || null,
    body: String(f.get('Body') || ''),
  }
  try {
    await supabaseAdmin.from('messages').insert(row)
  } catch {}
  return new NextResponse('OK', { status: 200 })
}
