import { createEmitter, isEqualNever } from '@o/helpers'

export const scrollToTopEmitter = createEmitter<'home' | false>('scrollToTop', false, {
  comparator: isEqualNever,
})
