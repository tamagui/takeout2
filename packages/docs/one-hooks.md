---
name: takeout-one-hooks
description: One framework hooks guide for routing, navigation, data loading, and focus management. hooks, useRouter, useParams, usePathname, useLoader, useFocusEffect, useNavigation, navigation hooks, data loading hooks, route params, query params, navigation state, screen focus management.
---

# one framework: hooks

comprehensive guide to hooks in one framework for routing, navigation, data
loading, and focus management.

## route data hooks

### useParams

returns route segment params. only updates for current route (avoids unnecessary
re-renders).

```tsx
import { useParams } from 'one'

export default function BlogPost() {
  const params = useParams()
  // params.slug for [slug].tsx routes
  // params.id for [id].tsx routes
  // params.rest for [...rest].tsx routes (array)

  return <Text>post: {params.slug}</Text>
}
```

**when to use:**

- accessing dynamic route segments
- component needs to know its own route params
- want to avoid re-renders when other routes change

**type safety:** route params are typed based on your file structure.

### useActiveParams

returns current url path segments. updates even when route isn't focused.

```tsx
import { useActiveParams } from 'one'

export default function Analytics() {
  const params = useActiveParams()
  // always reflects current url, even in parent layouts

  useEffect(() => {
    trackPageView(params)
  }, [params])

  return null
}
```

**when to use:**

- analytics tracking
- global state that depends on current route
- layouts that need to know child route params

**difference from useParams:**

- `useParams`: only updates when this route is active
- `useActiveParams`: always updates with current url

### usePathname

returns current pathname string. updates on every route change.

```tsx
import { usePathname } from 'one'

export default function NavBar() {
  const pathname = usePathname()
  // pathname = '/blog/post-slug'

  const isActive = (path: string) => pathname === path

  return (
    <Nav>
      <Link href="/" active={isActive('/')}>
        home
      </Link>
      <Link href="/blog" active={isActive('/blog')}>
        blog
      </Link>
    </Nav>
  )
}
```

**when to use:**

- highlighting active nav items
- conditional rendering based on current path
- breadcrumbs

### useLoader

returns loader data with automatic type safety. only supports loader from same
file.

```tsx
import { useLoader } from 'one'

export async function loader({ params }) {
  const post = await getPost(params.slug)
  return { post, author: await getAuthor(post.authorId) }
}

export default function BlogPost() {
  const data = useLoader(loader)
  // data is typed: { post: Post, author: Author }

  return (
    <>
      <Text>{data.post.title}</Text>
      <Text>by {data.author.name}</Text>
    </>
  )
}
```

**when to use:**

- accessing server-loaded data
- ssg/ssr/spa routes with loaders

**notes:**

- automatically type-safe based on loader return type
- only works with loader in same file
- data available after initial render

## navigation hooks

### useRouter

static object for imperative routing. never updates.

```tsx
import { useRouter } from 'one'

export default function Page() {
  const router = useRouter()

  const handleSubmit = async (data) => {
    await saveData(data)
    router.push('/success')
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <>
      <Form onSubmit={handleSubmit} />
      <Button onPress={handleBack}>back</Button>
    </>
  )
}
```

**full api:**

```tsx
type Router = {
  // navigation
  push: (href: Href, options?: LinkToOptions) => void
  navigate: (href: Href, options?: LinkToOptions) => void
  replace: (href: Href, options?: LinkToOptions) => void
  back: () => void

  // history checks
  canGoBack: () => boolean
  canDismiss: () => boolean

  // native modals
  dismiss: (count?: number) => void
  dismissAll: () => void

  // params
  setParams: (params?: Record<string, string | undefined | null>) => void

  // subscriptions
  subscribe: (listener: RootStateListener) => () => void
  onLoadState: (listener: LoadingStateListener) => () => void
}
```

**methods:**

**push / navigate:**

```tsx
router.push('/blog/new-post')
router.push(`/user/${userId}`)
router.navigate('/settings') // same as push
```

**replace:**

```tsx
router.replace('/login') // replace current history entry
```

**back:**

```tsx
router.back() // go back in history
```

**canGoBack:**

```tsx
if (router.canGoBack()) {
  router.back()
} else {
  router.push('/') // go home if can't go back
}
```

**dismiss (native only):**

```tsx
router.dismiss() // close current modal
router.dismiss(2) // close 2 modals
router.dismissAll() // close all modals
```

**setParams:**

```tsx
// update url params without navigation
router.setParams({ filter: 'active', sort: 'date' })
// /posts?filter=active&sort=date

router.setParams({ filter: undefined }) // remove param
// /posts?sort=date
```

**subscribe:**

```tsx
useEffect(() => {
  const unsubscribe = router.subscribe((state) => {
    console.info('route state changed:', state)
  })
  return unsubscribe
}, [])
```

### useLinkTo

creates custom link props. useful for building custom link components.

