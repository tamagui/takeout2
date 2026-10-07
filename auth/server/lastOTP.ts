let lastOTPStore: { email: string; otp: string; timestamp: number } | null = null

export function storeOTP(email: string, otp: string) {
  if (process.env.NODE_ENV === 'development') {
    lastOTPStore = { email, otp, timestamp: Date.now() }
  }
}

export function getLastOTP(email: string): string | null {
  if (process.env.NODE_ENV !== 'development') return null
  if (!lastOTPStore) return null
  if (lastOTPStore.email !== email) return null
  if (Date.now() - lastOTPStore.timestamp > 5 * 60 * 1000) return null
  return lastOTPStore.otp
}
