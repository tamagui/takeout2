import { createEmitter, isEqualNever } from '@tamatko/helpers'

export const scrollToTopEmitter = createEmitter<'home' | false>('scrollToTop', false, {
  comparator: isEqualNever,
})
