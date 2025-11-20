'use client'

import { useState } from 'react'
import { Adapt, Button, H3, Separator, Sheet, Spacer, XStack, YStack } from 'tamagui'
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
        <YStack width="100%" py="$2.5">
          <XStack width="100%" items="center" $sm={{ px: '$6' }}>
            <Link href="/">
              <Logo />
            </Link>

            <Spacer flex />

            <XStack gap="$4" items="center" display="none" $sm={{ display: 'flex' }}>
              <XStack containerType="normal" items="center">
                <SocialLinksRow />
              </XStack>

              <LoginButton />

              <Link href="/docs">
                <ButtonSimple>Docs</ButtonSimple>
              </Link>

              <ThemeSwitch />
            </XStack>

            <Button
              size="$3"
              chromeless
              circular
              icon={ListIcon}
              aria-label="Menu"
              onPress={() => setOpen(true)}
              $sm={{ display: 'none' }}
            />

            <Adapt when="maxSM" platform="touch">
              <Sheet
                open={open}
                onOpenChange={setOpen}
                animation="medium"
                modal
                dismissOnSnapToBottom
                snapPoints={[60]}
              >
                <Sheet.Frame bg="$color2">
                  <YStack flex={1} gap="$2">
                    <XStack p="$4" pb="$3" justify="space-between">
                      <XStack gap="$3" items="center">
                        <Logo size={32} />
                        <H3 size="$4" fontWeight="600" fontFamily="$mono">
                          takeout
                        </H3>
                      </XStack>
                      <ThemeSwitch />
                    </XStack>

                    <Separator />

                    <YStack flex={1}>
                      <LoginButton listItem />
                      <Link href="/docs" asChild>
                        <ListItem>
                          <ListItem.Icon>
                            <FileIcon />
                          </ListItem.Icon>
                          <ListItem.Text>Documentation</ListItem.Text>
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
                <Sheet.Overlay
                  animation="lazy"
                  opacity={0.8}
                  enterStyle={{ opacity: 0 }}
                  exitStyle={{ opacity: 0 }}
                />
              </Sheet>
            </Adapt>
          </XStack>
        </YStack>
      </PageContainer>
    </ScrollHeader>
  )
}
