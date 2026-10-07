import { One } from 'one'
import { View } from 'react-native'
import { YStack, type GetProps } from 'tamagui'

export type MaskedFadeProps = GetProps<typeof YStack> & {
  // 0-1 fraction of the height kept fully opaque before the fade to transparent
  // begins at the bottom edge.
  fadeStart?: number
}

// native counterpart of MaskedFade (see MaskedFade.tsx). One.UI.Mask keeps the
// wrapped content where the mask is opaque and fades it out where the mask turns
// transparent, giving a real alpha mask that matches the web CSS mask. the mask
// is a plain view painted with an RN core backgroundImage gradient, so no
// native-module package is involved on either side. keep both files in sync.
export function MaskedFade({ fadeStart = 0.6, children, ...props }: MaskedFadeProps) {
  const clamped = Math.min(1, Math.max(0, fadeStart))
  const pct = Math.round(clamped * 100)
  return (
    <YStack {...props}>
      <One.UI.Mask
        style={{ flex: 1 }}
        maskElement={
          <View
            style={{
              flex: 1,
              backgroundImage: `linear-gradient(to bottom, #000 0%, #000 ${pct}%, transparent 100%)`,
            }}
          />
        }
      >
        {children}
      </One.UI.Mask>
    </YStack>
  )
}
