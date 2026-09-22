import { createEmitter, isEqualNever } from '@o/helpers'

export const feedDropdownEmitter = createEmitter<boolean>('feedDropdown', false, {
  comparator: isEqualNever,
})
