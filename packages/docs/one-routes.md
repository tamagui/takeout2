---
name: takeout-one-routes
description: One framework routing guide. Use when working with routing, routes, pages, navigation, app/ directory structure, file-based routing, dynamic routes [id], params, layouts, _layout.tsx, SSG, SSR, SPA static generation, loaders, data loading, Link component, or navigate.
---

# one framework: routes & routing

comprehensive routing guide for one framework covering file-system routing,
render modes, navigation, loaders, and api routes.

## file system routing

all routes live in `app/` directory. files export a react component (prefer
named exports for better hot reloading).

**important:** avoid intermediate imports in route files. instead of importing
and re-exporting, use inline re-export syntax:
`export { ComponentName as default } from '~/features/...'`

### route types

**simple routes:**

- `app/index.tsx` → `/`
- `app/about.tsx` → `/about`
- `app/blog/index.tsx` → `/blog`

**dynamic params:**

- `app/blog/[slug].tsx` → `/blog/post-one`
- access via `useParams()` → `params.slug`

**rest params:**

- `app/catalog/[...rest].tsx` → `/catalog/a/b/c`
- `params.rest = ['a', 'b', 'c']`

**not found:**

- `app/+not-found.tsx` → custom 404 pages

**groups (invisible in url):**

- `app/(blog)/` → organize without creating url segments
- useful for adding layouts without affecting routes

**platform-specific:**

- `.web.tsx`, `.native.tsx`, `.ios.tsx`, `.android.tsx`
- example: `index.web.tsx` only matches on web

### accessing params

```tsx
import { useParams } from 'one'

export function loader({ params }) {
  // server-side: params.slug available
}

export default function Page() {
  const params = useParams()
  // client-side: params.slug available
}
```

### route types generation

route types auto-generated to `app/routes.d.ts` for type-safe navigation.

## render modes

four main modes controlled by filename suffix:

### ssg (static site generation)

**suffix:** `route+ssg.tsx` **behavior:** pre-renders html/css at build time
**served from:** cdn **best for:** marketing pages, blogs, mostly static content
**notes:** can still add dynamic content after hydration

### spa (single page app)

**suffix:** `route+spa.tsx` **behavior:** no server rendering, client-only js
**best for:** dashboards, highly dynamic apps (linear, figma-style) **notes:**
simpler to build, slower initial load, worse seo

### ssr (server side rendered)

**suffix:** `route+ssr.tsx` **behavior:** renders on each request **best for:**
dynamic content needing seo (github issues-style) **notes:** most complex and
expensive, can cache on cdn with invalidation

### api routes

**suffix:** `route+api.tsx` **behavior:** creates api endpoints using web
standard request/response

```tsx
import { Endpoint } from 'one'

export const GET: Endpoint = (request) => {
  return Response.json({ hello: 'world' })
}

export const POST: Endpoint = async (request) => {
  const data = await request.json()
  return Response.json({ received: data })
}

// or catch-all default export
export default (request: Request): Response => {
  return Response.json({ hello: 'world' })
}
```

## navigation

### link component

```tsx
import { Link } from 'one'

<Link href="/blog">go to blog</Link>
<Link href="/blog/post" replace>replace history</Link>
<Link href="https://example.com" target="_blank">external</Link>
```

**link props:**

- `href`: typed route path
- `asChild`: forward props to child
- `replace`: replace history instead of push
- `push`: explicitly push to history
- `className`: web class, native css interop
- `target`: web-only (\_blank, \_self, etc.)
- `rel`: web-only (nofollow, noopener, etc.)
- `download`: web-only download attribute

### useRouter hook

```tsx
const router = useRouter()

router.push('/path') // navigate
router.replace('/path') // replace
router.back() // go back
router.canGoBack() // check history
router.setParams({ id: 5 }) // update params
router.dismiss() // native modal dismiss
```

**full api:**

```tsx
type Router = {
  back: () => void
  canGoBack: () => boolean
  push: (href: Href, options?: LinkToOptions) => void
  navigate: (href: Href, options?: LinkToOptions) => void
  replace: (href: Href, options?: LinkToOptions) => void
  dismiss: (count?: number) => void
  dismissAll: () => void
  canDismiss: () => boolean
  setParams: <T>(params?: Record<string, string | undefined | null>) => void
  subscribe: (listener: RootStateListener) => () => void
  onLoadState: (listener: LoadingStateListener) => () => void
}
```

