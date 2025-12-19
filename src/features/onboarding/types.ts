import type { SharedValue } from 'react-native-reanimated'
import type { ThemeName } from 'tamagui'
import type { IconComponent } from '~/interface/icons/types'

export type OnboardingStep =
  | 'waiting-list'
  | 'profile-setup'
  | 'avatar-setup'
  | 'notifications'
  | 'complete'

export interface SlideFeature {
  Icon: IconComponent
  title: string
}

export type SlideLayout = 'rotated' | 'cascade' | 'stack' | 'grid'

export interface OnboardingSlideData {
  id: string
  theme: ThemeName
  title: string
  layout: SlideLayout
  features: SlideFeature[]
}

export interface OnboardingProps {
  slides: OnboardingSlideData[]
  onComplete?: () => void
}

export interface OnboardingSlideProps {
  index: number
  slide: OnboardingSlideData
  scrollPosition: SharedValue<number>
  currentPage: SharedValue<number>
}

export interface AnimatedLayoutProps {
  layout: SlideLayout
  features: SlideFeature[]
  cardWidth: number
  currentPage: SharedValue<number>
  index: number
}

export interface AnimatedCardWrapperProps {
  cardIndex: number
  slideIndex: number
  currentPage: SharedValue<number>
  children: React.ReactNode
  style?: object
  rotation?: string
  baseScale?: number
}

export interface LayoutProps {
  features: SlideFeature[]
  cardWidth: number
  currentPage: SharedValue<number>
  slideIndex: number
}

export interface FeatureCardProps {
  feature: SlideFeature | undefined
  size?: number
  width?: number
  height?: number
  horizontal?: boolean
}

export interface OnboardingPageIndicatorProps {
  totalPages: number
  scrollPosition: SharedValue<number>
}

export interface IndicatorDotProps {
  index: number
  scrollPosition: SharedValue<number>
  activeColor: string
  inactiveColor: string
}
