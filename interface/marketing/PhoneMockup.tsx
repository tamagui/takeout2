import { styled, YStack } from 'tamagui'

const PhoneContainer = styled(YStack, {
  maxW: '100%',
  maxH: '100%',
  items: 'center',
  justify: 'center',
  self: 'center',
  aspectRatio: 588 / 1176,
})

export function PhoneMockup() {
  return (
    <PhoneContainer y="lg:20px">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="iphone-screen-clip-1" clipPathUnits="objectBoundingBox">
            <rect x="0" y="0" width="1" height="1" rx="0.19" ry="0.081" />
          </clipPath>
          <clipPath
            id="iphone-screen-clip"
            clipPathUnits="objectBoundingBox"
            clipPath="url(#iphone-screen-clip-1)"
          >
            <rect x="0" y="0" width="1" height="1" rx="0.17" ry="0.088" />
          </clipPath>
        </defs>
      </svg>
      <YStack style={{ filter: 'drop-shadow(0 35px 50px rgba(0,0,0,0.6))' }}>
        <YStack
          overflow="hidden"
          position="relative"
          style={{
            width: 286,
            height: 593,
            clipPath: 'url(#iphone-screen-clip)',
            WebkitClipPath: 'url(#iphone-screen-clip)',
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/iphone-frame.webp"
            ref={(el) => {
              if (el) el.playbackRate = 1.3
            }}
            style={{
              position: 'absolute',
              top: -3,
              left: -6,
              width: 294 + 4,
              height: 588 + 12,
              objectFit: 'cover',
            }}
          >
            <source
              src="https://pub-836fc09a8b0e484f900cd6aa05105026.r2.dev/videos/appdemo2_h265.mp4"
              type="video/mp4; codecs=hvc1"
            />
            <source
              src="https://pub-836fc09a8b0e484f900cd6aa05105026.r2.dev/videos/appdemo2_h264.mp4"
              type="video/mp4"
            />
          </video>
        </YStack>
      </YStack>
    </PhoneContainer>
  )
}
