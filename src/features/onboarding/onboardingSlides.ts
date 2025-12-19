import { CheckCircleIcon } from '~/interface/icons/phosphor/CheckCircleIcon'
import { DatabaseIcon } from '~/interface/icons/phosphor/DatabaseIcon'
import { DeviceMobileSpeakerIcon } from '~/interface/icons/phosphor/DeviceMobileSpeakerIcon'
import { FireIcon } from '~/interface/icons/phosphor/FireIcon'
import { GearIcon } from '~/interface/icons/phosphor/GearIcon'
import { GlobeIcon } from '~/interface/icons/phosphor/GlobeIcon'
import { LockIcon } from '~/interface/icons/phosphor/LockIcon'
import { PaletteIcon } from '~/interface/icons/phosphor/PaletteIcon'
import { RocketIcon } from '~/interface/icons/phosphor/RocketIcon'
import { SparkleIcon } from '~/interface/icons/phosphor/SparkleIcon'
import { StackIcon } from '~/interface/icons/phosphor/StackIcon'

import type { OnboardingSlideData } from './types'

export const onboardingSlides: OnboardingSlideData[] = [
  {
    id: 'universal',
    theme: 'blue',
    title: 'Universal',
    layout: 'rotated',
    features: [
      { Icon: GlobeIcon, title: 'Cross-platform' },
      { Icon: DeviceMobileSpeakerIcon, title: 'Native feel' },
      { Icon: StackIcon, title: 'One codebase' },
      { Icon: SparkleIcon, title: 'DRY & Simple' },
    ],
  },
  {
    id: 'performance',
    theme: 'red',
    title: 'Blazing Fast',
    layout: 'cascade',
    features: [
      { Icon: FireIcon, title: 'Fast runtime' },
      { Icon: RocketIcon, title: 'Quick builds' },
      { Icon: GearIcon, title: 'Optimized' },
      { Icon: CheckCircleIcon, title: 'Production ready' },
    ],
  },
  {
    id: 'stack',
    theme: 'green',
    title: 'Modern Stack',
    layout: 'stack',
    features: [
      { Icon: RocketIcon, title: 'One' },
      { Icon: DatabaseIcon, title: 'Zero' },
      { Icon: PaletteIcon, title: 'Tamagui' },
      { Icon: StackIcon, title: 'Expo' },
    ],
  },
  {
    id: 'reliable',
    theme: 'yellow',
    title: 'Ship Confident',
    layout: 'grid',
    features: [
      { Icon: CheckCircleIcon, title: 'Type-safe' },
      { Icon: DatabaseIcon, title: 'Postgres' },
      { Icon: LockIcon, title: 'Self-host' },
      { Icon: SparkleIcon, title: 'OSS' },
    ],
  },
]
