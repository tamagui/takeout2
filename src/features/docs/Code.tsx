import { SizableText } from 'tamagui'

export function CodeInline({ children }: { children: any }) {
  return (
    <SizableText
      tag="code"
      fontFamily="$mono"
      fontSize="$3"
      bg="$color3"
      px="$2"
      py="$1"
      rounded="$2"
    >
      {children}
    </SizableText>
  )
}
