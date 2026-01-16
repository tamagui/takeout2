import { SizableText } from 'tamagui'

export function CodeInline({ children }: { children: any }) {
  return (
    <SizableText
      tag="code"
      fontFamily="$mono"
      fontSize="$3"
      bg="$color1"
      px="$1.5"
      py="$1.5"
      rounded="$3"
      $platform-web={{
        mx: '$-1.5',
        fontSize: '90%',
        lineHeight: 'inherit',
      }}
    >
      {children}
    </SizableText>
  )
}
