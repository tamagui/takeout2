import './syntax-highlight.css'

import { type Href, Link, Slot } from 'one'
import {
  EnsureFlexed,
  Paragraph,
  ScrollView,
  SizableText,
  Spacer,
  styled,
  View,
  XStack,
  YStack,
} from 'tamagui'

import { DocsMenuContents } from '~/features/docs/DocsMenuContents'
import { useDocsMenu } from '~/features/docs/useDocsMenu'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'

const GITHUB_URL = 'https://github.com'
const REPO_NAME = 'usetakeout/takeout3'
const BRANCH = 'main'

export function DocsLayout() {
  const { currentPath, next, previous } = useDocsMenu()
  const editUrl = `${GITHUB_URL}/${REPO_NAME}/edit/${BRANCH}/src/features/site/docs${currentPath}.mdx`

  return (
    <>
      <XStack
        flex={1}
        mx="auto"
        width="100%"
        $md={{
          flexDirection: 'row',
        }}
      >
        {/* Sidebar */}
        <View
          width="100%"
          bg="$background"
          borderRightWidth={1}
          borderRightColor="$color1pt5"
          $md={{
            position: 'sticky' as any,
            t: 0,
            height: '100vh',
            width: 220,
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
        <YStack flex={1} maxW={800} mx="auto" px="$4" py="$6" $md={{ px: '$8' }}>
          <EnsureFlexed />

          <Spacer $md={{ display: 'none' }} />

          <Slot />

          {/* Pagination */}
          {(previous || next) && (
            <XStack mt="$14" mb="$10" justify="space-between" gap="$4" flexWrap="wrap">
              {previous && (
                <Link href={previous.route as Href} asChild>
                  <PaginationLinkFrame>
                    <CaretLeftIcon size={20} color="$color11" />
                    <View>
                      <SizableText select="none" size="$5">
                        Previous
                      </SizableText>
                      <SizableText select="none" size="$3" color="$color10">
                        {previous.title}
                      </SizableText>
                    </View>
                  </PaginationLinkFrame>
                </Link>
              )}

              {next && (
                <Link href={next.route as Href} asChild>
                  <PaginationLinkFrame justify="flex-end">
                    <View>
                      <SizableText select="none" size="$5">
                        Next
                      </SizableText>
                      <SizableText select="none" size="$3" color="$color10">
                        {next.title}
                      </SizableText>
                    </View>
                    <CaretRightIcon size={20} color="$color11" />
                  </PaginationLinkFrame>
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
    </>
  )
}

const PaginationLinkFrame = styled(XStack, {
  tag: 'a',
  flex: 1,
  minW: 200,
  p: '$5',
  rounded: '$4',
  borderWidth: 1.5,
  borderColor: '$color1pt5',
  items: 'center',
  gap: '$4',
  cursor: 'pointer',

  hoverStyle: {
    borderColor: '$color2',
  },

  pressStyle: {
    bg: '$backgroundPress',
  },
})
