import { One } from 'one'
import { parseDateOnly, toDateOnlyKey } from '../display/dateOnly'
import type { DateFieldProps } from './formContract'

// the native leg: SwiftUI's own DatePicker, which is what iOS uses for every
// calendar-day field it ships. compact style draws the form row (label
// leading, the day trailing) and opens the system calendar on tap; date
// components keeps the time of day out of the control entirely.
//
// the bridge carries a Date because SwiftUI has no calendar-day type. the
// selection is built at noon from the key's parts so a daylight-saving
// midnight never shifts it, and only the key's calendar day crosses back
// through onSelectionChange, so storage never sees an instant.
export function DateField({ label, value, onChange, testID }: DateFieldProps) {
  const { year, month, day } = parseDateOnly(value)
  const selection = new Date(year, month - 1, day, 12)
  return (
    <One.iOS.DatePicker
      label={label}
      selection={selection}
      onSelectionChange={(date) => onChange(toDateOnlyKey(date))}
      displayedComponents="date"
      datePickerStyle="compact"
      testID={testID}
    />
  )
}
