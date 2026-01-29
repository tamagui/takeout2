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
        width="100%"
        minH="calc(100vh - 50px)"
        $md={{
          flexDirection: 'row',
        }}
      >
        {/* Sidebar */}
        <View
          width="100%"
          borderRightWidth={1}
          borderRightColor="$borderColor"
          $md={{
            position: 'sticky',
            t: 50,
            height: 'calc(100vh - 50px)',
            width: 225,
          }}
          $max-md={{
            display: 'none',
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View pt="$4" pb="$10">
              <SearchButton />
              <DocsMenuContents />
              <YStack height={200} />
            </View>
          </ScrollView>
        </View>

        {/* Main Content */}
        <YStack
          flex={1}
          flexBasis="auto"
          maxW={840}
          mx="auto"
          px="$4"
          pt="$4"
          pb="$6"
          $md={{ px: '$8' }}
        >
          <EnsureFlexed />

          <Spacer $md={{ display: 'none' }} />

          <Slot />

          {/* Pagination */}
          {(previous || next) && (
            <XStack mt="$14" mb="$10" justify="space-between" gap="$4" flexWrap="wrap">
              {previous && (
                <Link href={previous.route as Href} asChild>
                  <PaginationLinkFrame group="card">
                    <PaginationIcon side="previous">
                      <CaretLeftIcon size={20} color="$color11" />
                    </PaginationIcon>
                    <PaginationTitle side="previous">
                      <SizableText select="none" size="$5">
                        Previous
                      </SizableText>
                      <SizableText select="none" size="$3" color="$color10">
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
                      <SizableText select="none" size="$5">
                        Next
                      </SizableText>
                      <SizableText select="none" size="$3" color="$color10">
                        {next.title}
                      </SizableText>
                    </PaginationTitle>
                    <PaginationIcon side="next">
                      <CaretRightIcon size={20} color="$color11" />
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

        {/* Quick Nav (Table of Contents) rendered per-page with frontmatter.headings */}
      </XStack>
    </SearchProvider>
  )
}

const PaginationLinkFrame = styled(XStack, {
  render: 'a',
  flex: 1,
  minW: 200,
  p: '$5',
  rounded: '$4',
  borderWidth: 1.5,
  borderColor: '$color2',
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

const PaginationTitle = styled(YStack, {
  transition: 'bouncy',
  variants: {
    side: {
      previous: {
        '$group-card-hover': { x: '$4' },
      },
      next: {
        '$group-card-hover': { x: '$-4' },
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
        '$group-card-hover': { opacity: 1, x: '$2' },
      },
      next: {
        '$group-card-hover': { opacity: 1, x: '$-2' },
      },
    },
  },
} as const)
