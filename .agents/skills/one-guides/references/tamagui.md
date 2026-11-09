# Tamagui

[One integration](https://onestack.dev/docs/guides-tamagui).

Use the app's installed Tamagui major and existing config. Current One examples use `@tamagui/config/v5` with `defaultConfig` and animations from `@tamagui/config/v5-css`; older v3 snippets should not be copied into a new app.

```tsx
import { defaultConfig } from '@tamagui/config/v5'
import { animations } from '@tamagui/config/v5-css'
import { createTamagui } from 'tamagui'

export const config = createTamagui({ ...defaultConfig, animations })
type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default config
```

Use `TamaguiProvider` under One's `SchemeProvider`; a child calling `useUserScheme()` can pass its resolved `value` as `defaultTheme`. Both color-scheme helpers are re-exported from `one`.

Add `tamaguiPlugin` from `@tamagui/vite-plugin` alongside `one()` when using its compiler/compatibility support. Set `components: ['tamagui']` and the actual config path. Current examples do not need the old `optimize: true` switch; `disableExtraction: true` disables extraction.

Optional `outputCSS: './public/tamagui.css'` emits a stylesheet. Import it in the root layout before setting `disableInjectCSS`. Keep its generated path consistent. See [dark mode](dark-mode.md) for scheme changes and SSR first paint.
