// the select pattern, one entry point, legs chosen by platform extension.
//
// `./SelectImpl` resolves to SelectImpl.ios.tsx on ios, SelectImpl.android.tsx
// on android, and SelectImpl.tsx everywhere else: a Form row with a menu
// picker, an M3 exposed dropdown menu, and the Tamagui trigger with its
// adapted sheet. the One.iOS calls live in the ios leg only, where a native
// ios build runs them, and the android leg is plain react native.
//
// the exports map still never points at a file with a platform sibling: it
// names Select.tsx, which has none, and the split happens one relative hop
// later. getting it wrong is silent - apps render the web leg on a device
// and every screenshot still looks plausible.
export * from './SelectImpl'
export type { SelectItem, SelectProps } from './selectContract'
