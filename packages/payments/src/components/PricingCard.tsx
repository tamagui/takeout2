import { type ReactElement } from 'react'
import { H5, Paragraph, SizableText, YStack, styled } from 'tamagui'
import type { Plan } from '../types'
import { formatPrice } from '../utils/formatPrice'

export interface PricingCardProps {
  plan: Plan
  isCurrentPlan?: boolean
  onSelect?: (plan: Plan) => void
  children?: React.ReactNode
}

export const PricingCard = ({ plan, isCurrentPlan, onSelect, children }: PricingCardProps): ReactElement => {
  return (
    <CardFrame
      current={isCurrentPlan}
      onPress={onSelect ? () => onSelect(plan) : undefined}
      cursor={onSelect ? 'pointer' : undefined}
    >
      <H5 size="$6" fontWeight="700" color="$color12">
        {plan.name}
      </H5>

      <SizableText size="$9" fontWeight="800" color="$color12">
        {formatPrice(plan.amount, plan.currency, plan.interval === 'one_time' ? null : plan.interval)}
      </SizableText>

      <Paragraph size="$4" color="$color10">
        {plan.description}
      </Paragraph>

      {plan.features.length > 0 && (
        <YStack gap="$1.5" marginTop="$2">
          {plan.features.map((feature) => (
            <SizableText key={feature} size="$3" color="$color11">
              {feature}
            </SizableText>
          ))}
        </YStack>
      )}

      {children}
    </CardFrame>
  )
}

const CardFrame = styled(YStack, {
  gap: '$3',
  padding: '$4',
  borderRadius: '$4',
  borderWidth: 1,
  borderColor: '$color4',
  backgroundColor: '$color2',

  variants: {
    current: {
      true: {
        borderColor: '$color8',
        backgroundColor: '$color3',
      },
    },
  } as const,
})
