# SwiftUI modifiers, glass and release linking

Use the installed `OneNativeStyle` declarations, not guessed camel-case SwiftUI names. In the source checkout they live in `packages/one/src/platform/generated/controlTypes.ts`; native serialization is in `generated/swiftStyleNative.ts`. Generated overloads can have long names such as `frameWithWidthAndHeightAndAlignment` or `navigationTitleWithText`. Copy their exact fields and value types.

`style` affects the React Native host; `swiftStyle` affects the SwiftUI content. Increasing the host's frame does not necessarily enlarge an intrinsic Text or its overlay. Set the native frame too when the modifier must cover that box. Use the [stack](https://onestack.dev/native/ios-stacks), [group/slot](https://onestack.dev/native/ios-groups), and [navigation](https://onestack.dev/native/ios-navigation) references for their boundaries.

```tsx
<One.iOS.VStack spacing={8} swiftStyle={{
  padding: 16,
  background: '#F2F2F7',
  cornerRadius: 12,
  colorScheme: 'dark',
}}>
  <One.iOS.Text text="Now playing" />
</One.iOS.VStack>
```

Environment modifiers inherit through the SwiftUI subtree. Unknown names and values requiring a newer iOS version throw. Use the actual minimum OS contract; do not silently fake unsupported system behavior.

## Liquid Glass

Glass effects need iOS 26 or later. `One.iOS.Glass` takes `glassEffect` (`regular`, `clear`, `identity`), `shape`, optional `cornerRadius` for `roundedRectangle`, `interactive`, and `tint`. Give a standalone glass view a bounded height or flex parent. `identity` removes the glass effect while retaining children.

`One.iOS.GlassEffectContainer` groups nearby glass effects so SwiftUI can merge them. A view's `swiftStyle` supports `glassEffect`, `glassEffectInteractive`, `glassEffectTint`, and `glassEffectShape`. The prop names on `Glass` differ from these modifier names; do not interchange them. See [glass and groups](https://onestack.dev/native/ios-groups).

For a routed toolbar use `Stack.Toolbar` native items; `separateBackground` and `hidesSharedBackground` control iOS 26 shared glass backgrounds. A SwiftUI `Toolbar` and a UIKit `ToolbarHost` are distinct APIs. Use [toolbar](https://onestack.dev/native/toolbar) for the chosen path.

## iOS release link groups

One detects the native feature groups reached by the production bundle and records `ios/one-link-set.json` during prebuild. Debug builds link every group. Release builds compile and link the selected groups to avoid loading unused Apple frameworks. Apps should not maintain their own feature flags or manually remove framework links.

When adding native features to an existing app, rerun `one prebuild --platform ios` before a Release build. If the bundle needs a group missing from the installed pods, the build tells you to prebuild again. Static analysis follows known native names and supported style modifier keys; runtime-built property names, `eval`, or `new Function` are not a supported way to select features. A bundler without an analysis report conservatively links all groups.

An OTA JS update cannot add a group absent from its installed native binary. Keep updates within that binary's native API/runtime contract or ship a new binary. Check the app's installed version before relying on this newer link-set behavior.

Source: `packages/one/src/cli/iosLinkSet.ts`, `iosLinkSetAnalysis.ts`, `packages/one/ios-link-set.json`, and `One.podspec`.
