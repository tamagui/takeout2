import { One, useSafeAreaInsets } from 'one'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  Animated,
  Keyboard,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputInstance,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native'
import Svg, { Circle as SvgCircle, Polyline } from 'react-native-svg'
import { canSend, feedbackReducer, initialFeedbackState } from './controller'
import { FeedbackGlass } from './FeedbackGlass'
import { FeedbackHalo } from './FeedbackHalo'
import { CloseIcon, DrawIcon, InspectIcon } from './FeedbackIcons'
import { buildFeedbackReport, describeAnnotation } from './report'
import { buildStroke, normalizePoint } from './stroke'
import type {
  FeedbackAnnotation,
  FeedbackConfig,
  FeedbackImage,
  FeedbackPoint,
  FeedbackStroke,
  FeedbackSurface,
} from './types'
import type { ReactNode, RefObject } from 'react'

// what the controller carries between "the user pointed at something" and
// "the user sent it". the image is taken once, at annotation time, and simply
// travels with the annotation from there.
type FeedbackCapture = {
  annotation: FeedbackAnnotation
  image: FeedbackImage | null
}

const CONTROL_HEIGHT = 54
const CONTROL_RADIUS = 27
const HALO_PAD_X = 90
const HALO_PAD_Y = 56
const INK = 'rgb(88,140,255)'

// the control has to be movable, because it sits on top of the very thing the
// user is trying to point at. two resting places is the whole vocabulary: throw
// it and it snaps to whichever edge it was heading for, so it is always out of
// the way and never somewhere the user has to hunt for it.
type DockEdge = 'top' | 'bottom'
const SNAP_VELOCITY = 0.35

