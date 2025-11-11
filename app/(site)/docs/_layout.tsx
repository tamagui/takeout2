import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'
import { type Href, Link, Slot } from 'one'
import { Paragraph, ScrollView, SizableText, Spacer, View, XStack, YStack } from 'tamagui'
import { DocsMenuContents } from '~/features/docs/DocsMenuContents'
import { useDocsMenu } from '~/features/docs/useDocsMenu'

const GITHUB_URL = 'https://github.com'
const REPO_NAME = 'usetakeout/takeout3'
const BRANCH = 'main'

export function DocsLayout() {
  const { currentPath, next, previous } = useDocsMenu()
  const editUrl = `${GITHUB_URL}/${REPO_NAME}/edit/${BRANCH}/src/features/site/docs${currentPath}.mdx`

  return (
    <YStack flex={1} bg="$background">
      <XStack
        flex={1}
        mx="auto"
        width="100%"
        maxW={1250}
        $md={{
          flexDirection: 'row',
        }}
      >
        {/* Sidebar */}
        <View
          width="100%"
          bg="$background"
          borderRightWidth={1}
          borderRightColor="$borderColor"
          $md={{
            position: 'sticky' as any,
            t: 0,
            height: '100vh',
            width: 225,
          }}
          $maxMD={{
            display: 'none',
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View pt="$6" pb="$10">
              <DocsMenuContents />
              <YStack height={200} />
            </View>
          </ScrollView>
        </View>

        {/* Main Content */}
        <YStack flex={1} maxW={840} mx="auto" px="$4" py="$6">
          <Spacer $md={{ display: 'none' }} />
          <Slot />

          {/* Pagination */}
          {(previous || next) && (
            <XStack mt="$14" mb="$10" justify="space-between" gap="$4" flexWrap="wrap">
              {previous && (
                <Link href={previous.route as Href} asChild>
                  <XStack
                    tag="a"
                    hoverStyle={{
                      borderColor: '$color6',
                    }}
                    flex={1}
                    minW={200}
                    p="$5"
                    borderRadius="$4"
                    borderWidth={1}
                    borderColor="$borderColor"
                    pressStyle={{
                      bg: '$backgroundPress',
                    }}
                    alignItems="center"
                    gap="$4"
                    cursor="pointer"
                    {...({} as any)}
                  >
                    <ChevronLeft size={20} color="$color11" />
                    <View>
                      <SizableText select="none" size="$5">
                        Previous
                      </SizableText>
                      <SizableText select="none" size="$3" color="$color10">
                        {previous.title}
                      </SizableText>
                    </View>
                  </XStack>
                </Link>
              )}

              {next && (
                <Link href={next.route as Href} asChild>
                  <XStack
                    tag="a"
                    hoverStyle={{
                      borderColor: '$color6',
                    }}
                    flex={1}
                    minW={200}
                    p="$5"
                    rounded="$4"
                    borderWidth={1}
                    borderColor="$borderColor"
                    pressStyle={{
                      bg: '$backgroundPress',
                    }}
                    items="center"
                    justify="flex-end"
                    gap="$4"
                    cursor="pointer"
                  >
                    <View>
                      <Paragraph select="none" size="$5">
                        Next
                      </Paragraph>
                      <Paragraph select="none" size="$3" color="$color10">
                        {next.title}
                      </Paragraph>
                    </View>
                    <ChevronRight size={20} color="$color11" />
                  </XStack>
                </Link>
              )}
            </XStack>
          )}

          {/* Edit on GitHub Link */}
          <Link
            href={editUrl as Href}
            // @ts-expect-error
            title="Edit this page on GitHub."
            rel="noopener noreferrer"
            target="_blank"
          >
            <Paragraph
              px="$4"
              opacity={0.5}
              hoverStyle={{
                opacity: 1,
              }}
            >
              Edit this page on GitHub.
            </Paragraph>
          </Link>
        </YStack>
      </XStack>
    </YStack>
  )
}
