# Authentication

[Authentication](https://onestack.dev/docs/guides-authentication), [loader redirects](https://onestack.dev/docs/guides-loader-redirects).

Use the app's session provider. One does not require a particular auth vendor. Wait for session loading before redirecting; otherwise a valid session can briefly navigate to login.

```tsx
import { Redirect, Slot } from 'one'

export function SessionLayout() {
  const { session, isLoading } = useSession()
  if (isLoading) return null
  if (!session) return <Redirect href="/login" />
  return <Slot />
}
```

`Protected guard={!!session}` inside a navigator removes its wrapped screens, including tab entries. This is navigation control. Independently authorize every private loader and endpoint. Layout and page loaders run in parallel, so a parent loader does not sequentially protect a child.

SSR loaders can `throw redirect('/login')` before returning data. Use `private, no-store` for personalized responses and avoid sharing loader cache entries across users. SSG does not have a per-user request.

For an auth library with a Web Request handler, a catch-all `app/api/auth/[...rest]+api.ts` can forward GET and POST to its configured handler. Keep database/provider secrets in server modules. Follow the installed auth library's adapter types rather than treating a database URL as an adapter.

For native OAuth, configure the app's callback scheme/universal links and native browser session using the [Browser](https://onestack.dev/native/browser) and [auth](https://onestack.dev/native/auth) contracts. Do not assume a web cookie session automatically authenticates native loader requests.
