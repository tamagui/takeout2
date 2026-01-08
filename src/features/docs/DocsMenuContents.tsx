import { useEffect, useRef, useState } from 'react'
import { Accordion, Paragraph, Square, View, XStack, YStack } from 'tamagui'

import { CaretRightIcon } from '~/interface/icons/phosphor/CaretRightIcon'

import { DocsRouteNavItem } from './DocsRouteNavItem'
import { docsRoutes } from './docsRoutes'
import { useDocsMenu } from './useDocsMenu'

import type { DocsSection } from './docsRoutes'

const allItems = docsRoutes.flatMap((section, sectionIndex) =>
  section.pages?.map((page, index) => ({ page, section, sectionIndex, index }))
)

type Item = NonNullable<(typeof allItems)[0]>

const ActiveIndicator = ({
  items,
  activeIndex,
  visible,
}: {
  items: Array<{ top: number; height: number }>
  activeIndex: number
  visible: boolean
}) => {
  if (items.length === 0 || activeIndex < 0 || !visible) return null

  const activeItem = items[activeIndex]
  if (!activeItem) return null

  const indicatorHeight = 20
  const topPosition = activeItem.top + (activeItem.height - indicatorHeight) / 2

  return (
    <View
      position="absolute"
      l={0}
      t={topPosition}
      height={indicatorHeight}
      width={3}
      bg="$color12"
      rounded="$2"
      animation="quick"
      z={999}
    />
  )
}

export const DocsMenuContents = () => {
  const activeItems = allItems.filter(Boolean) as Item[]
  const { currentPath } = useDocsMenu()
  const [itemPositions, setItemPositions] = useState<
    Array<{ top: number; height: number }>
  >([])
  const containerRef = useRef<HTMLDivElement>(null)

  const itemsGrouped: Record<string, Item[]> = {}
  for (const item of activeItems) {
    const key = item.section.title || ''
    itemsGrouped[key] ||= []
    itemsGrouped[key].push(item)
  }

  const sectionHasActiveItem = (items: Item[]) => {
    return items.some((item) => currentPath === item.page.route)
  }

  const getDefaultOpenSections = () =>
    Object.entries(itemsGrouped)
      .filter(([_, items]) => sectionHasActiveItem(items))
      .map(([title]) => title || 'base')

  const [openSections, setOpenSections] = useState<string[]>(getDefaultOpenSections)

  // sync open sections when currentPath changes to ensure active section is open
  useEffect(() => {
    const activeSections = getDefaultOpenSections()
    setOpenSections((prev) => {
      const newSections = [...new Set([...prev, ...activeSections])]
      return newSections
    })
  }, [currentPath])

  // get only visible items (items in sections that are open or have no title)
  const visibleItems = activeItems.filter((item) => {
    const sectionTitle = item.section.title || ''
    return sectionTitle === '' || openSections.includes(sectionTitle)
  })

  // find active index among visible items only
  const activeIndex = visibleItems.findIndex((item) => item.page.route === currentPath)

  // indicator is visible if active item is in visible items
  const indicatorVisible = activeIndex >= 0

  useEffect(() => {
    if (!containerRef.current) return

    const measurePositions = () => {
      const container = containerRef.current
      if (!container) return

      const items = container.querySelectorAll('[data-nav-item]')
      const positions: Array<{ top: number; height: number }> = []

      items.forEach((item) => {
        const rect = item.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        positions.push({
          top: rect.top - containerRect.top,
          height: rect.height,
        })
      })

      setItemPositions(positions)
    }

    // measure immediately for quick feedback
    measurePositions()
    // measure again after accordion animation completes (~300ms)
    const timeout = setTimeout(measurePositions, 350)

    window.addEventListener('resize', measurePositions)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', measurePositions)
    }
  }, [currentPath, openSections])

  return (
    <YStack width="100%" ref={containerRef as any} position="relative">
      <ActiveIndicator
        items={itemPositions}
        activeIndex={activeIndex}
        visible={indicatorVisible}
      />
      <Accordion
        value={openSections.length > 0 ? openSections : ['base']}
        type="multiple"
        onValueChange={(value) => setOpenSections(value as string[])}
      >
        {Object.keys(itemsGrouped).map((sectionTitle) => {
          const items = itemsGrouped[sectionTitle]
          const section = items?.[0]?.section
          if (!section) return null
          return <SubSection key={sectionTitle} section={section} items={items || []} />
        })}
      </Accordion>
    </YStack>
  )
}

const SubSection = ({ section, items }: { section: DocsSection; items: Item[] }) => {
  const { currentPath } = useDocsMenu()

  const content = (
    <YStack px="$2">
      {items.map(({ page }, index) => {
        const isActive = currentPath === page.route
        return (
          <DocsRouteNavItem
            href={page.route}
            active={isActive}
            pending={page.pending}
            key={`${page.route}${index}`}
          >
            {page.title}
          </DocsRouteNavItem>
        )
      })}
    </YStack>
  )

  if (!section.title) {
    return <YStack mb="$2">{content}</YStack>
  }

  return (
    <Accordion.Item borderWidth={0} value={section.title || 'base'}>
      <Accordion.Trigger unstyled bg="transparent" borderWidth={0}>
        {({ open }: { open: boolean }) => {
          return (
            <XStack
              p="$2"
              rounded="$3"
              items="center"
              width="100%"
              hoverStyle={{
                bg: '$color3',
              }}
            >
              <Paragraph size="$5" fontWeight="600" color="$color12">
                {section.title}
              </Paragraph>

              <XStack flex={1} />

              <Square animation="quick" rotate={open ? '90deg' : '0deg'}>
                <CaretRightIcon color="$color9" size={14} />
              </Square>
            </XStack>
          )
        }}
      </Accordion.Trigger>

      <Accordion.HeightAnimator overflow="hidden" animation="medium">
        <Accordion.Content
          unstyled
          animation="medium"
          bg="transparent"
          exitStyle={{ opacity: 0 }}
        >
          {content}
        </Accordion.Content>
      </Accordion.HeightAnimator>
    </Accordion.Item>
  )
}
