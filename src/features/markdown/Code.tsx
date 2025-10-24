import { type HTMLAttributes, useState } from 'react'
import { useAsyncLayoutEffect } from '@vxrn/helpers'
import { highlightCode } from './shiki'

export function Code({
  lang,
  ...props
}: HTMLAttributes<HTMLElement> & {
  // TODO type
  lang: string
}) {
  const [html, setHtml] = useState<string>('')
  const [isHighlighted, setIsHighlighted] = useState(false)

  useAsyncLayoutEffect(
    async (signal) => {
      if (!lang) return
      if (typeof props.children !== 'string') return
      try {
        const highlighted = await highlightCode(props.children, lang)
        if (!signal.aborted) {
          setHtml(highlighted)
          setIsHighlighted(true)
        }
      } catch (error) {
        console.info('Failed to highlight code:', error)
        setIsHighlighted(false)
      }
    },
    [props.className, props.children]
  )

  if (isHighlighted && html) {
    return <div className="shiki-code-block" dangerouslySetInnerHTML={{ __html: html }} />
  }

  return <code {...props} />
}
