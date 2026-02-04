# @take-out/better-auth-utils

Auth utilities for better-auth with React/React Native support.

## Installation

```bash
bun add @take-out/better-auth-utils
```

## Client Usage

```typescript
import { createBetterAuthClient } from '@take-out/better-auth-utils'

const auth = createBetterAuthClient({
  baseURL: 'https://myapp.com',
  plugins: [/* better-auth plugins */],
  // transform user object with app-specific fields
  createUser: (user) => ({ ...user, role: user.role as 'admin' | undefined }),
  // optional callbacks
  onAuthStateChange: (state) => console.log('Auth changed:', state),
  onAuthError: (error) => console.error('Auth error:', error),
})

// React hook for auth state
const { state, user, token } = auth.useAuth()

// get current auth state (non-reactive)
const { loggedIn } = auth.getAuth()

// clear all auth (localStorage + cookies)
auth.clearAllAuth()

// clear just localStorage token
auth.clearAuthClientToken()
```

### Client Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseURL` | `string` | required | Auth server URL |
| `plugins` | `array` | `[]` | better-auth client plugins |
| `createUser` | `function` | identity | Transform user object with app-specific typing |
| `onAuthStateChange` | `function` | - | Callback when auth state changes |
| `onAuthError` | `function` | - | Callback for auth errors |
| `storagePrefix` | `string` | `'auth'` | localStorage key prefix |
| `retryDelay` | `number` | `4000` | Retry delay after errors (ms) |
| `tokenValidationEndpoint` | `string` | `'/api/auth/validateToken'` | JWT validation endpoint |
| `authCookieNames` | `string[]` | `['better-auth.jwt', 'better-auth.session_token']` | Cookie names to clear on `clearAllAuth()` |

### Client API

- `useAuth()` - React hook returning `{ state, user, session, token }`
- `getAuth()` - Get current auth state (non-reactive), includes `loggedIn` boolean
- `setAuthClientToken({ token, session })` - Set auth token and session
- `clearAuthClientToken()` - Clear localStorage token only
- `clearAllAuth()` - Clear localStorage AND cookies
- `clearState()` - Clear all auth state and storage
- `getValidToken()` - Get valid JWT, refreshing if needed
- `authState` - Emitter for subscribing to auth changes
- `authClientVersion` - Emitter that updates when auth client recreates

## Server Usage

```typescript
import {
  validateToken,
  isValidJWT,
  InvalidTokenError,
} from '@take-out/better-auth-utils/server'

// validate JWT against JWKS endpoint
try {
  const payload = await validateToken(token, {
    baseUrl: 'https://myapp.com',
    forceIssuer: process.env.FORCE_ISSUER, // optional, for CI
    jwksPath: '/api/auth/jwks', // optional, default
  })
  console.log('User ID:', payload.sub)
} catch (err) {
  if (err instanceof InvalidTokenError) {
    // token invalid (malformed, expired, signature mismatch, etc)
    return Response.json({ error: 'INVALID_TOKEN' }, { status: 401 })
  }
}

// simple boolean check
const valid = await isValidJWT(token, { baseUrl: 'https://myapp.com' })
```

### Server Exports

| Export | Description |
|--------|-------------|
| `validateToken(token, options)` | Validate JWT against JWKS, returns payload |
| `isValidJWT(token, options)` | Boolean validation check |
| `InvalidTokenError` | Error thrown for invalid tokens |

### JWKS Validation

The server validates JWTs against the JWKS endpoint (`/api/auth/jwks` by default). A fresh JWKS is fetched for each validation to avoid stale key cache issues.

## License

MIT
