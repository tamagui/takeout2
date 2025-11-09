import { AnimatePresence, Circle, debounce, useIsomorphicLayoutEffect } from 'tamagui'
import { closeAllEscapables } from '~/features/shortcuts/handleKeyboardEscape'
import { sleep } from '@tamatko/helpers'
import { createEmitter, useEmitterValue } from '@tamatko/helpers'
import { animationClamped } from '~/interface/animations/animationClamped'

const GUIDED_CURSOR_SIZE = 30

let lastMousePosition: { x: number; y: number } | null = null

type GuidedCursor =
  | { type: 'start'; position: { x: number; y: number } }
  | { type: 'move'; position: { x: number; y: number } }
  | { type: 'press'; position: { x: number; y: number } }
  | { type: 'hide' }

const guidedCursorEmitter = createEmitter<GuidedCursor>('guided-cursor', { type: 'hide' })

export type GuidedNavigationOptions = {
  type?: 'guided' | 'instant'
  selectors: string[]
}

export async function guidedNavigation(options: GuidedNavigationOptions) {
  // close any dialogs, popovers, etc first:
  const closeResult = await closeAllEscapables()
  if (closeResult === 'aborted') {
    return
  }

  if (options.type === 'instant') {
    for (const selector of options.selectors) {
      const element = document.querySelector(selector)
      if (!element || !(element instanceof HTMLElement)) {
        continue
      }
      element.click()
    }
    return
  }

  const startPosition = lastMousePosition
    ? lastMousePosition
    : (() => {
        const firstElement = document.querySelector('#message-input')
        if (firstElement) {
          const firstRect = firstElement.getBoundingClientRect()
          return { x: firstRect.left, y: firstRect.top }
        }
        return { x: 0, y: 0 }
      })()

  guidedCursorEmitter.emit({
    type: 'start',
    position: startPosition,
  })

  await sleep(400)

  for (const selector of options.selectors) {
    const element = document.querySelector(selector)
    if (!element || !(element instanceof HTMLElement)) {
      continue
    }
    const rect = element.getBoundingClientRect()
    const position = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    guidedCursorEmitter.emit({ type: 'move', position })
    await sleep(500)
    guidedCursorEmitter.emit({ type: 'press', position })
    await sleep(200)
    element.click()
    await sleep(200)
  }

  await sleep(200)

  guidedCursorEmitter.emit({ type: 'hide' })
}

export function GuidedCursor() {
  const state = useEmitterValue(guidedCursorEmitter)

  useIsomorphicLayoutEffect(() => {
    const handleMouseMove = debounce((e: MouseEvent) => {
      lastMousePosition = { x: e.clientX, y: e.clientY }
    }, 200)

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  if (!state) return null

  return (
    <>
      <AnimatePresence initial={false}>
        {state?.type === 'hide' ? null : (
          <Circle
            position="absolute"
            pointerEvents="none"
            z={10000000000000}
            animation={animationClamped(
              state.type === 'start' ? '0ms' : 'quickLessBouncy'
            )}
            opacity={0.8}
            borderWidth={3}
            borderColor="$color02"
            size={GUIDED_CURSOR_SIZE}
            shadowColor="$color3"
            shadowRadius={20}
            shadowOffset={{ height: 5, width: 0 }}
            x={state.position.x - GUIDED_CURSOR_SIZE / 2}
            y={state.position.y - GUIDED_CURSOR_SIZE / 2}
            {...(state.type === 'press' && {
              borderColor: '$blue4',
            })}
            enterStyle={{
              y: -10,
              opacity: 0,
            }}
            exitStyle={{
              y: -10,
              opacity: 0,
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
