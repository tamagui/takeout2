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
        <YStack w="100%" py="2">
          <XStack position="relative" w="100%" items="center" px="md:4">
            <XStack display="none lg:flex" gap="2" items="center">
              <SocialLinksRow />
              <PromoLinksRow />
            </XStack>

            <Spacer flex={1} />

            <XStack
              position="absolute"
              l="4 lg:0px"
              r="lg:0px"
              t="0px"
              b="0px"
              items="center"
              justify="lg:center"
              pointerEvents="none"
            >
              <Link href="/" aria-label="Home" pointerEvents="auto">
                <Logo />
              </Link>
            </XStack>

            <XStack gap="2" items="center" display="none md:flex">
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
        display="md:none"
      />

      <Sheet
        open={open}
        onOpenChange={setOpen}
        transition="quickLessBouncy"
        modal
        dismissOnSnapToBottom
        snapPoints={[isDocsPage ? 85 : 50]}
      >
        <Sheet.Overlay bg="background" opacity="0.5 enter:0 exit:0" transition="quick" />

        <Sheet.Container bg="color2" boxShadow="0 0 10px shadow-color">
          <YStack flex={1} flexBasis="auto" gap="2">
            <XStack pt="4" px="4" pb="3" justify="space-between" items="center">
              <Logo />
              <XStack gap="2" items="center">
                <PromoLinksRow />
                <ThemeSwitch />
              </XStack>
            </XStack>

            <Separator />

            <ScrollView group="frame" flex={1} px="4" pt="4" gap="2">
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
                  <SepHeading size="5">Menu</SepHeading>
                  <YStack onPress={() => setOpen(false)}>
                    <DocsMenuContents />
                  </YStack>
                </>
              )}
            </ScrollView>

            <YStack px="4" pb="4" pt="2">
              <Separator mb="3" />
              <XStack w="100%" items="center" justify="center">
                <Spacer />
                <SocialLinksRow />
                <Spacer />
              </XStack>
            </YStack>
          </YStack>
        </Sheet.Container>
      </Sheet>
    </>
  )
})
