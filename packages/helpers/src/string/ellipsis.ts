export const ellipsis = (str: string, maxLength: number): string => {
  // avoid running replace on huge string if its long
  const shortened = str.length > 500 ? str.slice(0, 500) : str
  const cleaned = shortened.replace(/\s+/g, ' ').trim()
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength - 3) + '…'
  }
  return cleaned
}
