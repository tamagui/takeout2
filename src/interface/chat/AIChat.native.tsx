import { Button, ContextMenu } from '@expo/ui/swift-ui'
import type { LegendListRef } from '@legendapp/list'
import { LegendList } from '@legendapp/list/keyboard-controller'
import { AnimatedLegendList } from '@legendapp/list/reanimated'
import { Image } from '~/interface/image/Image'
import {
  ArrowUp,
  AudioLines,
  Image as ImageIcon,
  Menu,
  Paperclip,
  Plus,
  Settings,
} from '@tamagui/lucide-icons'
import { BlurView } from 'expo-blur'
import { AnimatedMeshGradient } from 'expo-ios-mesh-gradient'
import { useFocusEffect } from 'one'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  type View as RNView,
} from 'react-native'
import { Drawer } from 'react-native-drawer-layout'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Circle, Text, useTheme, View, XStack, YStack } from 'tamagui'
import { kWidth } from '~/constants/deviceSizes'
import { GlassView } from '~/interface/view/GlassView'
import { AIChatDrawer } from './AIChatDrawer.native'
import { AIChatSuggestions } from './AIChatSuggestions.native'
import { SiriMeshGradient } from './SiriMeshGradient.native'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

type Message = {
  id: string
  text: string
  sender: 'user' | 'bot'
  timeStamp: number
}
const COLORS = ['#9C3E76', '#7873f5', '#16213e', '#0f3460']

let idCounter = 0
const MS_PER_SECOND = 1000
const BUTTON_SIZE = 40
// 80 + 8 for padding left + 8 for gap
const OPTIONS_WIDTH = BUTTON_SIZE * 2 + 16
const GAP_WIDTH = 32
const ELEMENTS_WIDTH = BUTTON_SIZE * 4
const INPUT_SHRINK_WIDTH = kWidth - GAP_WIDTH - ELEMENTS_WIDTH
const INPUT_WIDTH = kWidth - 16 - 80

const defaultChatMessages: Message[] = [
  {
    id: String(idCounter++),
    text: 'Hi, I have a question about your product',
    sender: 'user',
    timeStamp: Date.now() - MS_PER_SECOND * 5,
  },
  {
    id: String(idCounter++),
    text: 'Hello there! How can I assist you today?',
    sender: 'bot',
    timeStamp: Date.now() - MS_PER_SECOND * 4,
  },
  {
    id: String(idCounter++),
    text: "I'm looking for information about pricing plans",
    sender: 'user',
    timeStamp: Date.now() - MS_PER_SECOND * 4,
  },
  {
    id: String(idCounter++),
    text: 'We offer several pricing tiers based on your needs',
    sender: 'bot',
    timeStamp: Date.now() - MS_PER_SECOND * 4,
  },
  {
    id: String(idCounter++),
    text: 'Our basic plan starts at $9.99 per month',
    sender: 'bot',
    timeStamp: Date.now() - MS_PER_SECOND * 4,
  },
  {
    id: String(idCounter++),
    text: 'Do you offer any discounts for annual billing?',
    sender: 'user',
    timeStamp: Date.now() - MS_PER_SECOND * 4,
  },
  {
    id: String(idCounter++),
    text: 'Yes! You can save 20% with our annual billing option',
    sender: 'bot',
    timeStamp: Date.now() - MS_PER_SECOND * 4,
  },
  {
    id: String(idCounter++),
    text: 'That sounds great. What features are included?',
    sender: 'user',
    timeStamp: Date.now() - MS_PER_SECOND * 4,
  },
  {
    id: String(idCounter++),
    text: 'The basic plan includes all core features plus 10GB storage',
    sender: 'bot',
    timeStamp: Date.now() - MS_PER_SECOND * 4,
  },
  {
    id: String(idCounter++),
    text: 'Premium plans include priority support and additional tools',
    sender: 'bot',
    timeStamp: Date.now() - MS_PER_SECOND * 4,
  },
  {
    id: String(idCounter++),
    text: 'I think the basic plan would work for my needs',
    sender: 'user',
    timeStamp: Date.now() - MS_PER_SECOND * 4,
  },
  {
    id: String(idCounter++),
    text: 'Perfect! I can help you get set up with that',
    sender: 'bot',
    timeStamp: Date.now() - MS_PER_SECOND * 4,
  },
  {
    id: String(idCounter++),
    text: 'Thanks for your help so far',
    sender: 'user',
    timeStamp: Date.now() - MS_PER_SECOND * 4,
  },
  {
    id: String(idCounter++),
    text: "You're welcome! Is there anything else I can assist with today?",
    sender: 'bot',
    timeStamp: Date.now() - MS_PER_SECOND * 3,
  },
]

