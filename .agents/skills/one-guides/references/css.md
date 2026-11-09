# CSS

[CSS guide](https://onestack.dev/docs/guides-css).

One loads layout CSS before scripts and page CSS after scripts. Keep critical layout imports in the layout rather than moving every stylesheet into the root.

A `.inline.css` import inlines that file into HTML for first paint. `one({ web: { inlineLayoutCSS: true } })` inlines all CSS. Use one deliberately based on the output size and first-paint need. Inlining a large stylesheet trades a request for a larger HTML response.

Put shared styles outside the route directory and import them from the layout. Native platform controls use `swiftStyle` or `composeStyle`, not web CSS. Tamagui's extracted stylesheet needs the matching provider configuration; see [Tamagui](tamagui.md).
