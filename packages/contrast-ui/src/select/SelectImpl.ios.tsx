import { One } from 'one'
import { useMemo } from 'react'
import { useSelectValue } from './useSelectValue'
import type { SelectProps } from './selectContract'

// the ios leg: a Form row with the label leading and a menu picker trailing,
// which is the row ios uses for a choice from a closed set. the parent must
// give it a definite width (a flex row, a form): a Host takes its width from
// Yoga and reports back only its height, so in a content-sized box it is 0
// wide. the menu shows text only, so item icons stay on the web leg. size,
// width, and the sheet breakpoint are web props the contract accepts and this
// leg ignores.
//
// a value that matches no item means nothing is chosen yet. a swiftui picker
// needs a tagged row for every selection it can hold, so that value gets a
// leading `None` row until the user picks a real one.
export function Select({
  items,
  label,
  value,
  defaultValue,
  onValueChange,
  testID,
}: SelectProps) {
  const [selection, setSelection] = useSelectValue({
    items,
    value,
    defaultValue,
    onValueChange,
  })

  const options = useMemo(() => {
    const itemOptions = items.map((item) => ({ value: item.id, label: item.name }))
    return items.some((item) => item.id === selection)
      ? itemOptions
      : [{ value: selection, label: 'None' }, ...itemOptions]
  }, [items, selection])

  return (
    <One.iOS.Host>
      <One.iOS.LabeledContent label={label}>
        <One.iOS.Picker
          selection={selection}
          onSelectionChange={(next) => {
            if (next === selection) return
            if (!items.some((item) => item.id === next)) {
              throw new Error('Picker reported a value outside its options')
            }
            setSelection(next)
          }}
          options={options}
          pickerStyle="menu"
          testID={testID}
        />
      </One.iOS.LabeledContent>
    </One.iOS.Host>
  )
}
