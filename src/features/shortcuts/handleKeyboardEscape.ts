import { isActiveElementFormField, isWeb } from '@take-out/helpers'
import { useEffect } from 'react'
import { useEvent } from 'tamagui'

import { dialogEmitter } from '~/interface/dialogs/shared'

/**
 * Simplified keyboard escape handler for the social media app
 * Handles closing dialogs and other escapable UI elements
 */

interface EscapeHandler {
  condition: () => boolean
  action: () => void
}

const currentRegisteredHandlers: (() => Promise<'abort' | void> | 'abort' | void)[] = []

export async function closeAllEscapables() {
  for (const handler of currentRegisteredHandlers) {
    const out = await handler()
    if (out === 'abort') {
      return 'aborted'
    }
  }
}

// Default escape handlers for common UI elements
const escapeHandlers: EscapeHandler[] = [
  {
    condition: () => dialogEmitter.value?.type !== 'closed',
    action: () => {
      dialogEmitter.emit({ type: 'closed' })
    },
  },
  // Add more default handlers here as needed
  // For example: closing modals, sheets, popovers, etc.
]

/**
 * Register a custom escape handler
 * Returns a cleanup function to unregister
 */
export function registerEscapeHandler(cb: () => void) {
  currentRegisteredHandlers.push(cb)
  return () => {
    const index = currentRegisteredHandlers.indexOf(cb)
    if (index >= 0) {
      currentRegisteredHandlers.splice(index, 1)
    }
  }
}

/**
 * React hook to handle escape key press
 */
function useHandleEscape(cb: () => void, disable = false) {
  const cbEvent = useEvent(cb)

  useEffect(() => {
    if (disable) return
    return registerEscapeHandler(cbEvent)
  }, [disable, cbEvent])
}

/**
 * Conditional escape handler hook
 */
export function useHandleEscapeIf(enabled: boolean, cb: () => void | (() => void)) {
  useHandleEscape(cb, !enabled)
}

let preventEscapeHandlers = false

/**
 * Temporarily prevent escape handlers from running
 */
export function usePreventEscapeHandlers(enabled: boolean) {
  preventEscapeHandlers = enabled
}

/**
 * Main keyboard escape handler function
 * Processes registered handlers in LIFO order, then default handlers
 */
export function handleKeyboardEscape() {
  if (preventEscapeHandlers) {
    return false
  }

  // Don't handle escape if user is typing in a form field
  if (isActiveElementFormField()) {
    return false
  }

  // Handle custom registered handlers first (LIFO)
  if (currentRegisteredHandlers.length) {
    const last = currentRegisteredHandlers.pop()
    if (last) {
      last()
      return true
    }
  }

  // Handle default escape handlers
  for (const { condition, action } of escapeHandlers) {
    if (condition()) {
      action()
      return true
    }
  }

  return false
}

/**
 * Component that sets up the escape key handler
 * Add this to your app root to enable escape handling
 */
export const KeyboardEscapeHandler = () => {
  useEffect(() => {
    if (!isWeb) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const handled = handleKeyboardEscape()
        if (handled) {
          event.preventDefault()
          event.stopPropagation()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return null
}
