# Devtools

[Devtools](https://onestack.dev/docs/dev-tools).

Web: Alt/Option+Space opens the menu; Alt+S opens SEO, Alt+R route info, Alt+L loader timing, Alt+E errors, and Escape closes the panel. Use route info to inspect pathname/params and loader timing to distinguish module import from execution time.

The source inspector is injected in development. Hold Option/Alt for 0.8 seconds, hover, then click to open the source picker or start input recording. `devtools.editor`, `LAUNCH_EDITOR`, or `EDITOR` selects the editor. The old `SourceInspector` component is deprecated and renders nothing; do not add it to enable inspection.

Native: press `j` or `dt` in `one dev` to open React Native DevTools for a connected Hermes app. One app can have one debugger attachment at a time. Close another debugger/CDP client before reconnecting. Supported Rozenite plugins appear in that debugger; they are separate from web overlay plugins.

Use the current `devtools` configuration and package types for custom panels and individual switches. Avoid adding old panel shortcuts or runtime components from stale examples.
