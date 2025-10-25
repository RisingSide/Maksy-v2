export function reportError(err: unknown, ctx?: Record<string, unknown>) {
  // TODO: integrate Sentry/Axiom later; keep a single import site
  if (process.env.NODE_ENV !== 'production')
    console.error('[reportError]', err, ctx)
}
