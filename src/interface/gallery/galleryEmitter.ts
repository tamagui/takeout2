import { createEmitter, isEqualNever } from '@take-out/helpers'
import type { GalleryState } from './types'

export const galleryEmitter = createEmitter<GalleryState>('gallery', null, {
  comparator: isEqualNever,
})
