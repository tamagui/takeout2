import { usePathname } from 'one'
import { memo, useState } from 'react'
import { ScrollView, Separator, Sheet, Spacer, XStack, YStack } from 'tamagui'

import { LoginButton } from '~/features/auth/ui/LoginButton'
import { LoginListItem } from '~/features/auth/ui/LoginListItem'
import { DocsMenuContents } from '~/features/docs/DocsMenuContents'
import { SocialLinksRow } from '~/features/site/ui/SocialLinksRow'
import { Link } from '~/interface/app/Link'
import { Logo } from '~/interface/app/Logo'
import { Button } from '~/interface/buttons/Button'
import { ScrollHeader } from '~/interface/headers/ScrollHeader'
import { FileIcon } from '~/interface/icons/phosphor/FileIcon'
import { ListIcon } from '~/interface/icons/phosphor/ListIcon'
import { PromoLinksRow } from '~/interface/landing/PromoLinksRow'
import { PageContainer } from '~/interface/layout/PageContainer'
import { ListItem } from '~/interface/lists/ListItem'
import { SepHeading } from '~/interface/text/Headings'
import { ThemeSwitch } from '~/interface/theme/ThemeSwitch'

export const SiteHeader = memo(() => {
  return (
    <ScrollHeader>
      <PageContainer>
        <YStack width="100%" py="$2">
          <XStack position="relative" width="100%" items="center" $md={{ px: '$4' }}>
            <XStack display="none" $lg={{ display: 'flex' }} gap="$2" items="center">
              <SocialLinksRow />
              <PromoLinksRow />
            </XStack>

            <Spacer flex={1} />

            <XStack
              position="absolute"
              l="$4"
              $lg={{
                l: '50%',
                t: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Link href="/" aria-label="Home">
                <Logo />
              </Link>
            </XStack>

            <XStack gap="$2" items="center" display="none" $md={{ display: 'flex' }}>
              <LoginButton />

              <Link href="/docs/introduction">
                <Button>Docs</Button>
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
  const pathname = usePathname()
  const isDocsPage = pathname.startsWith('/docs')

  return (
    <>
      <Button
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
        transition="quickLessBouncy"
        modal
        dismissOnSnapToBottom
        snapPoints={[isDocsPage ? 85 : 50]}
      >
        <Sheet.Overlay
          bg="$background"
          opacity={0.5}
          transition="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />

        <Sheet.Frame bg="$color2" boxShadow="0 0 10px $shadow3">
          <YStack flex={1} flexBasis="auto" gap="$2">
            <XStack p="$4" pb="$3" justify="space-between" items="center">
              <Logo />
              <XStack gap="$2" items="center">
                <PromoLinksRow />
                <ThemeSwitch />
              </XStack>
            </XStack>

            <Separator />

            <ScrollView group="frame" flex={1} px="$4" pt="$4" gap="$2">
              <LoginListItem
                onPressOut={() => {
                  setTimeout(() => {
                    setOpen(false)
                  }, 250)
                }}
              />
              {/* <Link href="/docs/introduction"> */}
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
              {/* </Link> */}

              {isDocsPage && (
                <>
                  <SepHeading size="$5">Menu</SepHeading>
                  <YStack onPress={() => setOpen(false)}>
                    <DocsMenuContents />
                  </YStack>
                </>
              )}
            </ScrollView>

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
