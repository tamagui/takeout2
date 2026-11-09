---
name: one-guides
description: Apply One recipes for authentication, images, CSS, color scheme, Tamagui, MDX, social metadata, caching, native builds, OTA, and troubleshooting.
license: MIT
metadata:
  version: "2.0.0"
---

# One recipes

Use the app's installed package versions and existing integrations. These references explain the One-specific boundary; read only the one needed for the task.

| Task | Reference |
| --- | --- |
| Session guards and server authorization | [authentication](references/authentication.md) |
| Image dimensions and blur metadata | [images](references/images.md) |
| Critical CSS and layout CSS | [CSS](references/css.md) |
| SSR-safe light/dark/system scheme | [dark mode](references/dark-mode.md) |
| Tamagui config and Vite integration | [Tamagui](references/tamagui.md) |
| File-driven MDX routes | [MDX](references/mdx.md) |
| Dynamic social sharing images | [Open Graph](references/open-graph.md) |
| Public SSR CDN caching | [ISR](references/isr.md) |
| Stale web chunks after deploy | [skew protection](references/skew-protection.md) |
| Native manifest, binaries and OTA | [native builds](references/native-builds.md) |
| SSR imports and native networking | [common issues](references/common-issues.md) |

For SwiftUI/Compose controls, native tabs/toolbars, style modifiers and glass, use the installed `building-with-one` skill's native references. Do not add Expo packages or replace native controls before checking One's current APIs.

Official [guides](https://onestack.dev/docs/guides) and [native overview](https://onestack.dev/native/overview).
