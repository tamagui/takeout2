---
name: building-with-one
description: Build and change One apps for web and React Native. Use for file routes, layouts, navigation, configuration, and choosing One native UI APIs.
license: MIT
metadata:
  version: "2.0.0"
---

# Building with One

One uses Vite, file routes, and server loaders for web and React Native. Start with the app's installed `one` version and existing scripts. These skills follow current One source; newer APIs may require upgrading an older app. Check exported types before copying an example.

## Start and run

```bash
npx one
# inside the generated project
bun install
bun run dev
```

Web defaults to http://localhost:8081. Native uses Vite/Rolldown by default, with OXC transforms and no required Babel config. For an app using One's native components, build its native binary:

```bash
npx one prebuild
npx one run:ios
# or: npx one run:android
```

Expo Go cannot provide One's native implementation. Metro is an optional dev bundler for dependencies that need it, not the default; native production JS builds use Rolldown regardless of the dev bundler.

## Before editing

- Keep routes in `app/` (or the configured `router.root`) and reusable code outside it. A route matching `/` is needed.
- Render `Slot`, `Stack`, `Tabs`, or a custom navigator from `_layout.tsx`. Providers can wrap it.
- Use router `Tabs` and `Stack` for file routes. `One.iOS.TabView` and `One.iOS.NavigationStack` are explicit SwiftUI composition APIs.
- Use `One.iOS`, `One.Android`, or `One.UI` when the existing native API fits. Check its platform and layout contract before adding a dependency or recreating a native control.
- Use platform files through an extensionless import. Keep iOS-only components out of shared web and Android render paths.
- Loaders execute server logic. Their returned data is public to the client, even when their imports are removed from the client bundle.
- Pin the production `one` version. Use the app's package scripts for builds and development.

## Read for the task

| Task | Reference |
| --- | --- |
| Route conventions, groups, platform files, typed routes | [routing](references/routing.md) |
| Layouts, routed tabs, headers and toolbars | [layouts](references/layouts.md) |
| Links, imperative navigation, protection | [navigation](references/navigation.md) |
| Head, safe area, loading and custom navigators | [components](references/components.md) |
| Route hooks, validated search params, loader state | [hooks](references/hooks.md) |
| Vite options, native manifest, environment variables | [configuration](references/configuration.md) |
| SwiftUI layout boundaries and native services | [native UI](references/native-ui.md) |
| Generated Apple framework bindings and observation | [iOS SDK](references/ios-sdk.md) |
| SwiftUI modifiers, Liquid Glass, release link groups | [native styles](references/native-styles.md) |
| Development panels and source inspector | [devtools](references/devtools.md) |
| Server middleware | [middleware](references/middleware.md) |
| Rendering strategy | [render modes](references/render-modes.md) |

For loader, API endpoint, deployment, or recipe work, read the corresponding installed `one-loaders`, `one-api-routes`, `one-deployment`, `one-render-modes`, or `one-guides` skill.

Official [installation](https://onestack.dev/docs/installation) and [native overview](https://onestack.dev/native/overview). In a One checkout, use `apps/onestack.dev/data/docs`, `apps/onestack.dev/data/native`, and `packages/one/src` as the source of truth. Do not assume an API on unreleased main exists in the app's pinned package.
