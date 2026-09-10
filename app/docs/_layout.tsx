import './syntax-highlight.css'

import { type Href, Link, Slot } from 'one'
import {
  EnsureFlexed,
  html,
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
import { SearchButton, SearchProvider } from '~/features/docs/search'
import { useDocsMenu } from '~/features/docs/useDocsMenu'
import { CaretLeftIcon } from '~/interface/icons/phosphor/CaretLeftIcon'
import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'

const GITHUB_URL = 'https://github.com'
const REPO_NAME = 'tamagui/takeout2'
const BRANCH = 'main'

export function DocsLayout() {
  const { currentPath, next, previous } = useDocsMenu()
  const editUrl = `${GITHUB_URL}/${REPO_NAME}/edit/${BRANCH}/src/features/site/docs${currentPath}.mdx`

  return (
    <SearchProvider>
      <XStack
        flex={1}
        flexBasis="auto"
        mx="auto"
        w="100%"
        minH="calc(100vh - 50px)"
        flexDirection="md:row"
      >
        {/* Sidebar */}
        <html.aside
          w="100% md:225px"
          borderRightWidth={1}
          borderRightColor="border-color"
          position="md:sticky"
          t="md:50px"
          h="md:calc(100vh - 50px)"
          display="max-md:none"
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View pt="4" pb="10">
              <SearchButton />
              <DocsMenuContents />
              <YStack h={200} />
            </View>
          </ScrollView>
        </html.aside>

        {/* Main Content */}
        <YStack flex={1} flexBasis="auto" maxW={840} mx="auto" px="4 md:8" pt="4" pb="6">
          <EnsureFlexed />

          <Spacer display="md:none" />

          <Slot />

          {/* Pagination */}
          {(previous || next) && (
            <XStack mt="14" mb="10" justify="space-between" gap="4" flexWrap="wrap">
              {previous && (
                <Link href={previous.route as Href} asChild>
                  <PaginationLinkFrame group="card">
                    <PaginationIcon side="previous">
                      <CaretLeftIcon size={20} color="color11" />
                    </PaginationIcon>
                    <PaginationTitle side="previous">
                      <SizableText select="none" size="5">
                        Previous
                      </SizableText>
                      <SizableText select="none" color="color10" size="3">
                        {previous.title}
                      </SizableText>
                    </PaginationTitle>
                  </PaginationLinkFrame>
                </Link>
              )}

              {next && (
                <Link href={next.route as Href} asChild>
                  <PaginationLinkFrame justify="flex-end" group="card">
                    <PaginationTitle side="next">
                      <SizableText select="none" size="5">
                        Next
                      </SizableText>
                      <SizableText select="none" color="color10" size="3">
                        {next.title}
                      </SizableText>
                    </PaginationTitle>
                    <PaginationIcon side="next">
                      <CaretRightIcon size={20} color="color11" />
                    </PaginationIcon>
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
            <Paragraph px="4" opacity="0.5 hover:1">
              Edit this page on GitHub.
            </Paragraph>
          </Link>
        </YStack>
      </XStack>
    </SearchProvider>
  )
}

const PaginationLinkFrame = styled(XStack, {
  render: 'a',
  flex: 1,
  minW: 200,
  p: '5',
  rounded: '4',
  borderWidth: 1.5,
  borderColor: 'color2 hover:color2',
  items: 'center',
  gap: '4',
  cursor: 'pointer',
  bg: 'press:background-press',
})

const PaginationTitle = styled(YStack, {
  transition: 'bouncy',
  variants: {
    side: {
      previous: {
        x: 'group-hover/card:4',
      },
      next: {
        x: 'group-hover/card:-4',
      },
    },
  },
} as const)

const PaginationIcon = styled(View, {
  opacity: 0,
  transition: 'quick',
  variants: {
    side: {
      previous: {
        opacity: 'group-hover/card:1',
        x: 'group-hover/card:2',
      },
      next: {
        opacity: 'group-hover/card:1',
        x: 'group-hover/card:-2',
      },
    },
  },
} as const)
