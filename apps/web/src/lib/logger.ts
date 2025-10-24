export function logInfo(...args: any[]) {
  if (process.env.NODE_ENV !== 'production') console.log(...args)
}

export function logError(...args: any[]) {
  console.error('[Error]', ...args)
}
