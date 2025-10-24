import './markdown.css'

import MarkdownRender, { RuleType, type MarkdownToJSX } from 'markdown-to-jsx'
import { memo, useRef } from 'react'
import { MENTION_REGEXP } from '~/features/mention/constants'
import { Mention } from '~/features/mention/Mention'
import { unhashString } from '@vxrn/helpers'
import { ErrorBoundary } from '~/interface/utils/ErrorBoundary'
import { MarkdownCode } from './MarkdownCode'
import type { MarkdownProps } from './types'

export const Markdown = memo(function Markdown(props: MarkdownProps) {
  return (
    <ErrorBoundary title="Markdown rendering error">
      <MarkdownInner {...props} />
    </ErrorBoundary>
  )
})

export const MarkdownInner: typeof MarkdownRender = (props) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // useEffect(() => {
  //   const controller = new AbortController()

  //   containerRef.current.addEventListener('click', e => {
  //     const node = e.currentTarget
  //     ensure(node instanceof HTMLAnchorElement)
  //     if (node)
  //   })
  // }, [])

  return (
    <div ref={containerRef} style={{ display: 'contents' }}>
      <MarkdownRender {...props} options={options} />
    </div>
  )
}

const Anchor = (props: any) => {
  return <a target="_blank" {...props} />
}

const options: MarkdownToJSX.Options = {
  overrides: {
    code: MarkdownCode,
    a: Anchor,
  },
  renderRule(next, node) {
    if (node.type === RuleType.text) {
      // Actions
      if (node.text[0] === '/') {
        return node.text

        // TODO - parsing here is too weird, for one with tasks and => it gets split up
        // so you can't match it and avoid rendering task
        // two, for tasks we just insert a task table which works better anyway, we can
        // probably just insert a "single-step" task for actions so we can show them running

        // if (TASK_REGEX.test(node.text)) {
        //   return node.text
        // }

        // const [slashApp = '', action] = node.text.split(' ')
        // const foundApp = getServerApp(slashApp?.slice(1))
        // if (foundApp) {
        //   return (
        //     <span>
        //       <ActionDisplay app={foundApp} action={action} />
        //       {node.text}
        //     </span>
        //   )
        // }
        // return node.text
      }
      // Check for mentions first
      if (MENTION_REGEXP.test(node.text)) {
        return replaceMentions(node.text)
      }
      // Then check for emojis
      if (emojiDetector.test(node.text)) {
        return replaceEmoji(node.text)
      }
    }
    return next()
  },
}

// TODO get this dynamically from our reactions table
const shortcodeMap: Record<string, string> = {
  smile: '🙂',
}

const emojiDetector = /(:[^:]+:)/g
const replaceEmoji = (text: string): React.ReactNode => {
  return text.split(emojiDetector).map((part, index) => {
    if (part.startsWith(':') && part.endsWith(':')) {
      const shortcode = part.slice(1, -1)

      return <span key={index}>{shortcodeMap[shortcode] || part}</span>
    }

    return part
  })
}

export const replaceMentions = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let keyCounter = 0

  // Reset the regex lastIndex
  MENTION_REGEXP.lastIndex = 0

  let match
  while ((match = MENTION_REGEXP.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    // Extract mention data
    const type = match.groups?.type || 'user'
    const label = unhashString(match.groups?.username || '')
    const id = unhashString(match.groups?.id || '')

    // Add mention component
    const preloaded = label
      ? { type: type as 'role' | 'user' | 'channel', label }
      : undefined

    parts.push(
      <Mention
        key={`mention-${keyCounter++}`}
        type={type as any}
        id={id}
        preloaded={preloaded}
      />
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? <span>{parts}</span> : text
}
