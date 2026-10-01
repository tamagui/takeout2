// the menu pattern, one entry point, legs chosen by platform extension.
//
// `./MenuImpl` resolves to MenuImpl.ios.tsx and MenuImpl.android.tsx, where
// MenuEntry[] maps straight to One's system menu, and to MenuImpl.tsx
// everywhere else, where @tamagui/menu draws it. the exports map names this
// file, which has no platform sibling, so the split happens one relative hop
// later, the same way select/Select does it.
export * from './MenuImpl'
