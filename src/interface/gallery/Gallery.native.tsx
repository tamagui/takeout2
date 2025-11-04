import { Galeria } from '@nandorojo/galeria'
import { useEmitterValue } from '@vxrn/helpers'
import { Image } from '~/interface/image/Image'
import { galleryEmitter } from './galleryEmitter'

export const Gallery = () => {
  const galleryItems = useEmitterValue(galleryEmitter)
  const items = galleryItems?.items || []
  const urls = items.map((item) => item.url)

  if (!items.length) {
    return null
  }

  return (
    <Galeria urls={urls}>
      {items.map((item) => (
        <Galeria.Image key={item.id}>
          <Image
            src={item.url}
            style={{
              width: '100%',
              aspectRatio: 3 / 4,
            }}
            objectFit="cover"
          />
        </Galeria.Image>
      ))}
    </Galeria>
  )
}
