import { createEmitter, isEqualNever } from '@tamatko/helpers'
import type { GalleryState } from './types'

export const galleryEmitter = createEmitter<GalleryState>('gallery', null, {
  comparator: isEqualNever,
})
