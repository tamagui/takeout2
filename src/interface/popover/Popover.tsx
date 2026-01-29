import { createEmitter } from '@take-out/helpers'
import {
  AnimatePresence,
  Popover as TamaguiPopover,
  withStaticProperties,
  YStack,
  type PopoverArrowProps,
  type PopoverProps,
  type PopoverContentProps as TamaguiPopoverContentProps,
} from 'tamagui'

import { animationClamped } from '../animations/animationClamped'
import { hasSelection } from '../forms/hasSelection'

import type { RefObject } from 'react'

export const popoverEmitter = createEmitter<{
  state: 'open' | 'closed'
  name: string
}>(
  'popover',
  { state: 'closed', name: '' },
  {
    silent: true,
  }
)

export type PopoverName = 'menu' | 'user-profile' | 'post-actions'

export type PopoverContentProps = TamaguiPopoverContentProps & {
  arrow?: boolean | PopoverArrowProps
  shadow?: 'light' | 'medium' | 'strong'
}

const PopoverComponent = ({
  ref,
  name,
  ...props
}: PopoverProps & { ref?: RefObject<TamaguiPopover | null>; name: PopoverName }) => {
  return (
    <TamaguiPopover
      offset={{
        mainAxis: 14,
      }}
      stayInFrame={{
        padding: 20,
      }}
      allowFlip={{
        padding: 25,
      }}
      ref={ref}
      {...props}
      onOpenChange={(val) => {
        popoverEmitter.emit({ state: val ? 'open' : 'closed', name })
        return props.onOpenChange?.(val)
      }}
    />
  )
}

const PopoverContent = ({
  children,
  arrow = true,
  unstyled,
  ...props
}: PopoverContentProps) => {
  // popovers trap focus so cause global shortcut handlers to fail

  return (
    <TamaguiPopover.Content
      z={200_000}
      unstyled={unstyled}
      {...(!unstyled && {
        transition: animationClamped('quickest'),
        bg: '$color2',
        p: 0,
        items: 'flex-start',
        borderWidth: 0.5,
        borderColor: '$color3',
        y: 0,
        opacity: 1,
        enterStyle: { y: -4, opacity: 0 },
        exitStyle: { y: 6, opacity: 0 },
        shadowColor:
          props.shadow === 'strong'
            ? '$shadow5'
            : props.shadow === 'medium'
              ? '$shadow4'
              : '$shadow3',
        shadowRadius: props.shadow === 'strong' ? 25 : 10,
        shadowOffset: { height: props.shadow === 'strong' ? 18 : 14, width: 0 },
        rounded: '$5',
      })}
      {...props}
    >
      <AnimatePresence>
        {arrow && (
          <TamaguiPopover.Arrow
            borderWidth={0.5}
            borderColor="$color3"
            bg="$color2"
            size="$3.5"
            {...(typeof arrow === 'object' && arrow)}
          />
        )}
      </AnimatePresence>

      {props.shadow === 'strong' ? (
        <YStack
          fullscreen
          pointerEvents="none"
          z={-1}
          rounded="$5"
          shadowColor="$shadow3"
          shadowRadius={40}
          shadowOffset={{ height: 20, width: 0 }}
        />
      ) : null}

      <YStack
        display="contents"
        // popovers trap focus so we need to implement special keyboard handling logic here
        // @ts-expect-error
        onKeyDownCapture={(e) => {
          if (e.key === 'Escape') {
            if (
              e.target instanceof HTMLInputElement ||
              e.target instanceof HTMLTextAreaElement
            ) {
              if (e.target.value !== '') {
                return
              }
              if (hasSelection(e.target)) {
                e.target.setSelectionRange(0, 0)
                return
              }
            }
          }
        }}
      >
        {children}
      </YStack>
    </TamaguiPopover.Content>
  )
}

export type Popover = TamaguiPopover

export const Popover = withStaticProperties(PopoverComponent, {
  // dont add Arrow we control it
  Trigger: TamaguiPopover.Trigger,
  Adapt: TamaguiPopover.Adapt,
  Close: TamaguiPopover.Close,
  Content: PopoverContent,
})
