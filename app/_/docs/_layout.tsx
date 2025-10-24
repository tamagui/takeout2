import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'
import { Paragraph, SizableText, View, XStack, YStack } from 'tamagui'
import { Link, Slot } from 'one'
import { DocsMenuContents } from '~/features/docs/DocsMenuContents'
import { useDocsMenu } from '~/features/docs/useDocsMenu'

export default function DocsLayout() {
  const { next, previous } = useDocsMenu()

  return (
    <YStack flex={1} maxW={1250} mx="auto">
      <XStack flex={1}>
        <View width={250} display="none" $md={{ display: 'flex' }}>
          <DocsMenuContents />
        </View>

        <View flex={1} px="$4">
          <Slot />

          {(previous || next) && (
            <XStack mt="$8" mb="$4" gap="$4">
              {previous && (
                <Link href={previous.route as any}>
                  <XStack
                    flex={1}
                    p="$4"
                    rounded="$4"
                    borderWidth={1}
                    borderColor="$borderColor"
                    items="center"
                    gap="$2"
                  >
                    <ChevronLeft size={16} />
                    <YStack>
                      <SizableText size="$2">Previous</SizableText>
                      <SizableText size="$3">{previous.title}</SizableText>
                    </YStack>
                  </XStack>
                </Link>
              )}

              {next && (
                <Link href={next.route as any}>
                  <XStack
                    flex={1}
                    p="$4"
                    rounded="$4"
                    borderWidth={1}
                    borderColor="$borderColor"
                    items="center"
                    justify="flex-end"
                    gap="$2"
                  >
                    <YStack items="flex-end">
                      <SizableText size="$2">Next</SizableText>
                      <SizableText size="$3">{next.title}</SizableText>
                    </YStack>
                    <ChevronRight size={16} />
                  </XStack>
                </Link>
              )}
            </XStack>
          )}
        </View>
      </XStack>
    </YStack>
  )
}
