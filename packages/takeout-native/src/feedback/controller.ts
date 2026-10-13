// ---------------------------------------------------------------------------
// the annotate-then-compose controller
//
// one state machine for every surface where a user attaches something on
// screen and then says what they want about it: the feedback overlay here, a
// host that resolves its own inspect targets and sends somewhere else entirely,
// and a host that brings its own subject and never arms at all. the capture
// payload is generic, so the machine never learns what a capture is made of.
//
// the sequencing is what is worth owning once: a capture only lands from an
// armed mode, typed text survives a re-capture, a send already in flight cannot
// start a second one, and a failed send returns to composing with the note
// intact rather than dropping what the user wrote.
// ---------------------------------------------------------------------------

export type FeedbackMode = 'idle' | 'inspecting' | 'drawing' | 'composing' | 'sending'

export type FeedbackControllerState<Capture> = {
  mode: FeedbackMode
  capture: Capture | null
  note: string
  // replaces the mode prompt while armed: the last attempt resolved nothing.
  captureError: string | null
  sendError: string | null
}

export type FeedbackControllerEvent<Capture> =
  | { type: 'arm'; mode: 'inspecting' | 'drawing' }
  | { type: 'capture-failed'; message: string }
  | { type: 'captured'; capture: Capture }
  | { type: 'compose'; capture: Capture }
  | { type: 'note-changed'; note: string }
  | { type: 'send' }
  | { type: 'send-succeeded' }
  | { type: 'send-failed'; message: string }
  | { type: 'cancel' }

export function initialFeedbackState<Capture>(): FeedbackControllerState<Capture> {
  return { mode: 'idle', capture: null, note: '', captureError: null, sendError: null }
}

export function feedbackReducer<Capture>(
  state: FeedbackControllerState<Capture>,
  event: FeedbackControllerEvent<Capture>,
): FeedbackControllerState<Capture> {
  switch (event.type) {
    case 'arm':
      // arming from the composer is a re-capture: the sentence in progress is
      // the point of the whole flow, so only the capture is dropped.
      if (state.mode === 'sending') return state
      return {
        ...state,
        mode: event.mode,
        capture: null,
        captureError: null,
        sendError: null,
      }

    case 'capture-failed':
      if (state.mode !== 'inspecting' && state.mode !== 'drawing') return state
      return { ...state, captureError: event.message }

    case 'captured':
      // a capture that resolves after the user cancelled, or while a send is in
      // flight, belongs to a flow that is over. one that arrives while the
      // composer is open is a re-target: pointing at another element swaps the
      // attachment and keeps the sentence in progress.
      if (state.mode === 'idle' || state.mode === 'sending') return state
      return {
        ...state,
        mode: 'composing',
        capture: event.capture,
        captureError: null,
        sendError: null,
      }

    case 'compose':
      // a caller that already holds its capture starts the composer directly.
      // it never arms, because there was nothing on screen to point at: the
      // subject is whatever the caller brought. re-composing while the composer
      // is open swaps the subject and keeps the sentence, exactly as a re-target
      // does.
      if (state.mode === 'sending') return state
      return {
        mode: 'composing',
        capture: event.capture,
        note: state.mode === 'composing' ? state.note : '',
        captureError: null,
        sendError: null,
      }

    case 'note-changed':
      if (state.mode !== 'composing') return state
      return { ...state, note: event.note }

    case 'send':
      // a note alone is not a report, and a capture alone is not a request.
      if (state.mode !== 'composing' || !state.capture || !state.note.trim()) return state
      return { ...state, mode: 'sending', sendError: null }

    case 'send-succeeded':
      if (state.mode !== 'sending') return state
      return initialFeedbackState<Capture>()

    case 'send-failed':
      if (state.mode !== 'sending') return state
      return { ...state, mode: 'composing', sendError: event.message }

    case 'cancel':
      return initialFeedbackState<Capture>()
  }
}

// the armed modes take over the screen: a tap or a drag belongs to the capture,
// never to whatever the app has painted underneath.
export function isCapturing(mode: FeedbackMode): boolean {
  return mode === 'inspecting' || mode === 'drawing'
}

export function canSend<Capture>(state: FeedbackControllerState<Capture>): boolean {
  return (
    state.mode === 'composing' && state.capture !== null && state.note.trim().length > 0
  )
}
