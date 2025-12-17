import { useState } from 'react'
import { Separator, Sheet, Spacer, XStack, YStack } from 'tamagui'

import { LoginButton } from '~/features/auth/ui/LoginButton'
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

export const SiteHeader = () => {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <ScrollHeader>
      <PageContainer>
        <YStack width="100%" py="$2">
          <XStack width="100%" items="center" $md={{ px: '$4' }}>
            <SocialLinksRow />

            <Spacer flex />

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

            <XStack gap="$4" items="center" display="none" $md={{ display: 'flex' }}>
              <LoginButton />

              <Link href="/docs/introduction">
                <ButtonSimple>Docs</ButtonSimple>
              </Link>

              <ThemeSwitch />
            </XStack>

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
              animationConfig={{
                type: 'spring',
                damping: 25,
                mass: 1,
                stiffness: 200,
              }}
              modal
              dismissOnSnapToBottom
              snapPoints={[80]}
            >
              <Sheet.Overlay
                animation="lazy"
                opacity={0.8}
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
              />

              <Sheet.Frame bg="$color2">
                <YStack flex={1} gap="$2">
                  <XStack p="$4" pb="$3" justify="space-between">
                    <Logo height={32} />
                    <ThemeSwitch />
                  </XStack>

                  <Separator />

                  <YStack flex={1}>
                    <LoginButton listItem />
                    <Link href="/docs/introduction" asChild>
                      <ListItem>
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
          </XStack>
        </YStack>
      </PageContainer>
    </ScrollHeader>
  )
}
