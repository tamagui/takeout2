---
name: one-render-modes
description: Choose and configure One SSG, SSR, SPA and API render modes, folder inheritance, layout shells, and native loader behavior.
license: MIT
metadata:
  version: "2.0.0"
---

# Render modes

[Render mode reference](https://onestack.dev/docs/render-modes).

| Mode | Suffix | Page behavior | Loader behavior |
| --- | --- | --- | --- |
| SSG | `+ssg` | HTML generated at build time | Build-time data |
| SSR | `+ssr` | HTML on each request | Runtime server loader |
| SPA | `+spa` | Page rendered on the client | Server loader still supported |
| API | `+api` | HTTP endpoint | Method handler, no page |

SSG is the default; configure `one({ web: { defaultRenderMode: 'spa' } })` to change it. A file suffix overrides the nearest folder suffix, which overrides the global default. Inner folder suffixes override outer ones. Suffixes do not appear in URLs.

```text
app/
  _layout+ssg.tsx       static shell
  index+ssg.tsx         static home
  blog/[slug]+ssg.tsx   static posts with generateStaticParams
  admin+spa/index.tsx   client-rendered admin in static shell
  account+ssr.tsx       personalized, request-time page
  api/health+api.ts     HTTP endpoint
```

Layouts can use explicit render-mode suffixes to render a shell around SPA pages; layouts do not inherit folder render modes. An `api+api/` folder makes unsuffixed children endpoints too.

Dynamic SSG pages need `generateStaticParams()` returning an array of params objects. Do not build personalized user data into SSG output. SSR suits request-specific HTML or auth guards; use `private, no-store` for personalized responses. Public SSR can use a deliberate CDN cache policy.

SPA skips server rendering of the page, not all server data fetching. Its loaders remain server code. Static hosting works only when every needed output is static and no runtime loader/API/middleware is required. See the loader and deployment skills before choosing a static host.

Native always renders screens in the app. Render modes still select loader behavior: bundled SSG data versus server-fetched SSR/SPA data. Configure the production server origin for native runtime requests.
