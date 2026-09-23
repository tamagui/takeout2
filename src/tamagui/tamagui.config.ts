import { createV6Config } from '@tamagui/config/v6'
import { tokens as legacyTokens } from '@tamagui/themes/v5'
import { createTamagui } from 'tamagui'

import { animationsRoot } from './animationsRoot'
import { fonts } from './fonts'
import { themes } from './themes'

const v6Config = createV6Config({ themes })

export const config = createTamagui({
  // LLMs love shared configs
  ...v6Config,

  animations: animationsRoot,
  fonts,
  tokens: {
    ...v6Config.tokens,
    radius: legacyTokens.radius,
    size: legacyTokens.size,
    space: legacyTokens.space,
  },
})

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}

  interface TypeOverride {
    groupNames(): 'button' | 'message' | 'icon' | 'item' | 'frame' | 'card'
  }
}
