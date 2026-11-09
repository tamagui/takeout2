# Render modes

Use the installed `one-render-modes` skill for the mode decision and examples. The authoritative [render mode guide](https://onestack.dev/docs/render-modes) covers file/folder precedence and layout shells.

SSG is the default. SSR renders on request, SPA skips page HTML rendering, and API routes return HTTP responses. SPA routes can still have server loaders. On native all screens render in the app, while loader fetching still follows the route's mode. Do not confuse a client-rendered screen with client execution of its server loader.
