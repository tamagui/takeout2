import { useLinkTo, useRouter, type Href } from 'one'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Paragraph, Text } from 'tamagui'

import { SearchContext } from './SearchContext'

import type { LinkProps as OneLinkProps } from 'one'
import type { ViewProps } from 'react-native'

const API_KEY = 'b2d5c50d03e630b4714f66af36c610f6'
const APP_ID = 'X3QSMF4DLC'
const INDEX = 'takeout_docs'

const VALID_DOC_SLUGS = [
  'agents',
  'deployment-overview',
  'highlights',
  'introduction',
  'one',
  'static-websites',
  'tamagui',
  'zero',
]

export type LinkProps = ViewProps & OneLinkProps

export const Link = ({ href, replace, asChild, ...props }: LinkProps) => {
  const linkProps = useLinkTo({ href: href as string, replace })

  return (
    <Text
      render="a"
      asChild={asChild ? 'except-style' : false}
      className="t_Link"
      cursor="pointer"
      color="inherit"
      fontSize={'inherit' as any}
      lineHeight={'inherit' as any}
      {...props}
      {...(linkProps as any)}
    />
  )
}

let DocSearchModal: any

export const SearchProvider = memo(({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState<string | null>(null)
  const [show, setShow] = useState(false)

  const onInput = useCallback((e: KeyboardEvent) => {
    setIsOpen(true)
    setInitialQuery(e.key)
  }, [])

  const onOpen = useCallback(() => setIsOpen(true), [])
  const onClose = useCallback(() => setIsOpen(false), [])

  useSearchKeyboard({
    isOpen,
    onOpen,
    onClose,
    onInput,
  })

  const contextValue = useMemo(
    () => ({
      isOpen,
      onOpen,
      onClose,
      onInput,
    }),
    [isOpen, onOpen, onClose, onInput]
  )

  useEffect(() => {
    if (!DocSearchModal && isOpen) {
      import('./DocSearch').then((x) => {
        DocSearchModal = x.default
        setShow(true)
      })
    }
  }, [isOpen])

  return (
    <>
      <SearchContext.Provider value={contextValue}>{children}</SearchContext.Provider>

      {isOpen &&
        show &&
        DocSearchModal &&
        createPortal(
          <DocSearchModal
            placeholder="Search docs..."
            hitComponent={ResultItem}
            searchParameters={{
              facetFilters: [],
              distinct: 1,
            }}
            initialQuery={initialQuery || ''}
            initialScrollY={typeof window !== 'undefined' ? window.scrollY : 0}
            onClose={onClose}
            appId={APP_ID}
            apiKey={API_KEY}
            indexName={INDEX}
            navigator={{
              navigate({ itemUrl }: { itemUrl: string }) {
                setIsOpen(false)
                router.push(itemUrl as Href)
              },
            }}
            transformItems={(items: any[]) => {
              return items
                .filter((item) => {
                  const url = new URL(item.url)
                  const slug = url.pathname.replace('/docs/', '').split('#')[0] || ''
                  return VALID_DOC_SLUGS.includes(slug)
                })
                .map((item) => {
                  const url = new URL(item.url)
                  return {
                    ...item,
                    url: `${url.pathname}${url.hash}`,
                    content: item.content,
                    highlightedContent:
                      item._highlightResult?.content?.value || item.content,
                    snippet: item._snippetResult?.content?.value || '',
                    objectID: item.objectID,
                    type: item.type || 'content',
                  }
                })
            }}
          />,
          document.body
        )}
    </>
  )
})

const ResultItem = ({
  hit,
  children,
}: {
  hit: { url: string }
  children: React.ReactNode
}) => {
  const url = typeof window !== 'undefined' ? window.location.origin + hit.url : hit.url
  return (
    <Link href={url as any}>
      <Paragraph render="span" color="$color">
        {children}
      </Paragraph>
    </Link>
  )
}

const useSearchKeyboard = ({
  isOpen,
  onOpen,
  onClose,
}: {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onInput: (e: KeyboardEvent) => void
}) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      function open() {
        if (!document.body.classList.contains('DocSearch--active')) {
          onOpen()
        }
      }

      if (
        (isOpen && event.keyCode === 27) ||
        (event.key === 'k' && (event.metaKey || event.ctrlKey)) ||
        (!isFocusedSomewhere(event) && event.key === '/' && !isOpen)
      ) {
        event.preventDefault()

        if (isOpen) {
          onClose()
        } else if (!document.body.classList.contains('DocSearch--active')) {
          open()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onOpen, onClose])
}

const isFocusedSomewhere = (event: KeyboardEvent) => {
  const element = event.target as HTMLElement
  const tagName = element.tagName
  return (
    element.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'SELECT' ||
    tagName === 'TEXTAREA'
  )
}
