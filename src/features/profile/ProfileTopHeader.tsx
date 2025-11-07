import { Link, router } from 'one'
import { memo, useId, useState } from 'react'
import { Alert } from 'react-native'
import { View, XStack } from 'tamagui'
import * as DropdownMenu from 'zeego/dropdown-menu'
import { SERVER_URL } from '~/constants/urls'
import type { User } from '~/data/types'
import { useShareProfile } from '~/helpers/share/useShareProfile'
import { Pressable } from '~/interface/buttons/Pressable'
import { DotsThreeIcon } from '~/interface/icons/phosphor/DotsThreeIcon'
import { GearIcon } from '~/interface/icons/phosphor/GearIcon'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'
import { ShareFatIcon } from '~/interface/icons/phosphor/ShareFatIcon'
import { ShieldCheckIcon } from '~/interface/icons/phosphor/ShieldCheckIcon'
import { WarningCircleIcon } from '~/interface/icons/phosphor/WarningCircleIcon'
import { usePageHeader } from '~/interface/pages/PageHeader'
import { showReportForUser } from '~/interface/sheet/reportSheetHelper'
import { H4 } from '~/interface/text/Headings'
import { showToast } from '~/interface/toast/helpers'
import { showError } from '~/interface/dialogs/actions'
import { zero } from '~/zero/client'
import { CreateTabIcon } from '../main-tabs/CreateTabIcon'

interface ProfileTopHeaderProps {
  userInfo: User
  isOwnProfile: boolean
}

export const ProfileTopHeader = memo<ProfileTopHeaderProps>(
  ({ userInfo, isOwnProfile }) => {
    const [isGlassExpanded, setIsGlassExpanded] = useState<boolean>(false)
    const namespaceId = useId()
    const { top, headerHeight } = usePageHeader()
    const { shareProfile } = useShareProfile()

    const handleReport = () => {
      if (!userInfo) return
      showReportForUser(userInfo.id, userInfo.username || undefined)
    }

    const handleShare = async () => {
      if (!userInfo) return

      const publicProfileUrl = `${SERVER_URL}/u/${userInfo.username}`
      await shareProfile(userInfo, publicProfileUrl)
    }

    const handleBlock = () => {
      if (!userInfo) return

      Alert.alert(
        'Block User',
        `Are you sure you want to block @${userInfo.username}? You won't see their content anymore.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Block',
            style: 'destructive',
            onPress: async () => {
              try {
                zero.mutate.block.insert({ blockedId: userInfo.id })
                showToast(`Blocked @${userInfo.username}`, { type: 'success' })
                router.back()
              } catch (error) {
                showError(error, 'Block User')
              }
            },
          },
        ],
        { cancelable: true }
      )
    }

    const renderRightIcons = () => {
      const icons = []

      // Add icon for own profile
      if (isOwnProfile) {
        icons.push(
          <CreateTabIcon
            key="create"
            customIcon={<PlusIcon size={24} color="$color12" />}
            style={{ flex: 0, marginTop: 0 }}
          />
        )
      }

      // Share icon (always visible)
      icons.push(
        <Pressable key="share" onPress={handleShare}>
          <ShareFatIcon size={24} color="$color12" />
        </Pressable>
      )

      // Settings/More icon
      if (isOwnProfile) {
        icons.push(
          <Link key="settings" href="/setting">
            <GearIcon size={24} color="$color12" />
          </Link>
        )
      } else {
        // only show the dropdown menu if the feature flag is enabled
        icons.push(
          <DropdownMenu.Root key="more">
            <DropdownMenu.Trigger asChild>
              <Pressable>
                <DotsThreeIcon size={24} color="$color12" />
              </Pressable>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item key="report" onSelect={handleReport}>
                <DropdownMenu.ItemIcon
                  ios={{
                    name: 'exclamationmark.triangle',
                    pointSize: 18,
                  }}
                >
                  <WarningCircleIcon size={16} />
                </DropdownMenu.ItemIcon>
                <DropdownMenu.ItemTitle>Report User</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>

              <DropdownMenu.Separator />

              <DropdownMenu.Item key="block" onSelect={handleBlock}>
                <DropdownMenu.ItemIcon
                  ios={{
                    name: 'hand.raised',
                    pointSize: 18,
                  }}
                >
                  <ShieldCheckIcon size={16} />
                </DropdownMenu.ItemIcon>
                <DropdownMenu.ItemTitle>Block User</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        )
      }

      return <XStack gap="$4">{icons}</XStack>
    }

    return (
      <View
        pt={top + 8}
        px="$3"
        pb="$2"
        bg="$background"
        height={headerHeight}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1001,
        }}
      >
        <XStack justify="space-between">
          <Pressable onPress={() => setIsGlassExpanded(!isGlassExpanded)}>
            <H4>Profile</H4>
          </Pressable>

          {renderRightIcons()}
        </XStack>
      </View>
    )
  }
)
