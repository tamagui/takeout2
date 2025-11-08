import { Check, Copy } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Button, SizableText, YStack } from 'tamagui'

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
      <Button
        position="absolute"
        top="$2"
        right="$2"
        size="$2"
        icon={copied ? Check : Copy}
        onPress={handleCopy}
        bg="$color4"
        hoverStyle={{ bg: '$color5' }}
        pressStyle={{ bg: '$color3' }}
        {...({} as any)}
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
