import { forwardRef, type ReactNode } from 'react'
import { SizableText, XStack, YStack } from 'tamagui'
import { TooltipSimple } from '~/interface/tooltip/TooltipSimple'

export const Pill = forwardRef(function Pill(
  {
    children,
    badge,
    bg,
    tooltip,
    hoverable,
    tall,
    onPress,
    disabled,
  }: {
    children: ReactNode
    badge?: ReactNode
    bg?: any
    tooltip?: string
    onPress?: any
    hoverable?: boolean
    tall?: boolean
    disabled?: boolean
  },
  ref
) {
  const content = (
    <XStack
      ref={ref as any}
      gap="$1"
      px={8}
      height={tall ? 34 : 28}
      items="center"
      bg={bg || '$background02'}
      rounded={100}
      cursor={disabled ? 'default' : 'pointer'}
      group
      containerType="normal"
      {...(disabled
        ? { opacity: 0.5, pointerEvents: 'none' }
        : {
            onPress,
            pressStyle: onPress
              ? {
                  opacity: 0.5,
                }
              : null,
          })}
    >
      {hoverable && (
        <YStack
          animation="quickerLessBouncy"
          fullscreen
          z={0}
          rounded={100}
          bg="$color5"
          opacity={0}
          $group-hover={{
            opacity: 0.3,
          }}
        />
      )}
      {typeof children === 'string' ? (
        <SizableText
          text="center"
          ellipse
          select="none"
          pointerEvents="none"
          fontWeight="600"
          size="$3"
          flex={1}
        >
          {children}
        </SizableText>
      ) : (
        children
      )}
      {!!badge && (
        <SizableText
          select="none"
          pointerEvents="none"
          size="$3"
          opacity={0.4}
          y={0}
          fontWeight="200"
        >
          {badge}
        </SizableText>
      )}
    </XStack>
  )

  if (tooltip) {
    return <TooltipSimple label={tooltip}>{content}</TooltipSimple>
  }

  return content
})
