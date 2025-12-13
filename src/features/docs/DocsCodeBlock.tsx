import { useState } from 'react'
import { SizableText, YStack } from 'tamagui'

import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { CopyIcon } from '~/interface/icons/phosphor/CopyIcon'

export function DocsCodeBlock({
  children,
  className,
}: {
  children: any
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const code = typeof children === 'string' ? children : children?.props?.children
    if (code) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <YStack position="relative" my="$4" bg="$color2" rounded="$4" overflow="hidden">
      <ButtonSimple
        position="absolute"
        t="$2"
        r="$2"
        size="small"
        icon={copied ? <CheckIcon /> : <CopyIcon />}
        onPress={handleCopy}
        bg="$color4"
        hoverStyle={{ bg: '$color5' }}
        pressStyle={{ bg: '$color3' }}
      />
      <SizableText
        tag="pre"
        p="$4"
        overflow="scroll"
        fontFamily="$mono"
        fontSize="$3"
        lineHeight="$4"
      >
        <SizableText tag="code" className={className}>
          {children}
        </SizableText>
      </SizableText>
    </YStack>
  )
}
