export const DESKTOP_APP_SCHEME =
  // we're building a separate dev and production shells for the app
  // you want to build a proper .app into /Applications in dev mode so you can deep link
  typeof window !== 'undefined' && window.location?.host === 'start.chat'
    ? 'start-chat'
    : 'start-chat-dev'
