const currentYear = new Date().getFullYear()

export function formatDate(
  date: Date,
  options?: { daySuffix?: boolean }
): [string, string] | [string, string, string] {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()

  const dayString = options?.daySuffix ? getOrdinalSuffix(day) : `${day}`

  if (year === currentYear) {
    return [`${month}`, dayString]
  }

  return [`${month}`, dayString, `${year}`]
}

const getOrdinalSuffix = (n: number) => {
  if (n >= 11 && n <= 13) return 'th'
  switch (n % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}
