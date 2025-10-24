import { NextResponse } from 'next/server'
import { aiChat } from '@/lib/ai'

export async function GET() {
  try {
    const { text } = await aiChat('You are a cheerful test bot.', 'Reply with one short friendly word only.')
    return NextResponse.json({ ok: true, reply: text })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
