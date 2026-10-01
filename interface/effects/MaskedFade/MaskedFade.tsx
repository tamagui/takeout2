import { YStack, type GetProps } from 'tamagui'

export type MaskedFadeProps = GetProps<typeof YStack> & {
  // 0-1 fraction of the height kept fully opaque before the fade to transparent
  // begins at the bottom edge.
  fadeStart?: number
}

// cross-platform bottom fade. the wrapped content dissolves to transparent toward
// the bottom edge using a real alpha mask that reveals whatever sits behind it
// (rather than painting a solid-color overlay). web applies a CSS mask-image; the
// `.native` sibling uses One.UI.Mask over an RN core backgroundImage gradient so
// the identical fade renders on real RN. keep both files in sync.
export function MaskedFade({ fadeStart = 0.6, children, ...props }: MaskedFadeProps) {
  const pct = Math.round(Math.min(1, Math.max(0, fadeStart)) * 100)
  return (
    <YStack maskImage={`linear-gradient(to bottom, #000 ${pct}%, transparent 100%)`} {...props}>
      {children}
    </YStack>
  )
}
