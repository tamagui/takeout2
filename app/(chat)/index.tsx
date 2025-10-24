import { YStack } from 'tamagui'
import { ServerIndexPage } from '~/features/server/ServerIndexPage'
import { TrendingServers } from '~/features/server/ui/TrendingServers'
import { RedirectToLastPage } from '~/features/user/RedirectUserToLastPage'
import { useServerIdFromCookie } from '~/hooks/useServerIdFromCookie'

export function HomePage() {
  const cookieServerId = useServerIdFromCookie()

  if (cookieServerId) {
    return <ServerIndexPage />
  }

  return (
    <YStack
      data-tauri-drag-region
      items="center"
      justify="center"
      flex={1}
      width="100%"
      height="100%"
      overflow="hidden"
    >
      <RedirectToLastPage />

      <YStack flex={1} />

      {/* <Welcome /> */}

      <YStack width="100%" p="$10" maxW={600}>
        <TrendingServers />
      </YStack>
    </YStack>
  )
}

// const Welcome = () => {
//   return (
//     <YStack
//       width="100%"
//       maxW="80%"
//       py="$6"
//       px="$6"
//       bg="$color2"
//       rounded="$12"
//       borderTopLeftRadius="$8"
//       borderBottomRightRadius="$8"
//       gap="$2"
//     >
//       <H2 fontFamily="$mono">Welcome</H2>

//       {/* <Paragraph mb="$2" size="$6" fontFamily="$mono" color="$color11">
//         Start is a new chat platform that's built from the ground up to integrate{' '}
//         <Inline>agents, apps, and data</Inline> into the most productive, expressive
//         workspace possible.
//       </Paragraph>

//       <Paragraph mb="$2" size="$5" fontFamily="$mono" color="$color10">
//         We're building <Inline color="$color11">fast</Inline>,{' '}
//         <Inline color="$color11">beautiful</Inline>, and{' '}
//         <Inline color="$color11">powerful</Inline> chat.
//       </Paragraph> */}

//       <Separator my="$4" />

//       <XStack justify="space-between">
//         <Paragraph size="$4" fontFamily="$mono" color="$color11">
//           Coming soon.
//         </Paragraph>

//         <Link fontFamily="$mono" fontWeight="600" href="/docs">
//           <ButtonSimple>Docs</ButtonSimple>
//         </Link>
//       </XStack>
//     </YStack>
//   )
// }
