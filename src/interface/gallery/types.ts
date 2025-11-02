export type GalleryItem = {
  id: string
  url: string
}

export type GalleryState = {
  items: readonly GalleryItem[]
  firstItem?: string
} | null
