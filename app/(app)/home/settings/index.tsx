import { Link, Redirect, usePathname } from 'one'
import { Linking } from 'react-native'
import { ScrollView, SizableText, styled, View, XStack, YStack } from 'tamagui'

import { APP_NAME_LOWERCASE, DOMAIN } from '~/constants/app'
import { useSettingsData, type SettingItem } from '~/features/settings/useSettingsData'

function SettingRow({ item, isActive }: { item: SettingItem; isActive: boolean }) {
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

function LogoAndVersion() {
  return (
    <YStack items="center" pt="$6" pb="$4">
      <SizableText size="$2" color="$color9">
        {APP_NAME_LOWERCASE} v1.0.0
      </SizableText>
    </YStack>
  )
}

export function SettingsSidebarContent() {
  const pathname = usePathname()
  const { sections } = useSettingsData()

  const isItemActive = (item: SettingItem) => {
    if (!item.href || item.external) return false
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack p="$4" gap="$4">
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

export function ProfileSettingsPage() {
  return <Redirect href="/home/settings/edit-profile" />
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
