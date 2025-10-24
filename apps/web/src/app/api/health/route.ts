export function GET() {
  return new Response(JSON.stringify({ ok: true, version: process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev' }), {
    headers: { 'content-type': 'application/json' }
  })
}
