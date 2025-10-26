import { BlurView } from 'expo-blur'
import type React from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Text, View } from 'tamagui'
import { kWidth } from '~/interface/dimensions'

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)
const AnimatedView = Animated.createAnimatedComponent(View)
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

interface FloatingActionButtonProps {
  onPress?: () => void
}

interface MenuItemProps {
  icon: string
  title: string
  subtitle: string
  index: number
  isExpanded: Animated.SharedValue<boolean>
  onPress?: () => void
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  index,
  isExpanded,
  onPress,
}) => {
  const itemStyle = useAnimatedStyle(() => {
    return {
      opacity: isExpanded.value
        ? withDelay(
            500 + index * 50,
            withTiming(1, {
              duration: 200,
              easing: Easing.out(Easing.ease),
            })
          )
        : withTiming(0, { duration: 40 }),
      transform: [
        {
          translateY: isExpanded.value
            ? withDelay(500 + index * 50, withSpring(0))
            : withSpring(20),
        },
      ],
    }
  })

  return (
    <AnimatedTouchableOpacity
      style={[styles.menuItem, itemStyle]}
      entering={FadeIn.delay(index * 50)}
      activeOpacity={0.7}
      exiting={FadeOut.delay(index * 50)}
      onPress={onPress}
    >
      <View style={styles.menuItemIcon}>
        {/* <Ionicons name={icon as any} size={24} color="#ffffff" /> */}
      </View>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
      </View>
    </AnimatedTouchableOpacity>
  )
}

export function ButtonFAB({ onPress }: FloatingActionButtonProps) {
  const isExpanded = useSharedValue(false)

  const animatedOverlayOpacity = useDerivedValue(() =>
    withTiming(isExpanded.value ? 1 : 0, { duration: 300 })
  )

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedOverlayOpacity.value,
      pointerEvents: isExpanded.value ? 'auto' : 'none',
    }
  })

  const containerStyle = useAnimatedStyle(() => {
    const expandedWidth = kWidth - 40
    const expandedHeight = 400
    const fabSize = 42

    return {
      width: withSpring(isExpanded.value ? expandedWidth : fabSize),
      height: withSpring(isExpanded.value ? expandedHeight : fabSize),
      borderRadius: withSpring(isExpanded.value ? 20 : 28),
      bottom: withSpring(isExpanded.value ? 40 : 20),
    }
  })

  const iconStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isExpanded.value ? 0 : 1, { duration: 200 }),
      transform: [
        {
          rotate: withTiming(isExpanded.value ? '45deg' : '0deg', {
            duration: 300,
          }),
        },
      ],
    }
  })

  const closeButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isExpanded.value ? 1 : 0, { duration: 200 }),
      transform: [
        {
          scale: withTiming(isExpanded.value ? 1 : 0.5, { duration: 200 }),
        },
      ],
    }
  })

  const handlePress = () => {
    isExpanded.value = !isExpanded.value
    onPress?.()
  }

  const menuItems = [
    {
      icon: 'add',
      title: 'Add Money',
      subtitle: 'Add money to your wallet using your bank account or card.',
    },
    {
      icon: 'filter',
      title: 'Filter',
      subtitle: 'Filter transactions by date, type, or amount.',
    },
    {
      icon: 'download',
      title: 'Receive',
      subtitle: 'Ask for money from friends or family.',
    },
    {
      icon: 'wallet',
      title: 'Transactions',
      subtitle: 'View your transaction history and details.',
    },
  ]

  return (
    <>
      <AnimatedView style={[styles.backdrop, backdropStyle]}>
        <AnimatedBlurView
          intensity={80}
          style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}
          tint={'systemChromeMaterialDark'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handlePress}
            activeOpacity={1}
          />
        </AnimatedBlurView>
      </AnimatedView>

      <AnimatedTouchableOpacity
        style={[styles.container, containerStyle]}
        onPress={handlePress}
        activeOpacity={1}
      >
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          {/* <Ionicons name="add" size={24} color="white" /> */}
        </Animated.View>

        <Animated.View style={[styles.closeButton, closeButtonStyle]}>
          <TouchableOpacity onPress={handlePress}>
            {/* <Ionicons name="close" size={24} color="#666" /> */}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.expandedContent}>
          {menuItems.map((item, index) => (
            <MenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              index={index}
              isExpanded={isExpanded}
              onPress={() => {
                isExpanded.value = false
              }}
            />
          ))}
        </View>
      </AnimatedTouchableOpacity>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    backgroundColor: '#1a1a1a',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
  iconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 22,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 998,
  },
})
