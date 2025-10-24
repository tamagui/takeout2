import type { NotificationSchedule } from 'start/types'

export const dayOptions = [
  { id: 'weekdays', name: 'Weekdays' },
  { id: 'weekend', name: 'Weekend' },
  { id: 'mon', name: 'Monday' },
  { id: 'tue', name: 'Tuesday' },
  { id: 'wed', name: 'Wednesday' },
  { id: 'thu', name: 'Thursday' },
  { id: 'fri', name: 'Friday' },
  { id: 'sat', name: 'Saturday' },
  { id: 'sun', name: 'Sunday' },
]

// 12-hour format time options (30-minute increments)
export const time12Options = [
  { id: '12:00am', name: '12:00 AM' },
  { id: '12:30am', name: '12:30 AM' },
  { id: '1:00am', name: '1:00 AM' },
  { id: '1:30am', name: '1:30 AM' },
  { id: '2:00am', name: '2:00 AM' },
  { id: '2:30am', name: '2:30 AM' },
  { id: '3:00am', name: '3:00 AM' },
  { id: '3:30am', name: '3:30 AM' },
  { id: '4:00am', name: '4:00 AM' },
  { id: '4:30am', name: '4:30 AM' },
  { id: '5:00am', name: '5:00 AM' },
  { id: '5:30am', name: '5:30 AM' },
  { id: '6:00am', name: '6:00 AM' },
  { id: '6:30am', name: '6:30 AM' },
  { id: '7:00am', name: '7:00 AM' },
  { id: '7:30am', name: '7:30 AM' },
  { id: '8:00am', name: '8:00 AM' },
  { id: '8:30am', name: '8:30 AM' },
  { id: '9:00am', name: '9:00 AM' },
  { id: '9:30am', name: '9:30 AM' },
  { id: '10:00am', name: '10:00 AM' },
  { id: '10:30am', name: '10:30 AM' },
  { id: '11:00am', name: '11:00 AM' },
  { id: '11:30am', name: '11:30 AM' },
  { id: '12:00pm', name: '12:00 PM' },
  { id: '12:30pm', name: '12:30 PM' },
  { id: '1:00pm', name: '1:00 PM' },
  { id: '1:30pm', name: '1:30 PM' },
  { id: '2:00pm', name: '2:00 PM' },
  { id: '2:30pm', name: '2:30 PM' },
  { id: '3:00pm', name: '3:00 PM' },
  { id: '3:30pm', name: '3:30 PM' },
  { id: '4:00pm', name: '4:00 PM' },
  { id: '4:30pm', name: '4:30 PM' },
  { id: '5:00pm', name: '5:00 PM' },
  { id: '5:30pm', name: '5:30 PM' },
  { id: '6:00pm', name: '6:00 PM' },
  { id: '6:30pm', name: '6:30 PM' },
  { id: '7:00pm', name: '7:00 PM' },
  { id: '7:30pm', name: '7:30 PM' },
  { id: '8:00pm', name: '8:00 PM' },
  { id: '8:30pm', name: '8:30 PM' },
  { id: '9:00pm', name: '9:00 PM' },
  { id: '9:30pm', name: '9:30 PM' },
  { id: '10:00pm', name: '10:00 PM' },
  { id: '10:30pm', name: '10:30 PM' },
  { id: '11:00pm', name: '11:00 PM' },
  { id: '11:30pm', name: '11:30 PM' },
]

