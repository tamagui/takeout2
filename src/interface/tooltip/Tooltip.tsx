import {
  createEmitter,
  isEqualIdentity,
  useEmitterSelector,
  useEmitterValue,
} from '@take-out/helpers'
import {
  Children,
  memo,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import {
  Paragraph,
  Tooltip as TamaguiTooltip,
  type SizableStackProps,
  type TooltipProps as TamaguiTooltipProps,
} from 'tamagui'

import { animationClamped } from '../animations/animationClamped'
import { Z_INDICES } from '../constants'
import { popoverEmitter, type PopoverName } from '../popover/Popover'

export type TooltipProps = TamaguiTooltipProps & {
  disabled?: boolean
  label?: React.ReactNode
  children?: React.ReactNode
  contentProps?: SizableStackProps
  disableOnPopover?: string
}

export type TooltipWrapperProps = {
  tooltip?: string
  tooltipDelayed?: boolean
  tooltipPlacement?: TamaguiTooltipProps['placement']
  popover?: PopoverName
}

export function wrapWithTooltip(
  content: ReactElement,
  { tooltip, tooltipDelayed, tooltipPlacement, popover }: TooltipWrapperProps
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
      allowFlip
      stayInFrame
      {...(tooltipPlacement && {
        placement: tooltipPlacement,
      })}
      disableOnPopover={popover}
      label={tooltip}
    >
      {content}
    </Tooltip>
  )
}

const isPopoverOpen = () => {
  return popoverEmitter.value?.state === 'open'
}

const globalTooltip = createEmitter<TooltipProps>(
  'global-tooltip',
  {},
  {
    comparator: isEqualIdentity,
  }
)

export const Tooltip: React.FC<TooltipProps> = memo((props) => {
  const { children, label } = props
  const child = Children.only(children)
  const isHoveredRef = useRef(false)

  useEffect(() => {
    if (isHoveredRef.current) {
      globalTooltip.emit(props)
    }
  }, [label, props])

  return (
    <TamaguiTooltip.Trigger
      scope="tooltip"
      {...(typeof label === 'string' && {
        'aria-label': label,
      })}
      asChild="except-style"
      onMouseEnter={() => {
        isHoveredRef.current = true
        globalTooltip.emit(props)
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false
        globalTooltip.emit({})
      }}
    >
      {child}
    </TamaguiTooltip.Trigger>
  )
})

export const GlobalTooltipProvider = ({
  children: providerChildren,
}: {
  children: ReactNode
}) => {
  const [open, setOpen] = useState(false)

  const props = useEmitterValue(globalTooltip)
  const {
    label,
    children,
    contentProps,
    disabled: disabledProp,
    disableOnPopover,
    ...tooltipProps
  } = props

  const disableFromPopover = useEmitterSelector(popoverEmitter, (popover) => {
    if (!disableOnPopover) return false
    return popover?.state === 'open' && popover?.name === disableOnPopover
  })

  const disabled = disableFromPopover || !label || disabledProp

  return (
    <TamaguiTooltip
      scope="tooltip"
      disableRTL
      offset={20}
      restMs={200}
      delay={{ open: 0, close: 200 }}
      open={open}
      // ensure we do a state change so we can force close it if need be due to popover
      onOpenChange={(open) => {
        const popoverOpen = isPopoverOpen()

        if (open && disableOnPopover && popoverEmitter.value?.name === disableOnPopover) {
          setOpen(false)
          return
        }

        // if a popover opens right after this, close this
        if (!popoverOpen) {
          setTimeout(() => {
            if (isPopoverOpen()) {
              setOpen(false)
              return
            }
          }, 10)
        }

        setOpen(open)
      }}
      allowFlip
      stayInFrame={{
        padding: {
          bottom: 14,
          left: 14,
          right: 14,
          top: 14,
        },
      }}
      {...tooltipProps}
      {...(disabled ? { open: false } : null)}
      // @ts-expect-error
      zIndex={Z_INDICES.tooltip}
    >
      {providerChildren}

      <TamaguiTooltip.Content
        theme="accent"
        // @ts-expect-error
        zIndex={Z_INDICES.tooltip}
        enterStyle={{ x: 0, y: -3, opacity: 0 }}
        exitStyle={{ x: 0, y: -3, opacity: 0 }}
        x={0}
        scale={1}
        y={0}
        borderWidth={0}
        opacity={disabled ? 0 : 1}
        pointerEvents="none"
        py="$1.5"
        px="$2"
        rounded="$2"
        animateOnly={['transform', 'opacity', 'width', 'height']}
        // TODO this would make them really nice but it needs to avoid animation when re-targeting
        enableAnimationForPositionChange
        transition={disabled ? null : animationClamped('quickerLessBouncy')}
        $theme-dark={{
          shadowColor: '$shadow4',
          shadowRadius: 3,
          shadowOffset: { height: 2, width: 0 },
        }}
        $theme-light={{
          shadowColor: '$shadow6',
          shadowRadius: 20,
          shadowOffset: { height: 7, width: 0 },
        }}
        {...contentProps}
      >
        <TamaguiTooltip.Arrow
          size="$3"
          shadowColor="$shadow4"
          shadowRadius={1}
          shadowOffset={{ height: 2, width: 2 }}
        />
        <Paragraph pointerEvents="none" fontFamily="$mono" size="$2">
          {label}
        </Paragraph>
      </TamaguiTooltip.Content>
    </TamaguiTooltip>
  )
}
