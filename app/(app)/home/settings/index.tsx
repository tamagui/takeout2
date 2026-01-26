import { Link, Redirect, usePathname } from 'one'
import { memo } from 'react'
import { Linking } from 'react-native'
import { ScrollView, SizableText, styled, useMedia, View, XStack, YStack } from 'tamagui'

import { APP_NAME_LOWERCASE, DOMAIN } from '~/constants/app'
import { useSettingsData, type SettingItem } from '~/features/settings/useSettingsData'
import { HeadInfo } from '~/interface/app/HeadInfo'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'
import { SepHeading } from '~/interface/text/Headings'

const SettingRow = memo(
  ({ item, isActive }: { item: SettingItem; isActive: boolean }) => {
    const Icon = item.icon

    const content = (
      <SettingRowFrame active={isActive} {...(item.onPress && { onPress: item.onPress })}>
        {Icon && (
          <View
            width={22}
            height={22}
            items="center"
            justify="center"
            opacity={isActive ? 1 : 0.7}
          >
            <Icon size="$6" color={isActive ? '$color12' : '$color11'} />
          </View>
        )}
        <SizableText
          size="$4"
          fontWeight={isActive ? '600' : '400'}
          color={isActive ? '$color12' : '$color11'}
        >
          {item.title}
        </SizableText>
      </SettingRowFrame>
    )

    if (item.onPress) {
      return content
    }

    if (item.href) {
      if (item.external) {
        return (
          <SettingRowFrame
            active={isActive}
            onPress={() => Linking.openURL(`https://${DOMAIN}${item.href}`)}
          >
            {Icon && (
              <View width={22} height={22} items="center" justify="center" opacity={0.7}>
                <Icon size="$6" color="$color11" />
              </View>
            )}
            <SizableText size="$4" color="$color11">
              {item.title}
            </SizableText>
          </SettingRowFrame>
        )
      }

      return (
        <Link href={item.href} asChild>
          {content}
        </Link>
      )
    }

    return null
  }
)

const LogoAndVersion = memo(() => {
  return (
    <YStack items="center" pt="$6" pb="$4">
      <SizableText size="$2" color="$color9">
        {APP_NAME_LOWERCASE} v1.0.0
      </SizableText>
    </YStack>
  )
})

export function SettingsSidebarContent() {
  const pathname = usePathname()
  const { sections } = useSettingsData()

  const isItemActive = (item: SettingItem) => {
    if (!item.href || item.external) return false
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <HeadInfo title="Settings" />
      <YStack p="$4" gap="$4" select="none">
        <SizableText size="$7" fontWeight="700" px="$3">
          Settings
        </SizableText>

        {sections.map((section) => (
          <YStack key={section.title} gap="$1">
            <SectionTitle>{section.title}</SectionTitle>
            {section.items.map((item) => (
              <SettingRow key={item.id} item={item} isActive={isItemActive(item)} />
            ))}
          </YStack>
        ))}

        <LogoAndVersion />
      </YStack>
    </ScrollView>
  )
}

const MobileSettingRow = memo(({ item }: { item: SettingItem }) => {
  const Icon = item.icon

  const content = (
    <MobileSettingRowFrame {...(item.onPress && { onPress: item.onPress })}>
      <XStack gap="$3" items="center" flex={1}>
        {Icon && (
          <View width={24} items="center" justify="center">
            <Icon size={20} color="$color11" />
          </View>
        )}
        <SizableText size="$5">{item.title}</SizableText>
      </XStack>
      <CaretRightIcon size={16} color="$color8" />
    </MobileSettingRowFrame>
  )

  if (item.onPress) return content

  if (!item.href) return null

  if (item.external) {
    return (
      <MobileSettingRowFrame
        onPress={() => Linking.openURL(`https://${DOMAIN}${item.href}`)}
      >
        <XStack gap="$3" items="center" flex={1}>
          {Icon && (
            <View width={24} items="center" justify="center">
              <Icon size={20} color="$color11" />
            </View>
          )}
          <SizableText size="$5">{item.title}</SizableText>
        </XStack>
        <CaretRightIcon size={16} color="$color8" />
      </MobileSettingRowFrame>
    )
  }

  return (
    <Link href={item.href} asChild>
      {content}
    </Link>
  )
})

function MobileSettingsContent() {
  const { sections } = useSettingsData()

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <HeadInfo title="Settings" />
      <YStack flex={1} flexBasis="auto" pb="$10" pt="$4">
        {sections.map((section) => (
          <YStack key={section.title} mb="$6">
            <YStack ml="$4">
              <SepHeading>{section.title}</SepHeading>
            </YStack>
            <YStack>
              {section.items.map((item) => (
                <MobileSettingRow key={item.id} item={item} />
              ))}
            </YStack>
          </YStack>
        ))}

        <MobileLogoAndVersion />
      </YStack>
    </ScrollView>
  )
}

const MobileLogoAndVersion = memo(() => (
  <YStack items="center" pb={100} pt="$4">
    <XStack items="center" gap="$2">
      <SizableText color="$color10" fontWeight="bold">
        {APP_NAME_LOWERCASE}
      </SizableText>
    </XStack>
    <SizableText size="$1" color="$color10" mt="$2">
      v1.0.0
    </SizableText>
  </YStack>
))

export function ProfileSettingsPage() {
  const media = useMedia()

  if (media.md) {
    return <Redirect href="/home/settings/edit-profile" />
  }

  return <MobileSettingsContent />
}

const SettingRowFrame = styled(XStack, {
  cursor: 'pointer',
  height: 44,
  px: '$3',
  rounded: '$3',
  items: 'center',
  gap: '$3',
  bg: 'transparent',
  transition: '200ms',

  hoverStyle: {
    bg: '$color3',
  },

  pressStyle: {
    bg: '$color4',
    scale: 0.98,
  },

  variants: {
    active: {
      true: {
        bg: '$color3',
      },
    },
  } as const,
})

const SectionTitle = styled(SizableText, {
  size: '$2',
  fontWeight: '600',
  color: '$color10',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  px: '$3',
  py: '$2',
})

const MobileSettingRowFrame = styled(XStack, {
  cursor: 'pointer',
  height: 56,
  px: '$4',
  items: 'center',
  justify: 'space-between',
  hoverStyle: { bg: '$color2' },
  pressStyle: { bg: '$color3' },
})
