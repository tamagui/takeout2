import { createEmitter, isEqualNever } from '@take-out/helpers'

// Type definition for gallery state
type GalleryState = null | {
  items: Array<{ id: string; url: string }>
  firstItem?: string
}

export const galleryEmitter = createEmitter<GalleryState>('gallery', null, {
  comparator: isEqualNever,
})
