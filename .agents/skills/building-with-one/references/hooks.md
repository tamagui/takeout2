# Hooks

Import router hooks from `one`. Read the individual [hook references](https://onestack.dev/docs/hooks-useRouter) for the installed API.

| Hook | Use |
| --- | --- |
| `useParams` | Focused route's decoded dynamic and search params |
| `useActiveParams` | Params of the globally active route |
| `usePathname` | Resolved pathname without query/hash |
| `useSegments` | File-route segments, including bracket names |
| `useSearchParams` | Read-only query object, or schema-validated query values |
| `useLoader`, `useLoaderState` | Loader data, manual refetch, and idle/loading state |
| `useMatches`, `useMatch`, `usePageMatch` | Matched route and loader data |
| `useNavigation` | React Navigation access, including `setOptions` and parent navigators |
| `useFocusEffect`, `useIsFocused` | Focus-scoped subscriptions and focused state |
| `useBlocker` | Unsaved-change navigation blocking |
| `useTabs`, `useStack`, `useDrawer` | Headless web navigator state |
| `useScrollGroup` | Shared web scroll position for a layout's children |

`useFocusEffect(effect, dependencies)` accepts a dependency array directly. Return the subscription cleanup. `useBlocker` reports `unblocked`, `blocked`, or `proceeding`; a blocked navigation can be `reset()` or `proceed()`.

## Typed search params

```tsx
import { useSearchParams } from 'one'
import { z } from 'zod'

export const query = z.object({ page: z.coerce.number().default(1) })

export function Pagination() {
  const [{ page }, update] = useSearchParams(query)
  return <button onClick={() => update({ page: page + 1 })}>Next</button>
}
```

The schema must implement synchronous Standard Schema validation. Query inputs are strings or repeated-key string arrays. Path params and hash are excluded. `update(partial, { replace: true })` merges query keys; `null` or `undefined` removes a key. Invalid input throws `SearchValidationError` to the nearest error boundary. The no-schema form returns URLSearchParams; `{ global: true }` observes the active route.

One discovers exported schemas through static imports for typed `Link searchParams` and SSR loader `searchParams`. Inline schemas and dynamic imports are not discoverable. SSR document requests, client navigation and refetch validate before loader execution; an invalid query returns 400. SSG and SPA do not receive this validated loader query. See [search params](https://onestack.dev/docs/hooks-useSearchParams).

`useLoader(loader)` belongs with its route loader; use `useMatches` to read other matched loaders. Layout data is `unknown` until narrowed. `useLoaderState()` without an argument shares the current route's refetch and state. Imperative `refetchLoader(path)` works outside React. See the installed `one-loaders` skill for query keys and cache behavior.
