import { Link } from 'one'
import { memo } from 'react'
import { Linking } from 'react-native'
import { isWeb, ScrollView, SizableText, styled, View, XStack, YStack } from 'tamagui'

import { APP_NAME_LOWERCASE, DOMAIN } from '~/constants/app'
import { useSettingsData, type SettingItem } from '~/features/settings/useSettingsData'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'
import { PageLayout } from '~/interface/pages/PageLayout'
import { SepHeading } from '~/interface/text/Headings'

const SettingRow = memo(({ item }: { item: SettingItem }) => {
  const Icon = item.icon

  const content = (
    <SettingRowFrame {...(item.onPress && { onPress: item.onPress })}>
      <XStack gap="$3" items="center" flex={1}>
        {Icon && (
          <View width={24} items="center" justify="center">
            <Icon size={20} color="$color11" />
          </View>
        )}
        <SizableText size="$5">{item.title}</SizableText>
      </XStack>
      <CaretRightIcon size={16} color="$color8" />
    </SettingRowFrame>
  )

  if (item.onPress) return content

  if (!item.href) return null

  if (item.external && !isWeb) {
    return (
      <SettingRowFrame onPress={() => Linking.openURL(`https://${DOMAIN}${item.href}`)}>
        <XStack gap="$3" items="center" flex={1}>
          {Icon && (
            <View width={24} items="center" justify="center">
              <Icon size={20} color="$color11" />
            </View>
          )}
          <SizableText size="$5">{item.title}</SizableText>
        </XStack>
        <CaretRightIcon size={16} color="$color8" />
      </SettingRowFrame>
    )
  }

  return (
    <Link href={item.href} target={item.external ? '_blank' : undefined} asChild>
      {content}
    </Link>
  )
})

export const ProfileSettingsPage = () => {
  const { sections } = useSettingsData()

  return (
    <PageLayout useImage>
      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <YStack flex={1} flexBasis="auto" pb="$10">
          {sections.map((section) => (
            <YStack key={section.title} mb="$6" ml="$4">
              <SepHeading>{section.title}</SepHeading>
              <YStack>
                {section.items.map((item) => (
                  <SettingRow key={item.id} item={item} />
                ))}
              </YStack>
            </YStack>
          ))}

          <LogoAndVersion />
        </YStack>
      </ScrollView>
    </PageLayout>
  )
}

const LogoAndVersion = memo(() => (
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

const SettingRowFrame = styled(XStack, {
  cursor: 'pointer',
  height: 56,
  px: '$4',
  items: 'center',
  justify: 'space-between',
  hoverStyle: { bg: '$color2' },
  pressStyle: { bg: '$color3' },
})
