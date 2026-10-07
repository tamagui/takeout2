import { dateOnlyKey } from '../display/dateOnly'
import { Input } from './Input'
import { LabeledField } from './LabeledField'
import type { DateFieldProps } from './formContract'

// the web leg. the browser's own calendar-day picker, which is also what the
// key format already is: `<input type="date">` reads and writes `YYYY-MM-DD`,
// so the value passes through untouched and no date object ever exists. the
// browser lets a user clear the field, which the iOS picker cannot; a clear
// keeps the last day so both legs always hold one.
export function DateField({ label, value, onChange, testID }: DateFieldProps) {
  return (
    <LabeledField label={label}>
      <Input
        aria-label={label}
        type={'date' as never}
        value={value}
        onChangeText={(text) => {
          if (text) onChange(dateOnlyKey(text))
        }}
        testID={testID}
      />
    </LabeledField>
  )
}
