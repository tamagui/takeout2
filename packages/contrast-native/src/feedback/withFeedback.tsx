import { One } from 'one'
import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { openFeedback, subscribeToFeedbackActivation } from './activation'
import { FeedbackOverlay } from './FeedbackOverlay'
import type { FeedbackConfig } from './types'
import type { ComponentType, ReactNode } from 'react'
import type { GestureResponderEvent } from 'react-native'

type WrapperProps = { children?: ReactNode }

// mounts the feedback overlay above the whole app, so it can draw over every
// screen — including screens rendered by a nested runtime — and so the taps it
// takes never reach the app underneath.
//
// three simultaneous touches are the dependency-free, anywhere activation.
// the wrapper claims only that gesture: ordinary taps, scrolling, and native
// navigation continue to negotiate responders exactly as they did before.
// visible app controls and future device-level sources call `openFeedback()`.
//
// react native allows exactly one wrapper component, so an app that already has
// one passes it here instead of replacing it:
//
//   app registry set wrapper component provider with the existing wrapper
export function withFeedback(
  Inner?: ComponentType<WrapperProps>,
): ComponentType<WrapperProps> {
  return function FeedbackWrapper({ children }: WrapperProps) {
    const [sessionConfig, setSessionConfig] = useState<FeedbackConfig | null>(null)

    useEffect(
      () =>
        subscribeToFeedbackActivation((config) => {
          // the first activation owns this session. a route or workspace may
          // reconfigure the host behind the composer, but it cannot reroute
          // the annotation that is already on screen.
          setSessionConfig((existing) => existing ?? config)
        }),
      [],
    )

    const activateFromThreeFingers = useCallback(
      (event: GestureResponderEvent) => {
        if (sessionConfig || event.nativeEvent.touches.length !== 3) return false
        const opened = openFeedback()
        if (opened) {
          One.Haptics.impact('medium')
        }
        return opened
      },
      [sessionConfig],
    )

    const content = Inner ? <Inner>{children}</Inner> : children

    return (
      // the wrapper sits above the app root, so an app-level provider is too
      // low for the sibling overlay. own this context at the same global layer
      // as the overlay; a nested app provider may still refine its own subtree.
      <One.UI.SafeArea.Provider>
        <View
          style={{ flex: 1 }}
          onStartShouldSetResponderCapture={activateFromThreeFingers}
        >
          {content}
          {sessionConfig ? (
            <FeedbackOverlay
              config={sessionConfig}
              onClose={() => setSessionConfig(null)}
            />
          ) : null}
        </View>
      </One.UI.SafeArea.Provider>
    )
  }
}