## loaders

server-side data loading that runs at build-time (ssg), request-time (ssr), or
load-time (spa). tree-shaken from client bundles.

### basic usage

```tsx
import { useLoader } from 'one'

export async function loader({ params, path, request }) {
  // server-only code - can access secrets
  const user = await getUser(params.id)
  return { greet: `Hello ${user.name}` }
}

export default function Page() {
  const data = useLoader(loader) // automatically type-safe
  return <p>{data.greet}</p>
}
```

### loader arguments

- `params`: dynamic route segments
- `path`: full pathname
- `request`: web request object (ssr only)

### return types

- json-serializable objects
- response objects
- can throw response for early exit

### patterns

**redirect if not found:**

```tsx
export async function loader({ params: { id } }) {
  const user = await db.users.findOne({ id })
  if (!user) {
    throw redirect('/login')
  }
  return { user }
}
```

**custom response:**

```tsx
export async function loader() {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
```

## routing exports

### generateStaticParams

required for ssg routes with dynamic segments. returns array of param objects.

```tsx
// app/blog/[month]/[year]/[slug]+ssg.tsx
export async function generateStaticParams() {
  const posts = await getAllBlogPosts()
  return posts.map((post) => ({
    month: post.month,
    year: post.year,
    slug: post.slug,
  }))
}
```

## middlewares

**status:** developing

place `_middleware.ts` anywhere in `app/`. middlewares nest and run top to
bottom.

```tsx
import { createMiddleware } from 'one'

export default createMiddleware(async ({ request, next, context }) => {
  // before route
  if (request.url.includes('test')) {
    return Response.json({ middleware: 'works' })
  }

  const response = await next() // run rest of middlewares + route

  // after route
  if (!response && request.url.endsWith('/missing')) {
    return Response.json({ notFound: true })
  }

  return response
})
```

**arguments:**

- `request`: web request object
- `next`: function to run rest of chain
- `context`: mutable object for passing data

## helper functions

### redirect

```tsx
import { redirect } from 'one'

export function redirectToLogin() {
  return redirect('/login')
}

// in loader
export async function loader({ params }) {
  const user = await db.users.findOne({ id: params.id })
  if (!user) throw redirect('/login')
}
```

- server: returns response.redirect
- client: calls router.navigate

### getURL

```tsx
import { getURL } from 'one'

const url = getURL() // http://127.0.0.1:8081
```

returns current app url, uses `ONE_SERVER_URL` in production

### href

```tsx
import { href } from 'one'

const link = href('/post/hello-world') // type-checked
```

type-level validation only

## layouts

layouts frame routes in a directory and can nest inside each other. must render
one of: `Slot`, `Stack`, `Tabs`, or `Drawer`.

### root layout

```tsx
// app/_layout.tsx
import { Slot } from 'one'

export default function Layout() {
  return (
    <html lang="en-US">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <Slot />
      </body>
    </html>
  )
}
```

### useServerHeadInsertion

root layout only hook for inserting tags into `<head>` after ssr. useful for
css-in-js.

```tsx
import { Slot, useServerHeadInsertion } from 'one'

export default function Layout() {
  useServerHeadInsertion(() => {
    return <style>{renderCSS()}</style>
  })
  return (
    <html>
      <Slot />
    </html>
  )
}
```

### slot

renders children directly without frame. simplest layout option.

```tsx
import { Slot } from 'one'

export default function Layout() {
  return <Slot />
}
```

### stack

react navigation native stack. can configure per-screen.

```tsx
import { Stack } from 'one'

export default function Layout() {
  return (
    <Stack screenOptions={{ headerRight: () => <Button label="Settings" /> }}>
      <Stack.Screen name="index" options={{ title: 'Feed' }} />
      <Stack.Screen name="[id]" options={{ title: 'Post' }} />
      <Stack.Screen
        name="sheet"
        options={{
          presentation: 'formSheet',
          animation: 'slide_from_bottom',
          headerShown: false,
        }}
      />
    </Stack>
  )
}
```

