import { LegendList } from '@legendapp/list/keyboard-controller'
import { BookOpen, Grid3x3, PenLine, Search, User, X } from '@tamagui/lucide-icons'
import { memo, useRef, useState } from 'react'
import { Keyboard, TextInput, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Image, Text, useTheme, View, XStack, YStack } from 'tamagui'
import { kWidth } from '~/constants/deviceSizes'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { GlassView } from '../view/GlassView.native'

interface AIChatDrawerProps {
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onClose: () => void
}

interface ChatHistory {
  id: string
  title: string
  timestamp: string
  preview?: string
}

interface GPTModel {
  id: string
  name: string
  icon?: any
  url?: string
}

const mockChatHistory: ChatHistory[] = [
  { id: '1', title: 'Enterprise app distribution limits', timestamp: 'Today' },
  { id: '2', title: 'AI text streaming SwiftUI', timestamp: 'Today' },
  { id: '3', title: 'Best React Native library', timestamp: 'Yesterday' },
  { id: '4', title: 'iOS emoji reaction libraries', timestamp: 'Yesterday' },
  { id: '5', title: 'Email for student voucher', timestamp: '2 days ago' },
  { id: '6', title: 'WhatsApp on work laptop', timestamp: '3 days ago' },
  { id: '7', title: 'Reply template for issues', timestamp: 'Last week' },
  { id: '8', title: 'Weekend Code Coffee Fun', timestamp: 'Last week' },
]

const gptModels: GPTModel[] = [
  { id: 'hub', name: 'ChatHUB', url: require('../../../assets/hud.webp') },
  { id: 'library', name: 'Library', icon: BookOpen },
  { id: 'HUBs', name: 'HUBs', icon: Grid3x3 },
]

export const AIChatDrawer = memo(
  ({ onNewChat, onSelectChat, onClose }: AIChatDrawerProps) => {
    const { top, bottom } = useSafeAreaInsets()
    const { color } = useTheme()
    const [searchFocused, setSearchFocused] = useState(false)
    const [searchText, setSearchText] = useState('')
    const searchInputRef = useRef<TextInput>(null)

    const filteredHistory = mockChatHistory.filter((chat) =>
      chat.title.toLowerCase().includes(searchText.toLowerCase())
    )

    return (
      <YStack
        flex={1}
        overflow="hidden"
        animation="200ms"
        width={searchFocused ? kWidth : 280}
      >
        <View flex={1} bg="$surface" pt={top} pb={bottom}>
          {/* Search Bar and New Chat */}
          <XStack p="$3" gap="$2" items="center">
            <XStack
              flex={1}
              bg="$background02"
              rounded="$10"
              px="$3"
              items="center"
              boxShadow={`inset 1px 1px 0.5px 0 rgba(255, 255, 255, 0.25),
                  inset -1px -1px 0.5px 0.5px rgba(255, 255, 255, 0.25)`}
            >
              <Search size={16} color="$color10" />
              <TextInput
                ref={searchInputRef}
                style={{
                  flex: 1,
                  marginLeft: 8,
                  paddingVertical: 8,
                  color: color.val,
                }}
                placeholder="Search"
                value={searchText}
                onChangeText={setSearchText}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                returnKeyType="search"
              />
            </XStack>

            <TouchableOpacity
              onPress={() => {
                if (searchFocused) {
                  setSearchFocused(false)
                  Keyboard.dismiss()
                } else {
                  onNewChat()
                  onClose()
                }
              }}
            >
              <GlassView borderRadius={14} intensity={30}>
                <View
                  animation="200ms"
                  scale={!searchFocused ? 1 : 0}
                  opacity={!searchFocused ? 1 : 0}
                  enterStyle={{ scale: 1, opacity: 1 }}
                  exitStyle={{ scale: 0, opacity: 0 }}
                  items="center"
                  justify="center"
                  width={32}
                  height={32}
                >
                  <PenLine size={16} color="$color11" />
                </View>
                <View
                  scale={searchFocused ? 1 : 0}
                  opacity={searchFocused ? 1 : 0}
                  enterStyle={{ scale: 1, opacity: 1 }}
                  exitStyle={{ scale: 0, opacity: 0 }}
                  position="absolute"
                  items="center"
                  justify="center"
                  width={32}
                  height={32}
                >
                  <X size={16} color="$color11" />
                </View>
              </GlassView>
            </TouchableOpacity>
          </XStack>
          {/* GPT Models Section */}
          <YStack
            py="$2"
            animation="200ms"
            opacity={searchFocused ? 0 : 1}
            y={searchFocused ? -20 : 0}
            enterStyle={{ opacity: 1, y: 0 }}
            exitStyle={{ opacity: 0, y: -20 }}
          >
            {gptModels.map((model) => (
              <ButtonSimple
                variant="transparent"
                key={model.id}
                onPress={() => {
                  console.info(`Selected ${model.name}`)
                  onClose()
                }}
              >
                <XStack width="100%" items="center" gap="$3" px="$2" my="$2">
                  <GlassView borderRadius={16} intensity={30}>
                    <View items="center" justify="center" width={36} height={36}>
                      {model.icon && <model.icon size={18} color="white" />}
                      {model.url && (
                        <Image
                          source={{ uri: model.url }}
                          width={30}
                          height={30}
                          objectFit="contain"
                        />
                      )}
                    </View>
                  </GlassView>
                  <Text fontSize="$4" color="$color12">
                    {model.name}
                  </Text>
                </XStack>
              </ButtonSimple>
            ))}
          </YStack>

          {/* Chat History */}
          <YStack
            flex={1}
            animation="200ms"
            opacity={1}
            y={searchFocused ? -180 : 0}
            enterStyle={{ opacity: 1, y: 0 }}
          >
            <LegendList
              data={filteredHistory}
              style={{ flex: 1, marginTop: 16 }}
              contentContainerStyle={{ flex: 1, gap: 8, paddingLeft: 8 }}
              showsVerticalScrollIndicator={false}
              estimatedItemSize={50}
              recycleItems
              renderItem={({ item }) => (
                <ButtonSimple
                  variant="transparent"
                  onPress={() => {
                    onSelectChat(item.id)
                    onClose()
                  }}
                >
                  <XStack items="center" rounded="$2" py="$2">
                    <YStack flex={1}>
                      <Text fontSize="$3" color="$color12" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text fontSize="$2" color="$color10">
                        {item.timestamp}
                      </Text>
                    </YStack>
                  </XStack>
                </ButtonSimple>
              )}
            />
          </YStack>

          {/* User Profile Section */}
          {!searchFocused && (
            <XStack
              animation="quick"
              pt="$3"
              pb="$3"
              px="$3"
              items="center"
              gap="$3"
              borderTopWidth={1}
              borderTopColor="$borderColor"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            >
              <Avatar circular size="$3">
                <Avatar.Image
                  source={{
                    uri: 'https://avatars.githubusercontent.com/u/17813202?v=4',
                  }}
                />
                <Avatar.Fallback bg="$background02">
                  <User size={20} />
                </Avatar.Fallback>
              </Avatar>
              <Text fontSize="$3" color="$color12" flex={1} numberOfLines={1}>
                Anh Quân Nguyễn
              </Text>
            </XStack>
          )}
        </View>
      </YStack>
    )
  }
)
