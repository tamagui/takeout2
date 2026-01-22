import { memo, useState } from 'react'
import { Separator, Sheet, Spacer, XStack, YStack } from 'tamagui'

import { LoginButton } from '~/features/auth/ui/LoginButton'
import { LoginListItem } from '~/features/auth/ui/LoginListItem'
import { ProFreeButtons } from '~/features/docs/ProFreeButtons'
import { SocialLinksRow } from '~/features/site/ui/SocialLinksRow'
import { Link } from '~/interface/app/Link'
import { Logo } from '~/interface/app/Logo'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { ScrollHeader } from '~/interface/headers/ScrollHeader'
import { FileIcon } from '~/interface/icons/phosphor/FileIcon'
import { ListIcon } from '~/interface/icons/phosphor/ListIcon'
import { PageContainer } from '~/interface/layout/PageContainer'
import { ListItem } from '~/interface/lists/ListItem'
import { ThemeSwitch } from '~/interface/theme/ThemeSwitch'

export const SiteHeader = memo(() => {
  return (
    <ScrollHeader>
      <PageContainer>
        <YStack width="100%" py="$2">
          <XStack position="relative" width="100%" items="center" $md={{ px: '$4' }}>
            <SocialLinksRow />

            <ProFreeButtons />

            <Spacer flex={1} />

            <XStack
              position="absolute"
              inset={0}
              pointerEvents="none"
              items="center"
              justify="center"
            >
              <Link pointerEvents="auto" href="/" aria-label="Home">
                <Logo height={20} />
              </Link>
            </XStack>

            <XStack gap="$2" items="center" display="none" $md={{ display: 'flex' }}>
              <LoginButton />

              <Link href="/docs/introduction">
                <ButtonSimple>Docs</ButtonSimple>
              </Link>

              <ThemeSwitch />
            </XStack>

            <SiteHeaderMenu />
          </XStack>
        </YStack>
      </PageContainer>
    </ScrollHeader>
  )
})

const SiteHeaderMenu = memo(() => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ButtonSimple
        size="large"
        variant="transparent"
        circular
        icon={<ListIcon size="$1" />}
        aria-label="Menu"
        onPress={() => setOpen(true)}
        $md={{ display: 'none' }}
      />

      <Sheet
        open={open}
        onOpenChange={setOpen}
        transition="medium"
        modal
        dismissOnSnapToBottom
        snapPoints={[50]}
      >
        <Sheet.Overlay
          bg="$background"
          opacity={0.5}
          transition="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />

        <Sheet.Frame bg="$color2" boxShadow="0 0 10px $shadow4">
          <YStack flex={1} gap="$2">
            <XStack p="$4" pb="$3" justify="space-between">
              <Logo height={32} />
              <ThemeSwitch />
            </XStack>

            <Separator />

            <YStack flex={1} p="$3" gap="$2">
              <LoginListItem
                onPressOut={() => {
                  setTimeout(() => {
                    setOpen(false)
                  }, 250)
                }}
              />

              <Link href="/docs/introduction">
                <ListItem
                  onPressOut={() => {
                    setTimeout(() => {
                      setOpen(false)
                    }, 250)
                  }}
                >
                  <ListItem.Icon>
                    <FileIcon />
                  </ListItem.Icon>
                  <ListItem.Text>Docs</ListItem.Text>
                </ListItem>
              </Link>
            </YStack>

            <YStack p="$4" pt="$2">
              <Separator mb="$3" />
              <XStack width="100%" items="center" justify="center">
                <Spacer />
                <SocialLinksRow />
                <Spacer />
              </XStack>
            </YStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  )
})