**common options:**

- `presentation`: 'card' | 'modal' | 'transparentModal' | 'containedModal' |
  'containedTransparentModal' | 'fullScreenModal' | 'formSheet'
- `animation`: 'default' | 'fade' | 'fade_from_bottom' | 'flip' | 'simple_push'
  | 'slide_from_bottom' | 'slide_from_right' | 'slide_from_left' | 'none'
- `headerShown`: boolean
- `title`: string
- `headerRight`: () => ReactElement
- `headerLeft`: () => ReactElement

### tabs

react navigation bottom tabs. must set `href` on each screen.

```tsx
import { Tabs } from 'one'

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          href: '/explore',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: '/home/profile',
        }}
      />
    </Tabs>
  )
}
```

**note:** new tab routes may need `--clean` flag to show up

### drawer

**status:** early (currently disabled due to react-native-gesture-handler issue)

### nested layouts

**twitter/x pattern example:**

```
app/
  _layout.tsx          → tabs (feed, notifications, profile)
  home/
    _layout.tsx        → stack (inside feed tab)
    index.tsx          → feed list
    post-[id].tsx      → individual post
  notifications.tsx
  profile.tsx
```

**tabs layout:**

```tsx
// app/_layout.tsx
import { Tabs } from 'one'

export default function RootLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: 'Feed', href: '/' }} />
      <Tabs.Screen
        name="notifications"
        options={{ title: 'Notifications', href: '/notifications' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', href: '/home/profile' }}
      />
    </Tabs>
  )
}
```

**stack inside feed tab:**

```tsx
// app/home/_layout.tsx
import { Stack, Slot } from 'one'

export default function FeedLayout() {
  return (
    <>
      {typeof window !== 'undefined' ? (
        <Slot /> // web uses slot (browser back button is stack)
      ) : (
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Feed' }} />
          <Stack.Screen name="post-[id]" options={{ title: 'Post' }} />
        </Stack>
      )}
    </>
  )
}
```

### platform-specific layouts

```tsx
import { Stack, Slot } from 'one'

export default function Layout() {
  if (typeof window !== 'undefined') {
    return <Slot /> // web: browser navigation
  }
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  )
}
```

### custom layouts with withLayoutContext

```tsx
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation'
import { withLayoutContext } from 'one'

const NativeTabsNavigator = createNativeBottomTabNavigator().Navigator
export const NativeTabs = withLayoutContext(NativeTabsNavigator)
```

### layout limitations

- layouts don't support loaders (yet)
- `useParams` won't work in layouts
- use `useActiveParams` instead for accessing url params in layouts

## practical patterns

### modal presentation

```tsx
// app/_layout.tsx
import { Stack } from 'one'

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  )
}
```

### shared header across routes

```tsx
// app/(app)/_layout.tsx
import { Stack } from 'one'

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerRight: () => <ProfileButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  )
}
```

### bottom sheet pattern

```tsx
// app/_layout.tsx
import { Stack } from 'one'

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="sheet"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5, 1],
          sheetGrabberVisible: true,
        }}
      />
    </Stack>
  )
}
```

### basic route with data

```tsx
// app/user/[id].tsx
export async function loader({ params }) {
  const user = await db.users.find(params.id)
  if (!user) throw redirect('/404')
  return { user }
}

export default function UserPage() {
  const { user } = useLoader(loader)
  return <Text>{user.name}</Text>
}
```

### ssg with static params

```tsx
// app/blog/[slug]+ssg.tsx
export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((p) => ({ slug: p.slug }))
}

export async function loader({ params }) {
  return { post: await getPost(params.slug) }
}

export default function Post() {
  const { post } = useLoader(loader)
  return <Markdown>{post.content}</Markdown>
}
```

### api routes

```tsx
// app/api/users+api.tsx
export const GET = async (request: Request) => {
  const users = await db.users.findAll()
  return Response.json(users)
}

export const POST = async (request: Request) => {
  const data = await request.json()
  const user = await db.users.create(data)
  return Response.json(user, { status: 201 })
}
```
