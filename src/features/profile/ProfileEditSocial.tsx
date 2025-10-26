import { useState } from 'react'
import { Input, ScrollView, XStack, YStack } from 'tamagui'
import { Pressable } from '~/interface/buttons/Pressable'
import { BasicHeader } from '~/interface/headers/BasicHeader'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { DotsThreeIcon } from '~/interface/icons/phosphor/DotsThreeIcon'
import { XIcon } from '~/interface/icons/phosphor/XIcon'
import { ListItem } from '~/interface/lists/ListItem'
import { SOCIAL_PLATFORMS } from '~/interface/social-media/platforms'
import { MediumText } from '~/interface/text/Body'
import { showToast } from '~/interface/toast/helpers'
import { useUser } from '../user/useUser'

export const ProfileEditSocial = () => {
  const { user, update } = useUser()
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Get connected social links from user data
  const socialLinks = user?.socialLinks || {}
  const connectedPlatforms = Object.entries(socialLinks).filter(([_, url]) => url)

  // Get available platforms that aren't connected yet
  const availablePlatforms = Object.keys(SOCIAL_PLATFORMS).filter(
    (platform) => !socialLinks[platform]
  )

  const extractUsername = (url: string) => {
    if (!url) return ''
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      // Remove leading slash and @ symbol if present
      return pathname.replace(/^\//, '').replace(/^@/, '')
    } catch {
      // If it's not a valid URL, assume it's just a username
      return url.replace(/^@/, '')
    }
  }

  const buildSocialUrl = (platform: string, username: string) => {
    const platformData = SOCIAL_PLATFORMS[platform]
    if (!platformData) return ''

    // Clean username (remove @ if present)
    const cleanUsername = username.trim().replace(/^@/, '')

    // Build full URL
    return `${platformData.baseUrl}/${cleanUsername}`
  }

  const handleEditSocial = (platform: string) => {
    const currentUrl = socialLinks[platform] || ''
    const username = extractUsername(currentUrl)
    setEditValue(username)
    setEditingPlatform(platform)
  }

  const handleAddSocial = (platform: string) => {
    setEditValue('')
    setEditingPlatform(platform)
  }

  const handleSaveEdit = async () => {
    if (!editingPlatform) return

    const newUrl = editValue ? buildSocialUrl(editingPlatform, editValue) : ''

    try {
      await update({
        socialLinks: {
          ...socialLinks,
          [editingPlatform]: newUrl,
        },
      }).client

      showToast(newUrl ? 'Social link updated' : 'Social link removed')

      setEditingPlatform(null)
      setEditValue('')
    } catch (error) {
      showToast('Failed to update social link')
    }
  }

  const handleCancelEdit = () => {
    setEditingPlatform(null)
    setEditValue('')
  }

  return (
    <YStack flex={1} bg="$background">
      <BasicHeader title="Social Links" BackIcon={CaretLeftIcon} />

      <ScrollView flex={1}>
        <YStack px="$4" py="$3" gap="$3">
          {/* Connected Accounts */}
          {connectedPlatforms.length > 0 && (
            <YStack gap="$2">
              <YStack gap="$3">
                {connectedPlatforms.map(([platformKey, url]) => {
                  const platform = SOCIAL_PLATFORMS[platformKey]
                  const icon = platform?.icon

                  if (editingPlatform === platformKey) {
                    return (
                      <ListItem key={platformKey} bg="$color2" rounded="$4" height={60}>
                        <XStack flex={1} items="center" gap="$3">
                          {icon && <MediumText fontSize={24}>{icon}</MediumText>}

                          <XStack flex={1} items="center" gap="$2">
                            <MediumText color="$color12">{platform?.name}:</MediumText>
                            <Input
                              flex={1}
                              value={editValue ? `@${editValue}` : ''}
                              onChangeText={(text) =>
                                setEditValue(text.replace(/^@/, ''))
                              }
                              placeholder="@username"
                              bg="transparent"
                              borderWidth={0}
                              fontSize="$4"
                              autoFocus
                            />
                          </XStack>

                          <XStack gap="$2">
                            <Pressable onPress={handleSaveEdit}>
                              <CheckIcon size={20} color="$green10" />
                            </Pressable>
                            <Pressable onPress={handleCancelEdit}>
                              <XIcon size={20} color="$red10" />
                            </Pressable>
                          </XStack>
                        </XStack>
                      </ListItem>
                    )
                  }

                  return (
                    <Pressable
                      key={platformKey}
                      onPress={() => handleEditSocial(platformKey)}
                    >
                      <ListItem
                        bg="$color2"
                        hoverStyle={{ bg: '$color3' }}
                        pressStyle={{ bg: '$color3' }}
                        rounded="$4"
                        height={50}
                      >
                        <XStack flex={1} items="center" gap="$3">
                          {icon && <MediumText fontSize={24}>{icon}</MediumText>}

                          <YStack flex={1} gap="$0.5">
                            <MediumText color="$color12">
                              @{extractUsername(url)}
                            </MediumText>
                          </YStack>

                          <DotsThreeIcon size={20} color="$color8" />
                        </XStack>
                      </ListItem>
                    </Pressable>
                  )
                })}
              </YStack>
            </YStack>
          )}

          {/* Add More Accounts */}
          {availablePlatforms.length > 0 && (
            <YStack gap="$2">
              <YStack gap="$3">
                {availablePlatforms.map((platformKey) => {
                  const platform = SOCIAL_PLATFORMS[platformKey]
                  const icon = platform?.icon

                  if (editingPlatform === platformKey) {
                    return (
                      <ListItem
                        key={platformKey}
                        borderWidth={1}
                        borderColor="$borderColor"
                        rounded="$4"
                        height={60}
                      >
                        <XStack flex={1} items="center" gap="$3">
                          {icon && <MediumText fontSize={24}>{icon}</MediumText>}

                          <XStack flex={1} items="center" gap="$2">
                            <MediumText color="$color12">{platform?.name}:</MediumText>
                            <Input
                              flex={1}
                              value={editValue ? `@${editValue}` : ''}
                              onChangeText={(text) =>
                                setEditValue(text.replace(/^@/, ''))
                              }
                              placeholder="@username"
                              bg="transparent"
                              borderWidth={0}
                              fontSize="$4"
                              autoFocus
                            />
                          </XStack>

                          <XStack gap="$2">
                            <Pressable onPress={handleSaveEdit}>
                              <CheckIcon size={20} color="$green10" />
                            </Pressable>
                            <Pressable onPress={handleCancelEdit}>
                              <XIcon size={20} color="$red10" />
                            </Pressable>
                          </XStack>
                        </XStack>
                      </ListItem>
                    )
                  }

                  return (
                    <Pressable
                      key={platformKey}
                      onPress={() => handleAddSocial(platformKey)}
                    >
                      <ListItem
                        borderWidth={1}
                        borderColor="$borderColor"
                        hoverStyle={{ bg: '$color3' }}
                        pressStyle={{ bg: '$color3' }}
                        rounded="$4"
                        height={50}
                        pointerEvents="none"
                      >
                        <XStack flex={1} items="center" gap="$3">
                          {icon && <MediumText fontSize={24}>{icon}</MediumText>}

                          <YStack flex={1} gap="$0.5">
                            <MediumText color="$color12">{platform?.name}</MediumText>
                          </YStack>

                          <MediumText color="$color9">Connect</MediumText>
                        </XStack>
                      </ListItem>
                    </Pressable>
                  )
                })}
              </YStack>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}
