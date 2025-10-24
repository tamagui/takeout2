import { Image } from '~/interface/image/Image'
import { BlurView } from 'expo-blur'
import { CornerStyle, LiquidGlassType } from 'expo-liquid-glass-view'
import { useParams, usePathname, useRouter } from 'one'
import { memo, useRef, useState } from 'react'
import { Pressable, TextInput } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { View, XStack, YStack } from 'tamagui'
import { kWidth } from '~/constants/deviceSizes'
import { Avatar } from '~/interface/avatars/Avatar'
import { GlassView } from '../view/GlassView'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

const SPRING_CONFIG = {
  damping: 18,
  mass: 0.5,
  stiffness: 180,
}

interface FloatingAIInputProps {
  userAvatar?: string
  onSendMessage?: (message: string) => void
  isShow?: boolean
}

// HUB Bot Logo Component with glow effect
const HubBotLogo = memo(() => {
  return (
    <View
      rounded="$10"
      items="center"
      justify="center"
      borderColor="rgba(129, 140, 248, 0.3)"
      style={{
        boxShadow: '0 0 20px rgba(99, 102, 241, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)',
      }}
    >
      <YStack items="center" justify="center">
        <Image
          src={require('../../../assets/hud.webp')}
          width={28}
          height={28}
          opacity={0.8}
        />
      </YStack>
    </View>
  )
})

export const FloatingAIInput = memo(
  ({
    userAvatar = 'https://avatars.githubusercontent.com/u/17813202?v=4',
    onSendMessage,
    isShow = false,
  }: FloatingAIInputProps) => {
    const { bottom } = useSafeAreaInsets()
    const [inputFocused, setInputFocused] = useState(false)
    const pathName = usePathname()
    const params = useParams()
    const router = useRouter()
    const inputRef = useRef<TextInput>(null)

    const isAIScreen = pathName === '/ai'
    const isLoginScreen = pathName === '/auth'

    console.info('params shows in ai', params)

    return (
      <>
        {isShow && !isLoginScreen && (
          <YStack
            animation="medium"
            enterStyle={{
              opacity: 0,
            }}
            exitStyle={{
              opacity: 0,
            }}
            position="absolute"
            b={bottom}
            r={8}
            z={999}
          >
            <GlassView
              borderRadius={30}
              cornerStyle={CornerStyle.Circular}
              liquidGlassType={LiquidGlassType.Interactive}
              intensity={40}
              tint="dark"
            >
              {/* Expanded content */}
              <XStack width={kWidth - 16} height={48} items="center" gap="$3" px="$2">
                <Avatar image={userAvatar} size={36} isOnline />

                <Pressable
                  onPress={() => {
                    if (!isAIScreen) {
                      router.push('/ai')
                    } else {
                      inputRef.current?.focus()
                    }
                  }}
                  style={{
                    flex: 1,
                  }}
                >
                  <TextInput
                    ref={inputRef}
                    placeholder="Chat with Hud..."
                    style={{
                      flex: 1,
                      height: '100%',
                      paddingHorizontal: 8,
                    }}
                    editable={!isAIScreen}
                    onFocus={() => {
                      setInputFocused(true)
                    }}
                    onBlur={() => {
                      setInputFocused(false)
                    }}
                    pointerEvents={isAIScreen ? 'auto' : 'none'}
                  />
                </Pressable>
                <HubBotLogo />
              </XStack>
            </GlassView>
          </YStack>
        )}
      </>
    )
  }
)
