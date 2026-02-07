// generate deterministic idempotency keys to prevent duplicate stripe operations on retry
export function createIdempotencyKey(
  userId: string,
  action: string,
  uniqueData: string
): string {
  return `${userId}_${action}_${uniqueData}_${Date.now()}`
}

// stable key that won't change on retry (no timestamp)
export function createStableIdempotencyKey(
  userId: string,
  action: string,
  uniqueData: string
): string {
  return `${userId}_${action}_${uniqueData}`
}
