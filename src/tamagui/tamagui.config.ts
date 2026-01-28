import { defaultConfig, shorthands, tokens } from '@tamagui/config/v5'
import { createTamagui } from 'tamagui'

import { animationsRoot } from './animationsRoot'
import { fonts } from './fonts'
import { themes as themesJS } from './themes'

export const config = createTamagui({
  ...defaultConfig,
  animations: animationsRoot,
  shorthands,
  tokens,
  fonts,

  // tamagui optimization - reduce bundle size by avoiding themes js on client
  // tamagui will hydrate it from CSS which improves lighthouse scores
  themes: process.env.VITE_ENVIRONMENT === 'client' ? ({} as typeof themesJS) : themesJS,

})

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}

  interface TypeOverride {
    groupNames(): 'button' | 'message' | 'icon' | 'item' | 'frame' | 'card'
  }
}
