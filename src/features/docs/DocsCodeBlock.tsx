import { useState } from 'react'
import { Paragraph, ScrollView, SizableText, View, XStack, YStack, styled } from 'tamagui'

import { Button } from '~/interface/buttons/Button'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { CopyIcon } from '~/interface/icons/phosphor/CopyIcon'
import { TerminalIcon } from '~/interface/icons/phosphor/TerminalIcon'

const CodeBlockFrame = styled(YStack, {
  position: 'relative',
  my: '$4',
  borderWidth: 1,
  borderColor: '$color4',
  rounded: '$5',
  overflow: 'hidden',
})

const CodeBlockHeader = styled(XStack, {
  items: 'center',
  gap: '$2',
  pl: '$4',
  py: '$2',
  borderBottomWidth: 1,
  borderBottomColor: '$color4',
})

const Pre = styled(YStack, {
  render: 'pre',
  bg: '$color2',
  m: 0,
})

const Code = styled(SizableText, {
  render: 'code',
  p: '$4',
  fontFamily: '$mono',
  fontSize: 15,
  lineHeight: 25,
  color: '$color12',
  whiteSpace: 'pre',
})

const CopyButtonWrapper = styled(View, {
  position: 'absolute',
  t: '$2',
  r: '$3',
  variants: {
    hasHeader: {
      true: {
        t: '$3',
      },
    },
  } as const,
})

export function DocsCodeBlock({
  children,
  className,
  fileName,
}: {
  children: any
  className?: string
  fileName?: string
}) {
  const [copied, setCopied] = useState(false)

  const isTerminal = className === 'language-bash' || className === 'language-sh'
  const showHeader = fileName

  const handleCopy = () => {
    const code = typeof children === 'string' ? children : children?.props?.children
    if (code) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <CodeBlockFrame>
      {showHeader && (
        <CodeBlockHeader>
          {isTerminal && <TerminalIcon size={14} color="$color11" />}
          <Paragraph size="$3" color="$color11">
            {fileName || (isTerminal ? 'Terminal' : '')}
          </Paragraph>
        </CodeBlockHeader>
      )}

      <Pre className={className}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ minWidth: '100%' } as any}
        >
          <Code className={className} style={{ minWidth: '100%' }}>
            {children}
          </Code>
        </ScrollView>
      </Pre>

      <CopyButtonWrapper hasHeader={!!showHeader}>
        <Button
          aria-label="Copy code"
          size="small"
          circular
          tooltip={copied ? 'Copied!' : 'Copy'}
          icon={copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          onPress={handleCopy}
        />
      </CopyButtonWrapper>
    </CodeBlockFrame>
  )
}
