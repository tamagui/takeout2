// stable key that won't change on retry — use for operations that should be deduplicated
export function createStableIdempotencyKey(
  userId: string,
  action: string,
  uniqueData: string
): string {
  return `${userId}_${action}_${uniqueData}`
}
