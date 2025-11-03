/**
 * Debug utility that logs a value and passes it through unchanged.
 * Useful for debugging chains of operations without breaking the flow.
 *
 * @param value - The value to log and pass through
 * @param label - Optional label to prefix the log output
 * @returns The original value unchanged
 */
export function debugLog<T>(value: T, label?: string): T {
  const output = label ? `[${label}]` : '[DEBUG]'
  console.info(output, value)
  return value
}
