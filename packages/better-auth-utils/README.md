# @tamatko/better-auth-utils

Better Auth utilities and helpers for React/React Native applications.

## Features

- JWT support for Zero, Tauri, and React Native
- Session persistence in local storage
- Token validation and refresh
- State management with emitters
- Automatic retry on authentication errors
- TypeScript support with full type safety

## Installation

```bash
bun add @tamatko/better-auth-utils
```

## Usage

### Basic Setup

```typescript
import { createBetterAuthClient } from '@tamatko/better-auth-utils'
import { adminClient, magicLinkClient } from 'better-auth/client/plugins'

const authClient = createBetterAuthClient({
  baseURL: 'https://your-app.com',
  plugins: [adminClient(), magicLinkClient()],
  // Optional callbacks
  onAuthStateChange: (state) => {
    console.info('Auth state changed:', state)
  },
  onAuthError: (error) => {
    console.error('Auth error:', error)
  },
})

// Export for use throughout your app
export const {
  authClient,
  useAuth,
  getAuth,
  setAuthClientToken,
  clearAuthClientToken,
} = authClient
```

### Using in React Components

```tsx
import { useAuth } from './auth'

function UserProfile() {
  const { user, state } = useAuth()

  if (state === 'loading') return <div>Loading...</div>
  if (state === 'logged-out') return <div>Please log in</div>

  return <div>Welcome, {user?.name}!</div>
}
```

### Custom User Types

```typescript
import type { User } from '@tamatko/better-auth-utils'

interface MyUser extends User {
  role?: 'admin' | 'user'
  preferences?: {
    theme: 'light' | 'dark'
  }
}

const authClient = createBetterAuthClient<any, MyUser>({
  baseURL: 'https://your-app.com',
})
```

### Configuration Options

- `baseURL` - The base URL for your auth server
- `plugins` - Array of better-auth plugins
- `onAuthStateChange` - Callback when auth state changes
- `onAuthError` - Callback for handling auth errors
- `storagePrefix` - Prefix for local storage keys (default: 'auth')
- `retryDelay` - Delay in ms after auth errors (default: 4000)
- `tokenValidationEndpoint` - Custom token validation endpoint (default:
  '/api/auth/validateToken')

## API

### `createBetterAuthClient(options)`

Creates a new authentication client with the provided options.

### `useAuth()`

React hook that returns the current authentication state.

### `getAuth()`

Gets the current authentication state (non-reactive).

### `setAuthClientToken({ token, session })`

Sets the authentication token and session.

### `clearAuthClientToken()`

Clears the stored authentication token.

### `clearState()`

Clears all authentication state and storage.

## Development

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Run in watch mode
bun run watch

# Lint the code
bun run lint:fix
```

## License

MIT
