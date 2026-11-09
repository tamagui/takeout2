# Layouts, tabs, headers and toolbars

[Layouts](https://onestack.dev/docs/routing-layouts), [Stack](https://onestack.dev/docs/components-Stack), [Tabs](https://onestack.dev/docs/components-Tabs), [toolbar](https://onestack.dev/native/toolbar).

Render `Slot` for the child without navigation chrome, `Stack` for file-route push/pop, or `Tabs` for file-route tabs. `Drawer` comes from `one/drawer` and needs its documented navigation and gesture dependencies. Providers and ordinary layout views can wrap navigators.

```tsx
import { Stack } from 'one'

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  )
}
```

Names match route files. `Stack.Screen` in page content can set options from page state. `Stack.Header` supports declarative title, back button, search bar, left and right content; use the installed Stack types for its supported props.

## Routed tabs

Current `Tabs` uses React Navigation bottom tabs on native and a headless implementation on web. Use its native options directly:

```tsx
<Tabs.Screen name="feed" options={{
  title: 'Feed',
  tabBarIcon: ({ focused }) => ({
    type: 'sfSymbol', name: focused ? 'house.fill' : 'house',
  }),
}} />
```

Native layouts reject the web-only `href` screen option. Move screens that must not be tabs to a parent Stack. A custom web tab target belongs in `_layout.web.tsx`. Web `Tabs` renders only the focused screen by default; a custom child can call `useTabs()` to render `screens` links and `focused.element`. See the [headless web guide](https://onestack.dev/docs/guides-headless-web).

Use `tabBarSelectionEnabled: false` with a `tabPress` listener for a native action tab. Use the installed navigator options for `tabBarSystemItem` and `tabBarMinimizeBehavior`. Do not add the retired `NativeTabs` imports or `@bottom-tabs` dependencies from older One examples.

## Routed iOS toolbars

`Stack.Toolbar placement="left"` or `"right"` declares native header items. Nest `Button`, `Menu`, `MenuAction`, and fixed-width `Spacer` descriptors. A bottom toolbar (the default placement) must mount in screen content, not layout config:

```tsx
import { Stack } from 'one'

function Actions({ add }: { add: () => void }) {
  return (
    <Stack.Toolbar>
      <Stack.Toolbar.Button icon="plus" onPress={add}>Add</Stack.Toolbar.Button>
      <Stack.Toolbar.Spacer />
    </Stack.Toolbar>
  )
}
```

The bottom toolbar renders nothing off iOS. `Badge` belongs only to header toolbars. `One.iOS.ToolbarHost` and `BarButtonItem` expose lower-level UIKit items.

SwiftUI `One.iOS.Toolbar` is a separate API: put its `ToolbarItem`, `ToolbarItemGroup`, and `ToolbarSpacer` inside a `One.iOS.NavigationStack` or `TabView`. Split-view column wrappers use `Toolbar.Content`. Read [native UI](native-ui.md) before mixing native navigation containers.

Layouts can export loaders and read data with `useLoader`; `useMatches()` reads matched layout/page loader data. Layout and page loaders run in parallel, so a parent loader is not a sequential auth gate for child loaders.
