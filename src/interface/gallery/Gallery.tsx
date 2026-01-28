import { useEmitterValue } from '@take-out/helpers'
import { useEffect, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { AnimatePresence, Circle, Portal, styled, XStack, YStack } from 'tamagui'

import { animationClamped } from '~/interface/animations/animationClamped'
import { Button, type ButtonProps } from '~/interface/buttons/Button'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { Image } from '~/interface/image/Image'
import { isVideoFile } from '~/interface/upload/helpers'
import { Video } from '~/interface/video/Video'

import { Pressable } from '../buttons/Pressable'
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
  const isVideo = currentUrl ? isVideoFile(currentUrl) : false
  const paginate = (going: number) => {
    setPage([page + going, going])
  }

  useEffect(() => {
    if (mediaUrls.length) {
      setLastMediaUrls(mediaUrls)
    }
  }, [mediaUrls])

  const [fullyHidden, setFullyHidden] = useState(true)

  useEffect(() => {
    if (hidden) {
      const tm = setTimeout(() => {
        setFullyHidden(true)
      }, 500)
      return () => {
        clearTimeout(tm)
      }
    } else {
      setFullyHidden(false)
    }
  }, [hidden])

  const firstItem = galleryItems?.firstItem

  useEffect(() => {
    if (firstItem && galleryItems?.items) {
      const index = galleryItems.items.findIndex((x) => x.id === firstItem)
      if (index >= 0) {
        setPage([index, 0])
      }
    }
  }, [firstItem, galleryItems])

  return (
    <Portal stackZIndex={1_000_000}>
      <XStack
        transition={animationClamped('quickest')}
        overflow="hidden"
        bg="$black02"
        backdropFilter="blur(20px)"
        items="center"
        position="fixed"
        t={0}
        l={0}
        r={0}
        b={0}
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
            <Pressable
              onPress={(e: any) => {
                e.stopPropagation()
                e.preventDefault()
                closeGallery()
              }}
              position="absolute"
              t="$4"
              r="$4"
              z={999}
            >
              <Circle size={40} bg="$color2">
                <XIcon />
              </Circle>
            </Pressable>

            <AnimatePresence initial={false} custom={{ going }}>
              <GalleryItem
                key={page}
                transition={animationClamped('quickerLessBouncy')}
                going={going}
              >
                {!!currentUrl && !fullyHidden && (
                  <YStack
                    transition="quick"
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

const GalleryButton = ({ inactive, ...props }: ButtonProps & { inactive?: boolean }) => {
  return (
    <Button
      size="large"
      position="absolute"
      circular
      z={100}
      {...(inactive && {
        opacity: 0,
        pointerEvents: 'none',
      })}
      {...props}
    />
  )
}
