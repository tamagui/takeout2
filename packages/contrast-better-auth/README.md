# contrast-better-auth

Small React conveniences for a Better Auth client, plus a native bearer
transport for apps that cannot use session cookies.

Your app keeps control of the base URL, plugins, fetch options, and inferred
types while the package creates the Better Auth client and its normalized auth
hook together:

```ts
import { createContrastBetterAuthClient, platformClient } from 'contrast-better-auth'
import { nativeTokenStore } from './nativeTokenStore'

export const { authClient, useAuth } = createContrastBetterAuthClient({
  baseURL: 'https://example.com/api/auth',
  plugins: [
    platformClient({
      origin: 'my-app://',
      tokenStore: nativeTokenStore,
    }),
  ],
})

export const useSession = authClient.useSession
```

`useAuth()` is derived directly from Better Auth's React `useSession()` hook.
During server rendering and the first hydrated client render it reports
`state: 'loading'`, `isLoggedIn: false`, and no user. Better Auth checks the
session after mount, so auth-dependent labels do not need their own hydration
flag.

`platformClient()` is a no-op plugin on web. The React Native export captures
the server's `set-auth-token` response header, stores it through the supplied
adapter, sends it as `Authorization: Bearer ...`, and clears it after sign-out.
The corresponding Better Auth server must enable its `bearer()` plugin.

The token store may be synchronous or asynchronous:

```ts
export interface NativeBearerTokenStore {
  get(): string | undefined | Promise<string | undefined>
  set(token: string, expectedToken: string | undefined): boolean | Promise<boolean>
  remove(expectedToken: string | undefined): boolean | Promise<boolean>
}
```

Writes and removals must compare the stored token with `expectedToken` and return
`false` without changing storage when they differ. For a synchronous single-value
store, the exported `nativeBearerTokenStore(store)` supplies this guard.

For a session established outside a Better Auth client action, store the
platform token and await `reestablishAuthSession(authClient)`. The helper keeps
the normalized auth state fenced while Better Auth refetches, validates, and
installs the confirmed session in its live atom. When another API has rejected
the session, clear platform storage and call
`clearAuthSession(authClient)`. The helper cancels the active session check at
Better Auth's request owner before clearing the live atom. The normalized auth
hook then stays logged out even if an HttpOnly cookie answers a later session
request. Only a successful `reestablishAuthSession` removes that local fence.
`refreshAuthSession` retries an ordinary session check without changing the
fence.

## Building

The package ships TypeScript source and has no build step. Your app's bundler
must support TypeScript and resolve `.native.ts` files for React Native. Run
`bun run typecheck` from this directory to check types.
