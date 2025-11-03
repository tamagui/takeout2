/**
 * Truncates a list of strings to show only the first N items,
 * with a "+X" indicator for any remaining items.
 *
 * @param items - Array of strings to truncate
 * @param maxItems - Maximum number of items to show before truncating
 * @param separator - String to use between items (default: ', ')
 * @returns Formatted string with truncation indicator if needed
 *
 * @example
 * truncateList(['jon', 'sal', 'bob', 'ted'], 3) // "jon, sal, bob +1"
 * truncateList(['alice', 'bob'], 3) // "alice, bob"
 * truncateList(['a', 'b', 'c', 'd', 'e'], 2) // "a, b +3"
 */
export const truncateList = (
  items: string[],
  maxItems: number,
  separator: string = ', '
): string => {
  if (items.length <= maxItems) {
    return items.join(separator)
  }

  const visibleItems = items.slice(0, maxItems)
  const remainingCount = items.length - maxItems

  return `${visibleItems.join(separator)} +${remainingCount}`
}
