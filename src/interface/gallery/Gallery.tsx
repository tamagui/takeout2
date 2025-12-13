import { useEmitterValue } from '@take-out/helpers'
import { AnimatePresence } from '@tamagui/animate-presence'
import { useEffect, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { Portal, styled, XStack, YStack } from 'tamagui'

import { animationClamped } from '~/interface/animations/animationClamped'
import { ButtonSimple, type ButtonSimpleProps } from '~/interface/buttons/ButtonSimple'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { Image } from '~/interface/image/Image'
import { isVideoFile } from '~/interface/upload/helpers'
import { Video } from '~/interface/video/Video'

import { galleryEmitter } from './galleryEmitter'

import type { ReactNode } from 'react'

export type GalleryProps = { urls: string[]; children: ReactNode }
export type GalleryImageProps = { index?: number; children: ReactNode }

export const GalleryImage = ({ children }: GalleryImageProps) => {
  // web stub - just renders children
  return <>{children}</>
}

// web gallery wrapper - no-op, uses galleryEmitter instead
export const GalleryWrapper = ({ children }: GalleryProps) => {
  return <>{children}</>
}

const closeGallery = () => {
  galleryEmitter.emit(null)
}

const GalleryItem = styled(YStack, {
  z: 1,
  x: 0,
  opacity: 1,
  inset: 0,
  position: 'absolute',
  items: 'center',
  justify: 'center',

  variants: {
    // 1 = right, 0 = nowhere, -1 = left
    going: {
      ':number': (going) => ({
        enterStyle: {
          x: going === 0 ? 0 : going > 0 ? 1000 : -1000,
          opacity: 0,
        },
        exitStyle: {
          zIndex: 0,
          x: going === 0 ? 0 : going < 0 ? 1000 : -1000,
          opacity: 0,
        },
      }),
    },
  } as const,
})

export const Gallery = () => {
  const galleryItems = useEmitterValue(galleryEmitter)
  const [[page, going], setPage] = useState([0, 0])
  const dimensions = useWindowDimensions()
  const items = galleryItems?.items || []
  const mediaUrls = items.map((i) => i.url)
  const [lastMediaUrls, setLastMediaUrls] = useState(mediaUrls)
  const hidden = !items.length
  const currentUrl = mediaUrls[page] || lastMediaUrls[page]
  const currentItem = items[page]
  const isVideo = currentUrl ? isVideoFile(currentUrl) : false
  const paginate = (going: number) => {
    setPage([page + going, going])
  }

  if (mediaUrls.length && lastMediaUrls !== mediaUrls) {
    setLastMediaUrls(mediaUrls)
  }

  const [fullyHidden, setFullyHidden] = useState(true)
  if (!hidden && fullyHidden) {
    setFullyHidden(false)
  }

  useEffect(() => {
    if (hidden) {
      const tm = setTimeout(() => {
        setFullyHidden(true)
      }, 500)
      return () => {
        clearTimeout(tm)
      }
    }
  }, [hidden])

  const firstItem = galleryItems?.firstItem

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (firstItem) {
      setPage([items.findIndex((x) => x.id === firstItem), 0])
    }
  }, [firstItem])

  return (
    <Portal stackZIndex={1_000_000}>
      <XStack
        animation={animationClamped('quickest')}
        overflow="hidden"
        bg="$black02"
        backdropFilter="blur(20px)"
        width="100%"
        items="center"
        position="absolute"
        inset={0}
        z={100_000}
        onPress={closeGallery}
        {...(hidden
          ? {
              opacity: 0,
              pointerEvents: 'none',
            }
          : {
              opacity: 1,
              pointerEvents: 'auto',
            })}
      >
        {items && (
          <>
            <ButtonSimple
              position="absolute"
              circular
              icon={<XIcon />}
              z={100}
              size="large"
              t="$4"
              r="$4"
              onPress={closeGallery}
            />

            <AnimatePresence initial={false} custom={{ going }}>
              <GalleryItem
                key={page}
                animation={animationClamped('quickerLessBouncy')}
                going={going}
              >
                {!!currentUrl && !fullyHidden && (
                  <YStack
                    animation="quick"
                    {...(hidden ? { o: 0, y: 10 } : { o: 1, y: 0 })}
                  >
                    {isVideo ? (
                      <Video
                        src={currentUrl}
                        poster={undefined}
                        width={dimensions.width - 20}
                        height={dimensions.height - 20}
                        objectFit="contain"
                        controls
                        autoPlay
                        playsInline
                      />
                    ) : (
                      <Image
                        objectFit="scale-down"
                        src={currentUrl}
                        width={dimensions.width - 20}
                        height={dimensions.height - 20}
                      />
                    )}
                  </YStack>
                )}
              </GalleryItem>
            </AnimatePresence>

            <GalleryButton
              aria-label="Carousel left"
              l="$4"
              icon={<CaretLeftIcon />}
              onPress={(e: any) => {
                e.stopPropagation()
                paginate(-1)
              }}
              inactive={page <= 0}
            />

            <GalleryButton
              aria-label="Carousel right"
              r="$4"
              icon={<CaretRightIcon />}
              onPress={(e: any) => {
                e.stopPropagation()
                paginate(1)
              }}
              inactive={page >= mediaUrls.length - 1}
            />
          </>
        )}
      </XStack>
    </Portal>
  )
}

const GalleryButton = ({
  inactive,
  ...props
}: ButtonSimpleProps & { inactive?: boolean }) => {
  return (
    <ButtonSimple
      size="large"
      position="absolute"
      circular
      variant="floating"
      z={100}
      {...(inactive && {
        opacity: 0,
        pointerEvents: 'none',
      })}
      {...props}
    />
  )
}