export function FeedbackOverlay({
  config,
  onClose,
}: {
  config: FeedbackConfig
  onClose: () => void
}) {
  const dark = useColorScheme() === 'dark'
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const surface: FeedbackSurface = useMemo(() => ({ width, height }), [width, height])

  const [state, dispatch] = useReducer(
    feedbackReducer<FeedbackCapture>,
    null,
    initialFeedbackState<FeedbackCapture>,
  )
  const [strokes, setStrokes] = useState<FeedbackStroke[]>([])
  const [livePoints, setLivePoints] = useState<FeedbackPoint[]>([])
  // the finger's raw path. a state updater has to stay pure, so the release
  // handler reduces this rather than reaching inside setLivePoints.
  const livePointsRef = useRef<FeedbackPoint[]>([])
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [edge, setEdge] = useState<DockEdge>('bottom')
  const dragY = useRef(new Animated.Value(0)).current
  const edgeRef = useRef<DockEdge>(edge)
  edgeRef.current = edge
  const inputRef = useRef<TextInputInstance>(null)
  const captureInFlightRef = useRef(false)
  const sendInFlightRef = useRef(false)

  const text = dark ? '#f5f5f7' : '#111114'
  const subtle = dark ? 'rgba(245,245,247,0.6)' : 'rgba(17,17,20,0.55)'

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow',
      (event) => setKeyboardHeight(Math.max(0, height - event.endCoordinates.screenY)),
    )
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    )
    return () => {
      show.remove()
      hide.remove()
    }
  }, [height])

  useEffect(() => {
    if (state.mode !== 'composing') return
    const timer = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(timer)
  }, [state.mode])

  const close = useCallback(() => {
    dispatch({ type: 'cancel' })
    setStrokes([])
    livePointsRef.current = []
    setLivePoints([])
    Keyboard.dismiss()
    onClose()
  }, [onClose])

  // capture runs at exactly one moment: an inspect tap or a finished set of
  // strokes. nothing is read from the screen before the user asks for it, and
  // nothing leaves the device until send.
  const completeCapture = useCallback(
    async (resolveAnnotation: () => FeedbackAnnotation | Promise<FeedbackAnnotation>) => {
      if (captureInFlightRef.current) return
      captureInFlightRef.current = true
      try {
        const annotation = await resolveAnnotation()
        const image = (await config.captureImage?.(surface)) ?? null
        dispatch({ type: 'captured', capture: { annotation, image } })
      } catch {
        dispatch({ type: 'capture-failed', message: 'Could not capture feedback' })
      } finally {
        captureInFlightRef.current = false
      }
    },
    [config, surface],
  )

  const takeInspectPoint = useCallback(
    async (point: FeedbackPoint) => {
      One.Haptics.selection()
      await completeCapture(async () => {
        const target = (await config.resolveTarget?.(point, surface)) ?? null
        return {
          kind: 'inspect',
          point,
          normalizedPoint: normalizePoint(point, surface),
          surface,
          target,
        }
      })
    },
    [completeCapture, config, surface],
  )

  const finishDrawing = useCallback(() => {
    if (strokes.length === 0) {
      dispatch({ type: 'capture-failed', message: 'Draw on the screen first' })
      return
    }
    One.Haptics.selection()
    void completeCapture(() => ({ kind: 'draw', strokes, surface }))
  }, [completeCapture, strokes, surface])

  const drawResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const { pageX, pageY } = event.nativeEvent
          livePointsRef.current = [{ x: pageX, y: pageY }]
          setLivePoints(livePointsRef.current)
        },
        onPanResponderMove: (event) => {
          const { pageX, pageY } = event.nativeEvent
          livePointsRef.current = [...livePointsRef.current, { x: pageX, y: pageY }]
          setLivePoints(livePointsRef.current)
        },
        onPanResponderRelease: () => {
          const stroke = buildStroke(livePointsRef.current, surface)
          livePointsRef.current = []
          setLivePoints([])
          if (stroke) setStrokes((existing) => [...existing, stroke])
        },
      }),
    [surface],
  )

  // dragging the dock itself, never its buttons: the responder only takes over
  // once the finger has actually moved, so a press on draw or inspect is still
  // a press.
  const dockResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 6,
        onPanResponderMove: (_event, gesture) => dragY.setValue(gesture.dy),
        onPanResponderRelease: (_event, gesture) => {
          const towardsTop =
            gesture.vy < -SNAP_VELOCITY ||
            (gesture.vy <= SNAP_VELOCITY && gesture.dy < -height / 4)
          const towardsBottom =
            gesture.vy > SNAP_VELOCITY ||
            (gesture.vy >= -SNAP_VELOCITY && gesture.dy > height / 4)
          const next: DockEdge = towardsTop
            ? 'top'
            : towardsBottom
              ? 'bottom'
              : edgeRef.current
          if (next !== edgeRef.current) {
            setEdge(next)
            One.Haptics.impact('light')
          }
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start()
        },
      }),
    [dragY, height],
  )

  const send = useCallback(() => {
    const capture = state.capture
    if (!capture || !canSend(state) || sendInFlightRef.current) return
    sendInFlightRef.current = true
    dispatch({ type: 'send' })
    const report = buildFeedbackReport({
      config,
      note: state.note,
      annotation: capture.annotation,
      image: capture.image,
      platform: Platform.OS,
    })
    config
      .submit(report)
      .then((result) => {
        if (result.ok) {
          One.Haptics.notification('success')
          dispatch({ type: 'send-succeeded' })
          close()
        } else {
          sendInFlightRef.current = false
          One.Haptics.notification('error')
          dispatch({ type: 'send-failed', message: result.message })
        }
      })
      .catch((cause: unknown) => {
        sendInFlightRef.current = false
        One.Haptics.notification('error')
        dispatch({
          type: 'send-failed',
          message: cause instanceof Error ? cause.message : String(cause),
        })
      })
  }, [close, config, state])

  const arm = useCallback((mode: 'inspecting' | 'drawing') => {
    One.Haptics.selection()
    setStrokes([])
    livePointsRef.current = []
    setLivePoints([])
    dispatch({ type: 'arm', mode })
  }, [])

  const controlBottom = insets.bottom + 18
  const haloWidth = Math.min(width, 320 + HALO_PAD_X)
  const haloHeight = CONTROL_HEIGHT + HALO_PAD_Y * 2

  const prompt =
    state.captureError ??
    (state.mode === 'inspecting'
      ? 'Tap what you want to report'
      : strokes.length > 0
        ? 'Draw more, or press Done'
        : 'Draw around what you want to report')

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.overlay]}
      pointerEvents="box-none"
      testID="feedback-overlay"
    >
      {/* capture layers — a full-screen surface that consumes the interaction,
          so the app chrome hidden underneath can never be pressed by a tap or a
          drag that was meant for the annotation. */}
      {state.mode === 'inspecting' ? (
        <View
          testID="feedback-inspect-layer"
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onResponderRelease={(event) => {
            const { pageX, pageY } = event.nativeEvent
            void takeInspectPoint({ x: pageX, y: pageY })
          }}
        />
      ) : null}

      {state.mode === 'drawing' ? (
        <View
          testID="feedback-draw-layer"
          style={StyleSheet.absoluteFill}
          {...drawResponder.panHandlers}
        />
      ) : null}

      {/* ink — finished strokes plus the one under the finger, and the inspect
          point once it is taken, so the user can see what they are sending. */}
      {(strokes.length > 0 || livePoints.length > 0 || state.capture) &&
      state.mode !== 'idle' ? (
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          width={width}
          height={height}
        >
          {strokes.map((stroke, index) => (
            <Polyline
              key={`stroke-${index}`}
              points={stroke.points.map((point) => `${point.x},${point.y}`).join(' ')}
              fill="none"
              stroke={INK}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {livePoints.length > 1 ? (
            <Polyline
              points={livePoints.map((point) => `${point.x},${point.y}`).join(' ')}
              fill="none"
              stroke={INK}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {state.capture?.annotation.kind === 'inspect' ? (
            <SvgCircle
              cx={state.capture.annotation.point.x}
              cy={state.capture.annotation.point.y}
              r={18}
              stroke={INK}
              strokeWidth={3}
              fill="rgba(88,140,255,0.18)"
            />
          ) : null}
        </Svg>
      ) : null}

      {/* control / composer — docked to one edge, draggable to the other so it
          is never covering the thing being reported, lifted by the keyboard,
          and separated from arbitrary app chrome by the feathered halo. */}
      <Animated.View
        pointerEvents="box-none"
        {...dockResponder.panHandlers}
        style={[
          styles.dock,
          edge === 'top'
            ? { top: insets.top + 18 }
            : { bottom: controlBottom + Math.max(0, keyboardHeight - insets.bottom) },
          { transform: [{ translateY: dragY }] },
        ]}
      >
        <View pointerEvents="none" style={{ width: haloWidth, height: haloHeight }}>
          <FeedbackHalo width={haloWidth} height={haloHeight} />
        </View>

        <View style={styles.dockContent} pointerEvents="box-none">
          {state.mode === 'composing' || state.mode === 'sending' ? (
            <Composer
              busy={state.mode === 'sending'}
              capture={state.capture}
              note={state.note}
              inputRef={inputRef}
              onChangeNote={(note) => dispatch({ type: 'note-changed', note })}
              onCancel={close}
              onSend={send}
              sendError={state.sendError}
              textColor={text}
              subtleColor={subtle}
              enabled={canSend(state)}
            />
          ) : (
            <Control
              mode={state.mode}
              prompt={prompt}
              strokeCount={strokes.length}
              onDraw={() => arm('drawing')}
              onInspect={() => arm('inspecting')}
              onDone={finishDrawing}
              onClose={close}
              textColor={text}
              subtleColor={subtle}
            />
          )}
        </View>
      </Animated.View>
    </View>
  )
}

function Control({
  mode,
  prompt,
  strokeCount,
  onDraw,
  onInspect,
  onDone,
  onClose,
  textColor,
  subtleColor,
}: {
  mode: 'idle' | 'inspecting' | 'drawing'
  prompt: string
  strokeCount: number
  onDraw: () => void
  onInspect: () => void
  onDone: () => void
  onClose: () => void
  textColor: string
  subtleColor: string
}) {
  const armed = mode !== 'idle'
  return (
    <View style={styles.stack} pointerEvents="box-none">
      {armed ? (
        <FeedbackGlass radius={16} style={styles.prompt}>
          <Text style={[styles.promptText, { color: subtleColor }]} numberOfLines={1}>
            {prompt}
          </Text>
        </FeedbackGlass>
      ) : null}

      <FeedbackGlass radius={CONTROL_RADIUS} style={styles.control}>
        <View style={styles.controlRow}>
          {mode === 'drawing' ? (
            <Action
              label="Done"
              onPress={onDone}
              textColor={textColor}
              testID="feedback-done"
              disabled={strokeCount === 0}
            />
          ) : (
            <Action
              label="Draw"
              onPress={onDraw}
              textColor={textColor}
              testID="feedback-draw"
              icon={<DrawIcon color={textColor} />}
            />
          )}
          <Action
            label="Inspect"
            onPress={onInspect}
            textColor={textColor}
            testID="feedback-inspect"
            icon={<InspectIcon color={textColor} />}
          />
          <Action
            label="Close"
            onPress={onClose}
            textColor={textColor}
            testID="feedback-close"
            icon={<CloseIcon color={textColor} />}
            iconOnly
          />
        </View>
      </FeedbackGlass>
    </View>
  )
}

function Action({
  label,
  onPress,
  icon,
  textColor,
  testID,
  iconOnly = false,
  disabled = false,
}: {
  label: string
  onPress: () => void
  icon?: ReactNode
  textColor: string
  testID: string
  iconOnly?: boolean
  disabled?: boolean
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.action,
        iconOnly && styles.actionIconOnly,
        { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
      ]}
    >
      {icon}
      {iconOnly ? null : (
        <Text style={[styles.actionText, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  )
}

function Composer({
  busy,
  capture,
  note,
  inputRef,
  onChangeNote,
  onCancel,
  onSend,
  sendError,
  textColor,
  subtleColor,
  enabled,
}: {
  busy: boolean
  capture: FeedbackCapture | null
  note: string
  inputRef: RefObject<TextInputInstance | null>
  onChangeNote: (note: string) => void
  onCancel: () => void
  onSend: () => void
  sendError: string | null
  textColor: string
  subtleColor: string
  enabled: boolean
}) {
  const context = capture ? describeAnnotation(capture.annotation) : ''
  return (
    <FeedbackGlass radius={22} style={styles.composer}>
      <View style={styles.composerBody}>
        <Text style={[styles.context, { color: subtleColor }]} numberOfLines={1}>
          {context}
        </Text>
        <TextInput
          ref={inputRef}
          testID="feedback-note"
          accessibilityLabel="Send us feedback"
          multiline
          editable={!busy}
          value={note}
          onChangeText={onChangeNote}
          placeholder="Send us feedback"
          placeholderTextColor={subtleColor}
          style={[styles.input, { color: textColor }]}
        />
        {/* the user is told what travels with the note, at the moment they
            decide whether to send it. */}
        <Text style={[styles.disclosure, { color: subtleColor }]}>
          {capture?.image
            ? 'A screenshot of this screen is included.'
            : 'No screenshot is included.'}
        </Text>
        {sendError ? (
          <Text testID="feedback-error" style={styles.error} numberOfLines={2}>
            {sendError}
          </Text>
        ) : null}
        <View style={styles.composerActions}>
          <Action
            label="Cancel"
            onPress={onCancel}
            textColor={subtleColor}
            testID="feedback-cancel"
            disabled={busy}
          />
          <Action
            label={busy ? 'Sending' : 'Send'}
            onPress={onSend}
            textColor={textColor}
            testID="feedback-send"
            disabled={!enabled || busy}
          />
        </View>
      </View>
    </FeedbackGlass>
  )
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: Number.MAX_SAFE_INTEGER,
  },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: { alignItems: 'center', gap: 8 },
  prompt: { paddingHorizontal: 14, paddingVertical: 7 },
  promptText: { fontSize: 13 },
  control: { height: CONTROL_HEIGHT, justifyContent: 'center' },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionIconOnly: { paddingHorizontal: 12 },
  actionText: { fontSize: 15, fontWeight: '500' },
  composer: { width: '100%', maxWidth: 420 },
  composerBody: { padding: 14, gap: 8 },
  context: { fontSize: 12 },
  input: { fontSize: 16, lineHeight: 21, minHeight: 44, maxHeight: 120, padding: 0 },
  disclosure: { fontSize: 11 },
  error: { fontSize: 12, color: 'rgb(220,80,80)' },
  composerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 4 },
})
