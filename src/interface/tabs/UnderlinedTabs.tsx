import type { ReactNode } from 'react'
import { Children } from 'react'
import { useWindowDimensions } from 'react-native'
import {
  SizableText,
  View,
  withStaticProperties,
  XStack,
  type XStackProps,
} from 'tamagui'

interface UnderlinedTabsProps extends XStackProps {
  children: ReactNode
  activeIndex: number
}

const UnderlinedTabsFrame = ({
  children,
  activeIndex,
  ...props
}: UnderlinedTabsProps) => {
  const childrenArray = Children.toArray(children)
  const tabCount = childrenArray.length
  const tabWidthPct = 100 / tabCount
  const tabWidthPx = useWindowDimensions().width / tabCount

  return (
    <XStack width="100%" position="relative" {...props}>
      {children}

      {/* static full underline */}
      <XStack
        position="absolute"
        b={0}
        l={0}
        r={0}
        height={2}
        rounded="$10"
        bg="$color3"
        z={-1}
      />

      {/* active underline */}
      <XStack
        animation="quickLessBouncy"
        position="absolute"
        b={0}
        height={2}
        bg="$color12"
        rounded="$10"
        width={`${tabWidthPct}%`}
        x={activeIndex * tabWidthPx}
      />
    </XStack>
  )
}

interface TabProps extends XStackProps {
  children: ReactNode
  active?: boolean
  onPress?: () => void
}

const Tab = ({ children, active, onPress, ...props }: TabProps) => {
  return (
    <XStack
      flex={1}
      items="center"
      justify="center"
      py="$3"
      onPress={onPress}
      cursor="pointer"
      {...props}
    >
      <SizableText
        size="$4"
        fontWeight="600"
        color={active ? '$color12' : '$color10'}
        animation="quickLessBouncy"
      >
        {children}
      </SizableText>
    </XStack>
  )
}

export const UnderlinedTabs = withStaticProperties(UnderlinedTabsFrame, {
  Tab,
})
