import { usePathname } from 'one'
import { useEffect, useRef, useState } from 'react'
import { H4, Paragraph, ScrollView, YStack, XStack } from 'tamagui'

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

const ActiveIndicator = ({
  items,
  activeIndex,
}: {
  items: Array<{ top: number; height: number }>
  activeIndex: number
}) => {
  if (items.length === 0) return null

  const firstItem = items[0]!
  const lastItem = items[items.length - 1]!
  const firstCenter = firstItem.top + firstItem.height / 2
  const lastCenter = lastItem.top + lastItem.height / 2

  const segmentHalf = 8
  const linePadding = segmentHalf
  const x = 4

  const lineStart = firstCenter - linePadding
  const lineEnd = lastCenter + linePadding
  const pathLength = lineEnd - lineStart

  const itemDistances = items.map((item) => item.top + item.height / 2 - lineStart)
  const activeDistance = itemDistances[activeIndex] ?? 0

  const linePath = `M ${x} ${lineStart} L ${x} ${lineEnd}`

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 8,
        height: '100%',
        overflow: 'visible',
      }}
    >
      <path
        d={linePath}
        stroke="var(--color3)"
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={linePath}
        fill="none"
        stroke="var(--color12)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={`${segmentHalf * 2} ${pathLength}`}
        strokeDashoffset={-(activeDistance - segmentHalf)}
        style={{
          transition: 'stroke-dashoffset 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </svg>
  )
}

export const DocsQuickNav = () => {
  const [headings, setHeadings] = useState<HTMLHeadingElement[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [itemPositions, setItemPositions] = useState<
    Array<{ top: number; height: number }>
  >([])
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const getLevel = (nodeName: string): number => {
    return Number(nodeName.replace('H', '')) || 2
  }

  const intersectingHeadings = useRef<Set<string>>(new Set())

  useEffect(() => {
    const timeout = setTimeout(() => {
      const headingElements: HTMLHeadingElement[] = Array.from(
        document.querySelectorAll('[data-heading]')
      )
      setHeadings(headingElements)
      setActiveIndex(0)
      setItemPositions([])
      intersectingHeadings.current.clear()
    }, 100)
    return () => clearTimeout(timeout)
  }, [pathname])

  useEffect(() => {
    if (!containerRef.current || headings.length === 0) return

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

    requestAnimationFrame(measurePositions)

    window.addEventListener('resize', measurePositions)
    return () => window.removeEventListener('resize', measurePositions)
  }, [headings])

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersectingHeadings.current.add(entry.target.id)
          } else {
            intersectingHeadings.current.delete(entry.target.id)
          }
        })

        if (intersectingHeadings.current.size > 0) {
          let maxIndex = -1
          intersectingHeadings.current.forEach((id) => {
            const index = headings.findIndex((h) => h.id === id)
            if (index > maxIndex) {
              maxIndex = index
            }
          })
          if (maxIndex !== -1) {
            setActiveIndex(maxIndex)
          }
        } else if (window.scrollY < 100) {
          setActiveIndex(0)
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    )

    headings.forEach((heading) => observer.observe(heading))

    return () => observer.disconnect()
  }, [headings])

  return (
    <YStack
      tag="aside"
      display="none"
      $lg={{
        display: 'flex',
        width: 220,
        shrink: 0,
        position: 'sticky' as any,
        t: 80,
        height: 'calc(100vh - 100px)',
      }}
    >
      {headings.length > 0 && (
        <YStack gap="$4">
          <YStack tag="nav" aria-labelledby="site-quick-nav-heading" gap="$2">
            <XStack items="center" mb="$2" id="site-quick-nav-heading">
              <ListIcon />
              <H4 fontFamily="$mono" size="$4" color="$color11">
                On this page
              </H4>
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              <YStack ref={containerRef as any} position="relative" pl={16}>
                <ActiveIndicator items={itemPositions} activeIndex={activeIndex} />
                {headings.map((heading, index) => {
                  const { id, nodeName, innerText } = heading
                  const level = getLevel(nodeName)
                  const isSubItem = level > 2

                  return (
                    <XStack
                      key={`${id}-${index}`}
                      data-nav-item
                      py="$1.5"
                      ml={isSubItem ? '$3' : 0}
                    >
                      <a
                        href={`#${id}`}
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById(id)
                          if (element) {
                            setActiveIndex(index)
                            element.scrollIntoView({ block: 'start' })
                            history.pushState(null, '', `#${id}`)
                          }
                        }}
                        style={{ textDecoration: 'none' }}
                      >
                        <Paragraph
                          tag="span"
                          py="$1.5"
                          px={isSubItem ? '$2' : 0}
                          rounded="$2"
                          bg={isSubItem ? '$color3' : 'transparent'}
                          size={level === 2 ? '$3' : '$2'}
                          color={
                            index === activeIndex
                              ? '$color12'
                              : level === 2
                                ? '$color11'
                                : '$color10'
                          }
                          cursor="pointer"
                          hoverStyle={{ color: '$color12' }}
                        >
                          {innerText}
                        </Paragraph>
                      </a>
                    </XStack>
                  )
                })}
              </YStack>
            </ScrollView>
          </YStack>
        </YStack>
      )}
    </YStack>
  )
}
