# Public SSR caching

[ISR guide](https://onestack.dev/docs/guides-isr).

One's ISR pattern uses SSR with CDN response caching, rather than a separate regeneration API:

```tsx
import { setResponseHeaders } from 'one'

export async function loader() {
  await setResponseHeaders((headers) => {
    headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  })
  return { posts: await getPublicPosts() }
}
```

A cold or expired cache can still wait for rendering. Background revalidation depends on the CDN and its configuration. Verify the target provider's current behavior before relying on `stale-while-revalidate`; do not hard-code an old provider support table into the app.

Use `private, no-store` for user-specific content. Do not decide authentication from the mere presence of a cookie or cache personalized output publicly. SSG is for content known at build time. In-process `loaderCache` coalescing is separate, with TTL in milliseconds; CDN cache headers use seconds.
