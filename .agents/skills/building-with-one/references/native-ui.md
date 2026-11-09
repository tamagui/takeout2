# Native UI and services

Start with [native components](https://onestack.dev/docs/native-components), [platform support](https://onestack.dev/native/platform-support), and the installed package's declarations. Public namespaces are `One.iOS` (SwiftUI/UIKit), `One.Android` (Compose), `One.UI` (shared controls), and services directly on `One`.

## SwiftUI layout boundaries

```tsx
import { One } from 'one'

export function Status() {
  return (
    <One.iOS.VStack spacing={8} style={{ width: '100%' }} swiftStyle={{ padding: 16 }}>
      <One.iOS.Label label="Wi-Fi" systemImage="wifi" />
      <One.iOS.Text text="Connected" />
    </One.iOS.VStack>
  )
}
```

Use an `.ios.tsx` component, imported without its platform extension. iOS views throw on Android/web; supply the appropriate platform sibling.

`style` sizes the outer React Native host. `swiftStyle` configures the SwiftUI view inside it. Stacks measure their own content height and accept native SwiftUI children. Raw strings and React Native views are not SwiftUI stack children. Use `One.iOS.Text text="..."`, and `One.iOS.Slot height={44} width={160}` to host React Native content. A slot in an HStack needs an explicit width.

`List`, `Form`, `ScrollView`, `TabView`, `Pager`, and `NavigationStack` need their own bounded viewport; do not nest them in a measured HStack/VStack. A flex parent must itself have finite bounds. Read [stacks](https://onestack.dev/native/ios-stacks) and [lists](https://onestack.dev/native/ios-lists) before mixing Yoga and SwiftUI sizing.

## Explicit native tabs and navigation

Router `Tabs` and `Stack` navigate files. Use `One.iOS.TabView` only when composing tabs and page content explicitly:

```tsx
import { useState } from 'react'
import { Text } from 'react-native'
import { One } from 'one'

export function Library() {
  const [tab, setTab] = useState('feed')
  return (
    <One.iOS.TabView style={{ flex: 1 }} selection={tab} onSelectionChange={setTab}>
      <One.iOS.Tab value="feed" titleKey="Feed" systemImage="house">
        <Text>Feed</Text>
      </One.iOS.Tab>
      <One.iOS.Tab value="saved" titleKey="Saved" systemImage="bookmark">
        <Text>Saved</Text>
      </One.iOS.Tab>
    </One.iOS.TabView>
  )
}
```

Selection must identify a mounted page tab. A tab takes either page children or `onPress` for an action tab, never both. `TabSection`, customization, and sidebar styles need iOS 18; bottom accessories and newer placements have their own availability gates. `TabViewBottomAccessory` and `TabViewSlot` are marker children, not free-standing views. Read [tabs and pager](https://onestack.dev/native/ios-tabs-pager).

`One.iOS.NavigationStack` accepts root content and `One.iOS.Toolbar` children. Set titles through `swiftStyle.navigationTitleWithText` and `navigationBarTitleDisplayMode`. Toolbar entries use SwiftUI `placement` names such as `primaryAction`; keep `ToolbarItem` inside `Toolbar`. `NavigationSplitView` uses Sidebar/Content/Detail column markers. Read [navigation](https://onestack.dev/native/ios-navigation). For routed UIKit toolbars use [layouts](layouts.md).

## Controls and state

Controlled props stay authoritative: update them in the matching callback (`isOn` / `onIsOnChange`, `value` / `onValueChange`, `selection` / `onSelectionChange`). Follow a component's `revision` contract when resetting its value externally.

Some controls accept `useNativeState` handles from `one`. `One.iOS.withAnimation(animation, body)` animates writes to those native handles in one SwiftUI transaction; ordinary React state writes do not join it. Named or record animations use seconds for duration. See [native input](https://onestack.dev/native/text-input).

## Android and shared UI

Compose roots use React Native `style`; descendants use `composeStyle`. Bound the root and use Compose alignment/weight contracts inside it. See [Compose](https://onestack.dev/native/android-compose).

Before adding another package, check `One.UI.Image`, `Icon`, `TextInput`, `Pager`, `Portal`, `SafeArea`, and the [effects](https://onestack.dev/native/effects). Shared APIs can still have platform limits: read their references rather than inferring web behavior from the namespace.

## Services and setup

Services such as `One.Notifications`, `SecureStore`, `FileSystem`, `Audio`, `ImagePicker`, `Location`, `Database`, and `Updates` live directly on `One`, not under `One.iOS`. Hooks are named exports from `one`. See [native APIs](https://onestack.dev/docs/native-apis) for the service-specific permission, configuration and cleanup contracts.

For example, `One.SecureStore.setItem(key, value)`, `getItem(key)`, and `deleteItem(key)` store strings; missing values are null and web operations reject. Subscription cleanup varies: Network returns an object with `remove()`, while other APIs return an unsubscribe function. Follow the actual signature.

Set native usage descriptions and capabilities in `native.app` before prebuild, then request runtime permission through the service. A system image picker and general PhotoLibrary access have different permissions. WidgetKit/Live Activities need an extension and App Group; `One.iOS.WidgetUI` serializes a supported layout, not arbitrary React Native UI. Use the [native build guide](https://onestack.dev/docs/guides-ios-native).
