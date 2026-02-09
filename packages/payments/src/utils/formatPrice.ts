// format price for display (e.g. "$9.99/mo")
export function formatPrice(
  amount: number,
  currency: string,
  interval?: string | null
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)

  if (!interval) return formatted

  const intervalMap: Record<string, string> = {
    month: '/mo',
    year: '/yr',
    week: '/wk',
    day: '/day',
  }

  return `${formatted}${intervalMap[interval] ?? `/${interval}`}`
}
