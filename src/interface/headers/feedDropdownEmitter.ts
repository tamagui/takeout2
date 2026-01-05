import { createEmitter, isEqualNever } from '@take-out/helpers'

export const feedDropdownEmitter = createEmitter<boolean>('feedDropdown', false, {
  comparator: isEqualNever,
})
