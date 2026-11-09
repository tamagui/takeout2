# SSR-safe color scheme

[Dark mode](https://onestack.dev/docs/guides-dark-mode).

Current One re-exports `SchemeProvider`, `MetaTheme`, `useUserScheme`, and the other `@vxrn/color-scheme` helpers from `one`. Keep an existing direct package import if the app's installed version needs it.

Wrap theme consumers in `SchemeProvider`. It applies the stored or system scheme class before first paint. `MetaTheme darkColor="#050505" lightColor="#ffffff"` sets the browser theme color before hydration. `defaultScheme`, `forceScheme`, and `getClassName` configure the provider.

`useUserScheme()` returns `setting` (`system`, `light`, `dark`), resolved `value` (`light`, `dark`), and `set`. Read the hook in a child of the provider and use `value` as the Tamagui provider's `defaultTheme`. Outside React use `getUserScheme`, `setUserScheme`, and `onUserSchemeChange`.

Use the app's existing Tamagui config. `disableInjectCSS` requires that the extracted stylesheet is already imported. Avoid a client-only effect that changes the initial theme after the server has painted it. SwiftUI environment appearance uses its separate `swiftStyle.colorScheme` contract.
