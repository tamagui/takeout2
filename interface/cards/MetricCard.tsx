import { Card, H2, Paragraph, SizableText, XStack, YStack } from 'tamagui'
import { Sparkline } from '~/interface/charts/Sparkline'
import type { ReactElement, ReactNode } from 'react'

// dashboard/stats card: icon-in-tinted-badge, label, big value, delta vs
// previous period, and an optional sparkline. use this on any screen that
// shows a single quantitative summary — running totals, weekly counts,
// progress toward goals. drop bare H1 numbers in favor of this.
//
// sparkline points are normalized to 0-1 internally; pass raw values.
// element values own their text size and fitting behavior; use size="9" to
// match the default H2 styling used for string and number values.
export function MetricCard({
  icon,
  label,
  value,
  delta,
  sparkline,
  width,
}: {
  icon: ReactNode
  label: string
  value: string | number | ReactElement
  delta?: { value: string; positive?: boolean }
  sparkline?: number[]
  width?: number
}) {
  return (
    <Card width={width} p={18} gap="2-5" borderWidth={1} borderColor="border-color">
      <XStack items="center" gap="2-5">
        <YStack
          width={32}
          height={32}
          items="center"
          justify="center"
          rounded="3"
          bg="color-5"
          theme="accent"
        >
          {icon}
        </YStack>
        <Paragraph size="2" color="color-10">
          {label}
        </Paragraph>
      </XStack>
      <XStack items="flex-end" justify="space-between" gap={13}>
        <YStack gap="0-5">
          {typeof value === 'string' || typeof value === 'number' ? (
            <H2 color="color">{value}</H2>
          ) : (
            value
          )}
          {delta ? (
            <SizableText size="1" color={`${delta.positive ? 'green-900' : 'red-900'}`}>
              {delta.value}
            </SizableText>
          ) : null}
        </YStack>
        {sparkline ? <Sparkline points={sparkline} width={72} height={28} /> : null}
      </XStack>
    </Card>
  )
}
