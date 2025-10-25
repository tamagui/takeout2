import { createEmitter, isEqualNever } from '@vxrn/helpers'

export const scrollToTopEmitter = createEmitter<'home' | false>('scrollToTop', false, {
  comparator: isEqualNever,
})
