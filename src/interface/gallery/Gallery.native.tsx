import { Galeria } from '@nandorojo/galeria'
import type { ReactElement } from 'react'
import type { GalleryImageProps, GalleryProps } from './Gallery'

export const GalleryWrapper = ({ urls, children }: GalleryProps) => {
  return <Galeria urls={urls}>{children as ReactElement}</Galeria>
}

export const GalleryImage = ({ index, children }: GalleryImageProps) => {
  return <Galeria.Image index={index}>{children as ReactElement}</Galeria.Image>
}

export type { GalleryProps, GalleryImageProps }
