# Social preview images

[Open Graph guide](https://onestack.dev/docs/guides-open-graph).

Generate images in an API route with `ImageResponse` from `@vercel/og` when that renderer fits the deployment runtime. Name a JSX endpoint `app/api/og+api.tsx`. Read title or identifiers from the Request URL, validate them, and return the image Response.

The JSX uses the renderer's supported layout subset, not a browser or native view tree. Fonts loaded from disk work on Node; use runtime-compatible font loading on edge deployments.

Set page metadata with `Head` from `one`: `og:image`, dimensions (commonly 1200 by 630), and `twitter:card=summary_large_image`. Use an absolute public image URL so social crawlers can fetch it. Set caching on the returned image Response itself; `setResponseHeaders` is intended for One's loader/server response context.

Check the image endpoint and resulting page metadata together. Keep private user content out of a public cached image.
