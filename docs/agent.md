# Guidelines for AI Agents

## Import Patterns

Packages use barrel files (index.ts) for clean exports.

```ts
// packages/hooks/src/index.ts
export { useDebounce } from './useDebounce'

// Usage:
import { useDebounce } from '@vxrn/hooks'
```

Features use full paths. Avoid barrel files in src/features.

```ts
// Good
import { HotUpdaterSplash } from '~/features/hot-updater/HotUpdaterSplash'
import { useAuth } from '~/features/auth/client/authClient'

// Bad
import { HotUpdaterSplash } from '~/features/hot-updater'
import { useAuth } from '~/features/auth'
```

Full paths improve code navigation and make dependencies explicit.
