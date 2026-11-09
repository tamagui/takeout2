# Middleware

[Middleware](https://onestack.dev/docs/routing-middlewares), [API method parity](https://onestack.dev/docs/routing-api-routes#dev-and-prod-parity).

```ts
import { createMiddleware } from 'one'

export default createMiddleware(async ({ request, next, context }) => {
  context.requestId = crypto.randomUUID()
  return await next()
})
```

Put `_middleware.ts` in a route directory. The chain runs root to leaf and responses return outward. A returned Response intercepts the request; `next()` continues and may return a Response, null, or void. Declare keys on `MiddlewareContext` through module augmentation when sharing typed data between middleware files.

Use middleware for request concerns such as API auth, redirects and CORS. It is server-only and does not run during static generation. Authorize protected loaders independently; layout and page loaders run concurrently.

For CORS, answer OPTIONS explicitly and add headers to the actual response too. If overriding Vite's `server.cors`, retain `preflightContinue: true` so your preflight handler runs in development as it does in production. A credentialed origin policy must use the app's allowed origins, rather than `*`.