```tsx
import { useLinkTo } from 'one'

type LinkToProps = {
  href: Href
  replace?: boolean
}

type LinkToResult = {
  href: string
  role: 'link'
  onPress: (e?: MouseEvent | GestureResponderEvent) => void
}

export function CustomLink({ href, replace, children }) {
  const linkProps = useLinkTo({ href, replace })

  return <Pressable {...linkProps}>{children}</Pressable>
}
```

### useNavigation

direct react navigation access. lower-level than useRouter. accepts optional
parent argument.

```tsx
import { useNavigation } from 'one'

export default function Page() {
  const navigation = useNavigation()

  // access parent navigation
  const parentNav = useNavigation('/(root)')
  const grandparentNav = useNavigation('../../')

  navigation.setOptions({
    title: 'new title',
    headerRight: () => <Button />,
  })

  return <Content />
}
```

**when to use:**

- need react navigation api directly
- setting screen options dynamically
- accessing parent navigators

## focus hooks

### useFocusEffect

like useEffect but only when route is focused. must pass dependency array.

```tsx
import { useFocusEffect } from 'one'

export default function Profile({ userId }) {
  const [user, setUser] = useState(null)

  useFocusEffect(
    () => {
      // runs when screen becomes focused
      const unsubscribe = subscribeToUser(userId, setUser)

      return () => {
        // cleanup when screen loses focus
        unsubscribe()
      }
    },
    [userId], // dependencies
  )

  return <ProfileContent user={user} />
}
```

**when to use:**

- subscriptions that should only run when screen is visible
- analytics tracking on screen view
- refreshing data when returning to screen
- pausing/resuming animations

**common patterns:**

**refresh on focus:**

```tsx
useFocusEffect(() => {
  refreshData()
}, [refreshData])
```

**subscription management:**

```tsx
useFocusEffect(() => {
  const subscription = api.subscribe(userId, handleUpdate)
  return () => subscription.unsubscribe()
}, [userId])
```

**analytics:**

```tsx
useFocusEffect(() => {
  trackScreenView('profile', { userId })
}, [userId])
```

### useIsFocused

returns boolean. true if current screen is active. re-export from react
navigation.

```tsx
import { useIsFocused } from 'one'

export default function VideoPlayer() {
  const isFocused = useIsFocused()

  useEffect(() => {
    if (!isFocused) {
      pauseVideo()
    } else {
      resumeVideo()
    }
  }, [isFocused])

  return <Video />
}
```

**when to use:**

- conditional logic based on focus state
- pause/resume media playback
- conditional rendering

**vs useFocusEffect:**

- `useIsFocused`: reactive boolean value
- `useFocusEffect`: callback on focus change

## practical patterns

### protected route with redirect

```tsx
import { useAuth } from '~/hooks/useAuth'
import { useRouter } from 'one'

export default function ProtectedPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated])

  if (!isAuthenticated) return null

  return <Content />
}
```

### active nav link

```tsx
import { usePathname } from 'one'
import { Link } from 'one'

export function NavLink({ href, children }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      style={{
        color: isActive ? '$blue10' : '$gray11',
        fontWeight: isActive ? 'bold' : 'normal',
      }}
    >
      {children}
    </Link>
  )
}
```

### search params with router

```tsx
import { useRouter } from 'one'

export function SearchFilters() {
  const router = useRouter()

  const updateFilter = (key: string, value: string) => {
    router.setParams({ [key]: value })
  }

  return (
    <>
      <Select onValueChange={(v) => updateFilter('category', v)}>
        <option>all</option>
        <option>blog</option>
      </Select>
      <Select onValueChange={(v) => updateFilter('sort', v)}>
        <option>date</option>
        <option>popular</option>
      </Select>
    </>
  )
}
```

### data fetching on focus

```tsx
import { useFocusEffect } from 'one'
import { useState } from 'react'

export default function Feed() {
  const [posts, setPosts] = useState([])

  useFocusEffect(() => {
    let cancelled = false

    fetchPosts().then((data) => {
      if (!cancelled) {
        setPosts(data)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return <PostList posts={posts} />
}
```

### breadcrumbs from params

```tsx
import { useParams, usePathname } from 'one'

export function Breadcrumbs() {
  const pathname = usePathname()
  const params = useParams()

  const segments = pathname.split('/').filter(Boolean)

  return (
    <View>
      {segments.map((segment, i) => (
        <Link key={i} href={`/${segments.slice(0, i + 1).join('/')}`}>
          {params[segment] || segment}
        </Link>
      ))}
    </View>
  )
}
```

### conditional loader data

```tsx
import { useLoader } from 'one'

export async function loader({ params }) {
  const user = await getUser(params.userId)

  if (!user) {
    return { error: 'user not found' }
  }

  return {
    user,
    posts: await getUserPosts(params.userId),
  }
}

export default function UserPage() {
  const data = useLoader(loader)

  if ('error' in data) {
    return <Text>{data.error}</Text>
  }

  return (
    <>
      <UserHeader user={data.user} />
      <PostList posts={data.posts} />
    </>
  )
}
```