const HubBotLogo = memo(({ isExpanded }: { isExpanded: boolean }) => {
  return (
    <Circle
      size={BUTTON_SIZE}
      items="center"
      justify="center"
      borderColor="rgba(129, 140, 248, 0.3)"
      style={{
        boxShadow: '0 0 20px rgba(99, 102, 241, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)',
      }}
      bg="$surface"
    >
      <YStack
        items="center"
        justify="center"
        position="relative"
        width={BUTTON_SIZE}
        height={BUTTON_SIZE}
      >
        {/* Hub image - rotates and fades out when expanded */}
        <YStack
          position="absolute"
          items="center"
          justify="center"
          animation="200ms"
          opacity={isExpanded ? 0 : 1}
          scale={isExpanded ? 0.3 : 1}
          rotate={isExpanded ? '180deg' : '0deg'}
          enterStyle={{
            opacity: 0,
            scale: 0.5,
            rotate: '-180deg',
          }}
        >
          <Image
            src={require('../../../assets/hud.webp')}
            width={BUTTON_SIZE}
            height={BUTTON_SIZE}
            opacity={0.8}
          />
        </YStack>
        <YStack
          position="absolute"
          items="center"
          justify="center"
          animation="200ms"
          opacity={isExpanded ? 1 : 0}
          scale={isExpanded ? 1 : 0.3}
          rotate={isExpanded ? '0deg' : '-180deg'}
          enterStyle={{
            opacity: 0,
            scale: 0.5,
            rotate: '180deg',
          }}
        >
          <Plus size={18} color="$color" strokeWidth={2} />
        </YStack>
      </YStack>
    </Circle>
  )
})

