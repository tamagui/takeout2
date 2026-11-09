# Router components and shared UI

- [Head](https://onestack.dev/docs/components-Head): web document metadata; iOS Handoff and Spotlight support. Android has no equivalent head output. Use absolute public URLs for share metadata.
- [SafeAreaView](https://onestack.dev/docs/components-SafeAreaView): also `One.UI.SafeArea.View`. Current One owns its native safe-area host and web CSS environment insets. The router installs the provider; do not add a separate safe-area package just for One. `edges` and `mode` control application of insets; `useSafeAreaInsets` reads them.
- [ScrollBehavior](https://onestack.dev/docs/components-ScrollBehavior): web scroll restoration customization. Default navigation behavior already scrolls/restores; add it only for an override.
- [LoadProgressBar](https://onestack.dev/docs/components-LoadProgressBar): optional web loading indicator in the root layout.
- [withLayoutContext](https://onestack.dev/docs/exports-withLayoutContext): adapt an existing React Navigation navigator to One's route/layout system. Reuse `Stack`, `Tabs`, or `Drawer` when they fit.

For native controls, effects, images, inputs, menus, and explicit SwiftUI composition, read [native UI](native-ui.md). For routed Stack headers and native toolbars, read [layouts](layouts.md).
