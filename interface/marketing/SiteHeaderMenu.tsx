import { Sheet } from 'contrast-ui/sheet/Sheet'
import { usePathname } from 'one'
import { memo, useState } from 'react'
import { Separator, SizableText, View, XStack, YStack } from 'tamagui'
import { useAuth } from '~/auth/client/authClient'
import { APP_HOME_HREF } from '~/features/app/routes'
import { Link } from '~/interface/app/Link'
import { Button } from '~/interface/buttons/Button'
import { Icons } from '~/interface/icons'
import { PromoLinksRow } from './PromoLinksRow'
import { SocialLinksRow } from './SocialLinksRow'
import { TakeoutLogoIcon } from './TakeoutIcons'

export const SiteHeaderMenu = memo(() => {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isDocsPage = pathname.startsWith('/docs')
  const auth = useAuth()
  const isAuthed = auth.isLoggedIn

  return (
    <>
      <View display="md:none">
        <Button
          size="sm"
          circular
          variant="quiet"
          aria-label="Menu"
          icon={Icons.Menu}
          onPress={() => setOpen(true)}
        />
      </View>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        sheetVariant={isDocsPage ? 'large' : 'compact'}
      >
        <Sheet.Overlay bg="background" opacity="0.5 enter:0 exit:0" transition="quick" />

        <Sheet.Container rounded="6">
          <Sheet.Background bg="color-2" boxShadow="0 0 30px shadow-4" />
          <YStack flex={1} gap={7} p={18}>
            <XStack justify="space-between" items="center" pb={12}>
              <XStack items="center" gap={8}>
                <TakeoutLogoIcon size={24} />
                <SizableText fontFamily="takeout-mono" fontWeight="700" size="5">
                  Takeout
                </SizableText>
              </XStack>
              <PromoLinksRow />
            </XStack>

            <Separator />

            <YStack py={14} gap={16}>
              <Link href="/docs/intro" onPress={() => setOpen(false)}>
                <SizableText size="5" fontWeight="600">
                  Docs
                </SizableText>
              </Link>
              <Link
                href={isAuthed ? APP_HOME_HREF : '/auth/login'}
                testID={open ? 'public-app-entry' : undefined}
                data-testid={open ? 'public-app-entry' : undefined}
                onPress={() => setOpen(false)}
              >
                <SizableText size="5" fontWeight="600">
                  {isAuthed ? 'Open app' : 'Login'}
                </SizableText>
              </Link>
            </YStack>

            <YStack mt="auto" pt={12}>
              <Separator mb={12} />
              <XStack width="100%" justify="center">
                <SocialLinksRow />
              </XStack>
            </YStack>
          </YStack>
        </Sheet.Container>
      </Sheet>
    </>
  )
})
