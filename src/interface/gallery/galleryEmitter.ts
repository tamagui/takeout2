import { createEmitter, isEqualNever } from '@vxrn/helpers'
import type { GalleryState } from './types'

export const galleryEmitter = createEmitter<GalleryState>('gallery', null, {
  comparator: isEqualNever,
})
