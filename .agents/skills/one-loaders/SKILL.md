---
name: one-loaders
description: Implement One route and layout loaders, loader redirects, caching, refetching, and validated SSR search params.
license: MIT
metadata:
  version: "2.0.0"
---

# Loaders

[Loader reference](https://onestack.dev/docs/routing-loader). Loaders run on the server: SSG at build time, SSR and SPA through runtime loader requests. On native, SSG data is bundled while SSR/SPA data is fetched from the server. A SPA page can have a server loader.

```tsx
import { useLoader } from 'one'
import type { LoaderProps } from 'one'

export async function loader({ params }: LoaderProps) {
  const { getPost } = await import('~/features/posts/server')
  return { post: await getPost(params.slug) }
}

export default function Page() {
  const { post } = useLoader(loader)
  return <Post post={post} />
}
```

Keep the hook with its route loader. `createRoute` / `RouteType` can type concrete params. Loader-only imports are removed from client bundles, including top-level imports used only by the loader. Do not use server modules from client code. Return JSON-serializable data and never return secrets.

`params` contains dynamic segments, `path` the resolved pathname, and `request` is available for SSR. The validated `searchParams` field is optional and SSR-specific. Layout and page loaders run in parallel; authorize each protected data boundary independently.

## Refresh and cross-route data

- `useLoader(loader)` reads data.
- `useLoaderState(loader)` returns `{ data, refetch, state }`, where state is `idle` or `loading`.
- `useLoaderState()` in a child shares the current route's refetch/state.
- `await refetchLoader('/path')` refreshes imperatively outside React.
- `useMatches()` reads matched layout/page loader data. Narrow its unknown data before reading fields.

SSR loader data is stored by pathname and query. SSG/SPA use pathname keys; do not promise all render modes refetch on every query change. Use `useSearchParams(schema)` with an exported synchronous Standard Schema for typed SSR loader queries. Invalid query input returns 400 before execution. Client loader requests use a transport URL, so read the validated `searchParams` instead of interpreting `request.url` as the page URL.

Read [caching and redirects](references/caching-and-redirects.md) for auth guards, response headers, TTL units, and cache keys. For dynamic SSG routes, export `generateStaticParams()` returning route-param objects. `watchFile(path)` registers custom content dependencies during development; it is a no-op in production/client builds.

Route param validation is separate from SSR query validation: `validateParams` accepts a schema/validator, and `validateRoute` performs async navigation validation. Use `zodParamValidator` for inferred Zod output types and the installed validation result contract. A failed navigation validator is not a substitute for server authorization or a guaranteed not-found response.
