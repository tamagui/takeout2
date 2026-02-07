import { type ReactElement } from 'react'
import { SizableText, styled } from 'tamagui'
import type { SubscriptionStatus } from '../types'

export interface SubscriptionBadgeProps {
  status: SubscriptionStatus | null
}

export const SubscriptionBadge = ({ status }: SubscriptionBadgeProps): ReactElement | null => {
  if (!status) return null

  return (
    <Badge status={status}>
      <SizableText size="$2" fontWeight="600" color="inherit">
        {STATUS_LABELS[status] ?? status}
      </SizableText>
    </Badge>
  )
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Active',
  canceled: 'Canceled',
  incomplete: 'Incomplete',
  incomplete_expired: 'Expired',
  past_due: 'Past Due',
  paused: 'Paused',
  trialing: 'Trial',
  unpaid: 'Unpaid',
}

const Badge = styled(SizableText, {
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$2',
  size: '$2',
  fontWeight: '600',

  variants: {
    status: {
      active: { bg: '$green3', color: '$green11' },
      trialing: { bg: '$blue3', color: '$blue11' },
      canceled: { bg: '$gray3', color: '$gray11' },
      past_due: { bg: '$orange3', color: '$orange11' },
      unpaid: { bg: '$red3', color: '$red11' },
      paused: { bg: '$gray3', color: '$gray11' },
      incomplete: { bg: '$yellow3', color: '$yellow11' },
      incomplete_expired: { bg: '$red3', color: '$red11' },
    },
  } as const,
})
