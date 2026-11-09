# Loader redirects, headers and caching

[Redirects](https://onestack.dev/docs/guides-loader-redirects), [loader cache](https://onestack.dev/docs/routing-loader#loader-cache), [response headers](https://onestack.dev/docs/helpers-setResponseHeaders).

```tsx
import { redirect, setResponseHeaders } from 'one'

export async function loader({ request }) {
  const session = await getSession(request)
  if (!session) throw redirect('/login')
  await setResponseHeaders((headers) => {
    headers.set('Cache-Control', 'private, no-store')
  })
  return { user: session.user }
}
```

Use SSR for per-request session checks. Both returning and throwing a redirect work. Client navigation receives redirect metadata before rendering; a direct document request gets an HTTP redirect. Client `Protected`/Redirect guards do not authorize server data. SSG runs without a per-user request and is unsuitable for personalized protected output.

For public SSR data, a deliberate CDN policy can use `public, s-maxage=60, stale-while-revalidate=300`. Personalized data must not enter a shared cache. CDN support and cache configuration vary; verify the target provider rather than promising every visitor a stale response, especially on a cold cache.

## Server loader cache

```ts
export const loaderCache = (params) => params.id
// or retain resolved data for 100 milliseconds
export const loaderCache = (params) => ({ key: params.id, ttl: 100 })
```

The string form coalesces concurrent requests and removes the entry on completion. `ttl` is in milliseconds, not seconds. `(params, request)` can include request-specific data in the key. Include every input that changes the result, including validated SSR query input, and authenticated identity when sharing is appropriate. Validation happens before a coalesced result is reused. An identity header is trustworthy only when the app's server has authenticated it.

For cookies, use `headers.append('Set-Cookie', value)` to retain multiple cookies. Response headers and in-process loader coalescing are separate cache mechanisms.