// 24-hour format time options (30-minute increments)
export const time24Options = [
  { id: '00:00', name: '00:00' },
  { id: '00:30', name: '00:30' },
  { id: '01:00', name: '01:00' },
  { id: '01:30', name: '01:30' },
  { id: '02:00', name: '02:00' },
  { id: '02:30', name: '02:30' },
  { id: '03:00', name: '03:00' },
  { id: '03:30', name: '03:30' },
  { id: '04:00', name: '04:00' },
  { id: '04:30', name: '04:30' },
  { id: '05:00', name: '05:00' },
  { id: '05:30', name: '05:30' },
  { id: '06:00', name: '06:00' },
  { id: '06:30', name: '06:30' },
  { id: '07:00', name: '07:00' },
  { id: '07:30', name: '07:30' },
  { id: '08:00', name: '08:00' },
  { id: '08:30', name: '08:30' },
  { id: '09:00', name: '09:00' },
  { id: '09:30', name: '09:30' },
  { id: '10:00', name: '10:00' },
  { id: '10:30', name: '10:30' },
  { id: '11:00', name: '11:00' },
  { id: '11:30', name: '11:30' },
  { id: '12:00', name: '12:00' },
  { id: '12:30', name: '12:30' },
  { id: '13:00', name: '13:00' },
  { id: '13:30', name: '13:30' },
  { id: '14:00', name: '14:00' },
  { id: '14:30', name: '14:30' },
  { id: '15:00', name: '15:00' },
  { id: '15:30', name: '15:30' },
  { id: '16:00', name: '16:00' },
  { id: '16:30', name: '16:30' },
  { id: '17:00', name: '17:00' },
  { id: '17:30', name: '17:30' },
  { id: '18:00', name: '18:00' },
  { id: '18:30', name: '18:30' },
  { id: '19:00', name: '19:00' },
  { id: '19:30', name: '19:30' },
  { id: '20:00', name: '20:00' },
  { id: '20:30', name: '20:30' },
  { id: '21:00', name: '21:00' },
  { id: '21:30', name: '21:30' },
  { id: '22:00', name: '22:00' },
  { id: '22:30', name: '22:30' },
  { id: '23:00', name: '23:00' },
  { id: '23:30', name: '23:30' },
]

// Convert 12-hour time to 24-hour for storage
export function convertTo24Hour(time12: string): string {
  const match = time12.match(/(\d{1,2}):(\d{2})([ap]m)/i)
  if (!match) return '00:00'

  const [, hoursStr, minutesStr, period] = match
  if (!hoursStr || !minutesStr || !period) return '00:00'

  const hours = parseInt(hoursStr, 10)
  const minutes = parseInt(minutesStr, 10)

  let hours24 = hours
  if (period.toLowerCase() === 'pm' && hours !== 12) {
    hours24 += 12
  } else if (period.toLowerCase() === 'am' && hours === 12) {
    hours24 = 0
  }

  return `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Convert 24-hour time to 12-hour for display
export function convertTo12Hour(time24: string): string {
  const parts = time24.split(':')
  if (parts.length !== 2) return '12:00am'

  const hoursStr = parts[0]
  const minutesStr = parts[1]
  if (!hoursStr || !minutesStr) return '12:00am'

  const hours = parseInt(hoursStr, 10)
  const minutes = parseInt(minutesStr, 10)

  const period = hours >= 12 ? 'pm' : 'am'
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours

  return `${hours12}:${minutes.toString().padStart(2, '0')}${period}`
}

// Check if schedules have conflicting day options
export function hasConflictingDays(day1: string, day2: string): boolean {
  const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri']
  const weekend = ['sat', 'sun']

  if (day1 === day2) return true

  if (
    (day1 === 'weekdays' && weekdays.includes(day2)) ||
    (day2 === 'weekdays' && weekdays.includes(day1))
  ) {
    return true
  }

  if (
    (day1 === 'weekend' && weekend.includes(day2)) ||
    (day2 === 'weekend' && weekend.includes(day1))
  ) {
    return true
  }

  return false
}

// Get available day options based on existing schedules
export function getAvailableDayOptions(existingSchedules: NotificationSchedule[]) {
  return dayOptions.filter((option) => {
    return !existingSchedules.some((schedule) =>
      hasConflictingDays(schedule.days, option.id)
    )
  })
}

export const soundOptions = [
  { id: 'bell', name: 'Bell' },
  { id: 'chime', name: 'Chime' },
  { id: 'pop', name: 'Pop' },
  { id: 'ding', name: 'Ding' },
  { id: 'select', name: 'Select' },
  { id: 'tap', name: 'Tap' },
  { id: 'type', name: 'Type' },
]

export const languageOptions = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Español' },
]
