---
name: one-api-routes
description: Create One HTTP endpoints and webhooks with +api route files, typed params, explicit methods, middleware, and Cloudflare worker context.
license: MIT
metadata:
  version: "2.0.0"
---

# API routes

[API route reference](https://onestack.dev/docs/routing-api-routes). Export HTTP method handlers from `+api.ts` files (or `.tsx` when JSX is needed). They execute on the server and return Web API Responses.

```ts
// app/api/users/[id]+api.ts
import { createAPIRoute } from 'one'

export const GET = createAPIRoute<'/api/users/[id]'>((request, { params }) => {
  return Response.json({ id: params.id })
})
```

Use `app/api/index+api.ts` for `/api`, `app/api/users+api.ts` for `/api/users`, and `[...path]+api.ts` for catch-all paths. A folder ending in `+api` passes the API mode to unsuffixed children. `route+api.ts` is not a special directory-index convention.

## Dispatch and input

Named exports handle GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS. A default handler catches methods without named exports. Without either, One returns 405 with an Allow header. HEAD and OPTIONS need explicit handlers or a default/middleware response; do not assume automatic GET or CORS behavior.

Read a request body once, choosing `json()`, `formData()`, or `text()`; validate it at this boundary. Webhooks that verify a signature often need the original body. Authorize access before returning private data or mutating records. Return a deliberate error Response for expected failures; do not expose arbitrary server exception messages.

The second argument contains `params`; dynamic single segments are strings and rest segments are arrays. `Endpoint` is a nongeneric simple handler type; use `createAPIRoute<'/path/[id]'>` for typed params.

## Responses and middleware

Use `Response.json(data, { status })`, `new Response(body, options)`, or One's `redirect('/path')`. Standard `Response.redirect` needs an absolute URL, such as `new URL('/login', request.url)`. Do not export React page components from endpoints.

Place `_middleware.ts` in the relevant route directory for auth or CORS. Dev and production dispatch the same method handlers. When overriding Vite `server.cors`, preserve `preflightContinue: true` so OPTIONS reaches your handler.

## Cloudflare

`createAPIRoute` handlers receive `worker` on the second argument in Workers: `worker.env` contains configured bindings and `worker.executionCtx.waitUntil(promise)` retains background work. `worker` is undefined in Node/dev; only use the runtime's contract. See the deployment skill for generated Wrangler configuration.

Native clients need an absolute endpoint URL, using the deployed server origin. Deploy an actual server/worker for API routes; a static-only host cannot execute them.
