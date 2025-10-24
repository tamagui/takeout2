import { type HTMLAttributes, useMemo } from 'react'
import { Code } from './Code'
import { MarkdownSandboxMutation } from './MarkdownSandboxMutation'
import { MarkdownSandboxQuery } from './MarkdownSandboxQuery'

export function MarkdownCode(props: HTMLAttributes<HTMLElement>) {
  const lang = useMemo(() => {
    return props.className?.replace('lang-', '')
  }, [props.className])

  if (typeof props.children === 'string') {
    if (props.children.startsWith('zero.query')) {
      return <MarkdownSandboxQuery {...props} />
    }
    if (props.children.startsWith('export const query = () => {')) {
      return <MarkdownSandboxMutation {...props} />
    }
  }

  return <Code lang={lang || ''} {...props} />
}
