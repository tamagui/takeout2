import { useParams } from 'one'
import { Paragraph, Theme, YStack } from 'tamagui'
import { useAuth } from '~/auth/client/authClient'
import { LoginSignupContents } from '~/auth/ui/LoginSignupContents'
import { ContainerLarge } from '~/features/website/Container'
import { Link } from '~/interface/app/Link'

export const LoginPage = () => {
  const { session } = useAuth()
  const params = useParams()
  const notAllowed = 'notAllowed' in params

  return (
    <>
      <ContainerLarge minH="100%" items="center">
        <YStack py="$6" flex={1} items="center" justify="center">
          {notAllowed && (
            <Theme name="red">
              <YStack mb="$4" p="$4" bg="$red4" rounded="$4" maxW={500}>
                <Paragraph size="$6" fontWeight="600" mb="$2">
                  Access Not Available
                </Paragraph>
                <Paragraph size="$5" color="$color11">
                  Your email address is not on our private beta list. Please{' '}
                  <Link href="/_/private-beta">request access</Link> to join the beta.
                </Paragraph>
              </YStack>
            </Theme>
          )}

          {session?.userId && (
            <Theme name="green">
              <YStack>
                <Paragraph>
                  You are logged in already: <Link href="/">Continue to app</Link>
                </Paragraph>
              </YStack>
            </Theme>
          )}

          <LoginSignupContents />

          {/* we may only want to auto-direct to home if we verify the just logged in */}
          {/* if i have an invalid session it redirects me to home but things break (old jkt) */}
          {/* {user && (
            <YStack>
              <SizableText>Welcome back, {user.username}</SizableText>
              <Link href="/">
                <ButtonSimple>Go to app</ButtonSimple>
              </Link>
            </YStack>
          )} */}
        </YStack>
      </ContainerLarge>
    </>
  )
}
