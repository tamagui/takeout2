import { createEmitter, isEqualNever } from '@take-out/helpers'

export const scrollToTopEmitter = createEmitter<'home' | false>('scrollToTop', false, {
  comparator: isEqualNever,
})