const MessageBubble = memo(({ message }: { message: Message }) => {
  const isUser = message.sender === 'user'

  return (
    <YStack>
      <>
        <View
          maxW={kWidth * 0.75}
          style={[
            styles.messageContainer,
            message.sender === 'bot' ? styles.botStyle : styles.userStyle,
            {
              backgroundColor: isUser ? '$background02' : 'transparent',
              borderWidth: isUser ? 1 : 0,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
          ]}
        >
          <Text color="$color12">{message.text}</Text>
        </View>
        {isUser && (
          <Text mt="$1" color="$color11" fontSize="$2" text="right">
            {new Date(message.timeStamp).toLocaleTimeString()}
          </Text>
        )}
      </>
    </YStack>
  )
})

export const AIChat = memo(() => {
  const { color, surface } = useTheme()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
  const [voiceMode, setVoiceMode] = useState<boolean>(false)
  const [showRipple, setShowRipple] = useState<boolean>(false)
  const [rippleStartPosition, setRippleStartPosition] = useState<
    | {
        x: number
        y: number
      }
    | undefined
  >()
  const { top, bottom } = useSafeAreaInsets()

  const listRef = useRef<LegendListRef>(null)
  const inputRef = useRef<TextInput>(null)
  const voiceButtonRef = useRef<RNView>(null)

  // reanimated shared values
  const hasText = inputText.trim().length > 0
  const offsetY = useSharedValue(0)

  const inputHeight = useSharedValue<number>(0)

  // Animated style for height change
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(inputHeight.value),
    }
  })

  const handleContentSizeChange = (height: number) => {
    inputHeight.value = height
  }

  const scrollHandler = useAnimatedScrollHandler((event) => {
    offsetY.value = event.contentOffset.y
  })
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const sendMessage = () => {
    const text = inputText || 'Empty message'
    if (text.trim()) {
      setMessages((messages) => [
        ...messages,
        { id: String(idCounter++), text: text, sender: 'user', timeStamp: Date.now() },
      ])
      setInputText('')
      setTimeout(() => {
        setMessages((messages) => [
          ...messages,
          {
            id: String(idCounter++),
            text: `Answer: ${text.toUpperCase()}`,
            sender: 'bot',
            timeStamp: Date.now(),
          },
        ])
      }, 300)
    }
  }

  useEffect(() => {
    if (isExpanded && hasText) {
      setIsExpanded(false)
    }
  }, [isExpanded, hasText])

  const handleNewChat = () => {
    setMessages([])
  }

  const handleSelectChat = (chatId: string) => {
    console.info(`Selected chat: ${chatId}`)
    // Load chat messages based on chatId
    // For now, just show empty state
    setMessages([])
  }

  useFocusEffect(
    useCallback(() => {
      inputRef.current?.focus()
    }, []),
    []
  )

  return (
    <Drawer
      open={drawerOpen}
      onOpen={() => setDrawerOpen(true)}
      onClose={() => setDrawerOpen(false)}
      swipeEnabled={false}
      renderDrawerContent={() => (
        <AIChatDrawer
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onClose={() => setDrawerOpen(false)}
        />
      )}
      drawerType="slide"
      drawerPosition="left"
      drawerStyle={{
        width: 280,
      }}
    >
      <View flex={1} bg="$background" pb={bottom}>
        <AnimatedMeshGradient
          columns={3}
          rows={3}
          colors={COLORS}
          smoothsColors
          animated={false}
          animationSpeed={0.001}
          style={StyleSheet.absoluteFillObject}
        />
        <XStack
          px="$4"
          pb="$3"
          items="center"
          minH={60}
          style={{
            paddingTop: top,
            width: '100%',
          }}
          justify="space-between"
        >
          <TouchableOpacity onPress={() => setDrawerOpen(true)}>
            <View width={36} height={36} items="center" justify="center">
              <Menu size={24} color="$color" />
            </View>
          </TouchableOpacity>
          <XStack items="center" gap="$2">
            <Image
              src={require('../../../assets/hud.webp')}
              width={BUTTON_SIZE}
              height={BUTTON_SIZE}
              opacity={0.8}
            />
            <Text fontSize="$6" fontWeight="600">
              Hub
            </Text>
          </XStack>

          <ContextMenu>
            <ContextMenu.Items>
              <Button
                systemImage="pencil.line"
                onPress={() => {
                  console.info('Help & support')
                }}
              >
                New Chat
              </Button>
              <Button
                systemImage="questionmark.circle"
                onPress={() => {
                  console.info('Help & support')
                }}
              >
                Help & Support
              </Button>
              <Button
                systemImage="info.circle"
                onPress={() => {
                  console.info('About')
                }}
              >
                About
              </Button>
            </ContextMenu.Items>
            <ContextMenu.Trigger>
              <GlassView borderRadius={16} intensity={30}>
                <View items="center" justify="center" width={36} height={36}>
                  <Settings size={16} color="$color" strokeWidth={2.5} />
                </View>
              </GlassView>
            </ContextMenu.Trigger>
          </ContextMenu>
        </XStack>
        <KeyboardAvoidingView
          style={styles.container}
          behavior="position"
          contentContainerStyle={{ flex: 1 }}
        >
          <YStack flex={1} animation="medium" opacity={1} enterStyle={{ opacity: 0 }}>
            <LegendList
              ref={listRef}
              data={messages}
              contentContainerStyle={styles.contentContainer}
              keyExtractor={(item) => item.id}
              estimatedItemSize={80}
              LegendList={AnimatedLegendList}
              onScroll={scrollHandler}
              recycleItems
              waitForInitialLayout
              maintainScrollAtEnd
              alignItemsAtEnd
              initialScrollIndex={messages.length > 0 ? messages.length - 1 : 0}
              maintainVisibleContentPosition
              keyboardDismissMode="interactive"
              renderItem={({ item }) => <MessageBubble message={item} />}
            />
          </YStack>
          <YStack>
            {/* Suggestions */}
            <AIChatSuggestions
              visible={messages.length === 0 && !hasText}
              onSelectSuggestion={(text) => setInputText(text)}
            />
            <XStack px="$2" items="center" py="$2">
              <TouchableOpacity onPress={toggleExpanded}>
                <HubBotLogo isExpanded={isExpanded} />
              </TouchableOpacity>
              {/* Width animation container - slower bouncy animation */}
              <XStack
                animation="200ms"
                width={isExpanded ? OPTIONS_WIDTH : 0}
                overflow="hidden"
                items="center"
                justify="flex-end"
                pointerEvents={isExpanded ? 'auto' : 'none'}
              >
                {/* Opacity animation container - quick 100ms */}
                <XStack
                  animation="100ms"
                  opacity={isExpanded ? 1 : 0}
                  scale={isExpanded ? 1 : 0.8}
                  items="center"
                  justify="flex-end"
                  gap="$2"
                  enterStyle={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  exitStyle={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                >
                  <Circle size={BUTTON_SIZE} bg="$surface">
                    <ImageIcon size={16} color="$color12" />
                  </Circle>
                  <Circle size={BUTTON_SIZE} bg="$surface">
                    <Paperclip size={16} color="$color12" />
                  </Circle>
                </XStack>
              </XStack>
              <YStack
                animation="200ms"
                width={isExpanded ? INPUT_SHRINK_WIDTH : INPUT_WIDTH}
                px="$2"
              >
                <BlurView
                  intensity={50}
                  tint="regular"
                  style={{
                    borderRadius: 30,
                    overflow: 'hidden',
                    backgroundColor: surface.val,
                  }}
                >
                  <YStack style={styles.inputContainer}>
                    <AnimatedTextInput
                      ref={inputRef}
                      placeholder="Chat with Hud..."
                      value={inputText}
                      onChangeText={setInputText}
                      multiline
                      numberOfLines={4}
                      style={[
                        styles.input,
                        {
                          color: color.val,
                        },
                      ]}
                      // onContentSizeChange={(e) => {
                      //   handleContentSizeChange(e.nativeEvent.contentSize.height)
                      // }}
                    />
                  </YStack>
                </BlurView>
              </YStack>

              <YStack justify="center" items="center">
                <YStack
                  animation="200ms"
                  scale={hasText ? 1 : 0}
                  opacity={hasText ? 1 : 0}
                  enterStyle={{
                    scale: 0.5,
                    opacity: 0,
                  }}
                  pressStyle={{
                    scale: 0.9,
                  }}
                >
                  <TouchableOpacity onPress={sendMessage}>
                    <Circle size={BUTTON_SIZE} bg="$surface">
                      <ArrowUp size={16} color="$color12" />
                    </Circle>
                  </TouchableOpacity>
                </YStack>
                <YStack
                  animation="200ms"
                  scale={!hasText ? 1 : 0}
                  opacity={!hasText ? 1 : 0}
                  enterStyle={{
                    scale: 0.5,
                    opacity: 0,
                  }}
                  pressStyle={{
                    scale: 0.9,
                  }}
                  position="absolute"
                >
                  <TouchableOpacity
                    ref={voiceButtonRef}
                    onPress={() => {
                      // Get the button's position on screen
                      voiceButtonRef.current?.measure((fx, fy, width, height, px, py) => {
                        // Set position to center of the button
                        setRippleStartPosition({
                          x: px + width / 2,
                          y: py + height / 2,
                        })
                        setShowRipple(true)
                      })
                    }}
                  >
                    <Circle size={BUTTON_SIZE} bg="$surface">
                      <AudioLines size={16} color="$color12" />
                    </Circle>
                  </TouchableOpacity>
                </YStack>
              </YStack>
            </XStack>
          </YStack>
        </KeyboardAvoidingView>
      </View>

      {/* Siri Mesh Gradient Effect with Ripple */}
      <SiriMeshGradient
        visible={showRipple}
        onClose={() => {
          setShowRipple(false)
          setRippleStartPosition(undefined)
        }}
        startPosition={rippleStartPosition}
      />
    </Drawer>
  )
})
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  messageContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginVertical: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    borderRadius: 5,
    padding: 12,
  },
  botStyle: {
    alignSelf: 'flex-start',
  },
  userStyle: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  timeStamp: {
    marginVertical: 5,
  },
  timeStampText: {
    fontSize: 12,
    color: '#888',
  },
})
