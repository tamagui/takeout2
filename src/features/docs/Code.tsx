import { SizableText, type SizableTextProps } from 'tamagui'

export function CodeInline({ children, ...props }: SizableTextProps) {
  // commit hashes get a cute tilt
  const isHash = typeof children === 'string' && /^[a-f0-9]{7,40}$/i.test(children)

  return (
    <SizableText
      render="code"
      fontFamily="mono"
      size="3"
      bg="color3"
      px="1-5"
      py="1-5"
      rounded="3"
      rotate={isHash ? '-3deg' : undefined}
      mx="web:-1-5"
      fontSize="web:90%"
      lineHeight="web:inherit"
      {...props}
    >
      {children}
    </SizableText>
  )
}
