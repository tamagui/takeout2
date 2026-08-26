import { H4, html, ScrollView, XStack, YStack } from 'tamagui'

type Heading = {
  id: string
  title: string
  priority: number
}

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 8 }}>
    <path
      d="M3 4h10M3 8h7M3 12h10"
      stroke="var(--color11)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export const DocsQuickNav = ({ headings = [] }: { headings?: Heading[] }) => {
  if (headings.length === 0) {
    return null
  }

  return (
    <html.aside
      display="none lg:flex"
      width="lg:220px"
      shrink="lg:0px"
      position="lg:sticky"
      t="lg:80px"
      height="lg:calc(100vh - 100px)"
    >
      <YStack gap="4">
        <html.nav aria-labelledby="site-quick-nav-heading" gap="2">
          <XStack items="center" mb="2" id="site-quick-nav-heading">
            <ListIcon />
            <H4 fontFamily="mono" color="color11" size="4">
              On this page
            </H4>
          </XStack>

          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack pl={16}>
              {headings.map(({ id, title, priority }, index) => {
                const isSubItem = priority > 2

                return (
                  <XStack key={`${id}-${index}`} py="1-5" ml={isSubItem ? '3' : 0}>
                    <html.a
                      href={`#${id}`}
                      onClick={(e: any) => {
                        e.preventDefault()
                        const element = document.getElementById(id)
                        if (element) {
                          element.scrollIntoView({ block: 'start' })
                          history.pushState(null, '', `#${id}`)
                        }
                      }}
                      py="1-5"
                      px={isSubItem ? '2' : 0}
                      rounded="2"
                      bg={`${isSubItem ? 'color3' : 'transparent'}`}
                      color={`${priority === 2 ? 'color11' : 'color10'} hover:color12`}
                      cursor="pointer"
                      fontSize={priority === 2 ? '3' : '2'}
                      textDecorationLine="none"
                    >
                      {title}
                    </html.a>
                  </XStack>
                )
              })}
            </YStack>
          </ScrollView>
        </html.nav>
      </YStack>
    </html.aside>
  )
}
