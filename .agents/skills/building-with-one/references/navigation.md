# Navigation

[Link](https://onestack.dev/docs/components-Link), [useRouter](https://onestack.dev/docs/hooks-useRouter), [Protected](https://onestack.dev/docs/components-Protected).

```tsx
import { Link, useRouter } from 'one'

<Link href="/settings">Settings</Link>
<Link href="/settings" asChild><Pressable><Text>Settings</Text></Pressable></Link>

const router = useRouter()
router.push('/settings')
router.replace('/login')
router.navigate('/feed')
router.back()
router.setParams({ sort: 'new' })
```

Use the static `router` export outside React. `canGoBack`, `dismiss`, `dismissAll`, and `canDismiss` support stack/modal navigation. Hooks such as `usePathname` subscribe to route changes; the router object itself is stable. Clean up `router.subscribe` listeners with the returned unsubscribe function.

`useLinkTo({ href, replace })` supplies props for custom links. `Link` supports `replace`, `push`, and `asChild`. Web supports normal anchor props, route masking (`mask`), and `scroll={false}`. Imperative masking uses `{ mask: { href: '/displayed/path' } }`. Link prefetch strategy is configured in `web.linkPrefetch`.

## Protecting routes and data

`Protected guard={condition}` inside a navigator removes its wrapped screens when false. It controls navigation, not server authorization. `<Redirect href="/login" />` is useful in a layout after session loading completes. Server loaders and endpoints must authorize access independently.

For SSR data guards, `throw redirect('/login')` or `return redirect('/login')` from the loader. One translates redirects during client navigation into redirect metadata before rendering. Use `private, no-store` for personalized loader responses.

## Typed search navigation

`useSearchParams()` returns a read-only URLSearchParams. `useSearchParams(schema)` returns `[values, update]`; see [hooks](hooks.md). Prefer `Link searchParams={{ tags: ['a', 'b'] }}` for repeated query keys. Arrays in `href.params` use comma joining and do not round-trip as repeated keys. Typed route discovery needs exported schemas reachable through static imports.
