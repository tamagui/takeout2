// non-component helper extracted from Tooltip.tsx. lowercase exports
// disqualify Fast Refresh boundaries, so this helper lives on its own
// module — Tooltip.tsx stays a clean refresh boundary for its 16 importers.

import { Tooltip } from './Tooltip'
import type { TooltipProps } from './tooltipBus'
import type { ReactElement } from 'react'

export type TooltipWrapperProps = {
  tooltip?: string
  tooltipDelayed?: boolean
  tooltipPlacement?: TooltipProps['placement']
}

export function wrapWithTooltip(
  content: ReactElement,
  { tooltip, tooltipDelayed, tooltipPlacement }: TooltipWrapperProps,
): ReactElement {
  if (!tooltip) {
    return content
  }

  return (
    <Tooltip
      {...(tooltipDelayed && {
        delay: { open: 400, close: 0 },
        restMs: 400,
      })}
      {...(tooltipPlacement && {
        placement: tooltipPlacement,
      })}
      label={tooltip}
    >
      {content}
    </Tooltip>
  )
}
