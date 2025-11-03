/**
 * Formats a date relative to the current time:
 * - If within the last month: just show time (e.g., "5:50pm")
 * - If this year but older than a month: show "Jun 2, 5:50pm"
 * - If before this year: show "Jun 2, 2025, 5:50pm"
 */

function lowerCaseTime(formatted: string): string {
  return formatted.replace(/\s?(AM|PM)/g, (_, ampm) => ampm.toLowerCase())
}

export function formatDateRelative(date: Date | string | number): string {
  const messageDate = new Date(date)
  const now = new Date()

  // if it's today
  const isToday =
    messageDate.getFullYear() === now.getFullYear() &&
    messageDate.getMonth() === now.getMonth() &&
    messageDate.getDate() === now.getDate()

  // check if it's within the last month
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  const isWithinLastMonth = messageDate >= oneMonthAgo

  // if it's this year
  const isThisYear = messageDate.getFullYear() === now.getFullYear()

  if (isToday) {
    // just time for today
    return lowerCaseTime(
      new Intl.DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(messageDate)
    )
  }

  if (isWithinLastMonth) {
    // just time for dates within the last month
    return lowerCaseTime(
      new Intl.DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(messageDate)
    )
  }

  if (isThisYear) {
    // Show "Jun 2, 5:50pm" for this year
    return lowerCaseTime(
      new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(messageDate)
    )
  }

  // Show "Jun 2, 2025, 5:50pm" for previous years
  return lowerCaseTime(
    new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(messageDate)
  )
}
