---
name: takeout-one-components
description: One framework components guide for navigation, layouts, and UI elements. Link, Redirect, navigation, Head, meta tags, SEO, SafeAreaView, StatusBar, device safe areas, Stack, Tabs, Slot, layout components, LoadProgressBar, ScrollBehavior.
---

# one framework: components

comprehensive guide to built-in components in one framework for navigation,
layouts, and ui enhancements.

## navigation components

### Link

type-safe navigation component for both web and native.

```tsx
import { Link } from 'one'

<Link href="/blog">go to blog</Link>
<Link href="/blog/post" replace>replace history</Link>
<Link href="https://example.com" target="_blank">external</Link>
```

**props:**

- `href` (required): typed route path
- `asChild`: forward props to child component
- `replace`: replace history instead of push
- `push`: explicitly push to history
- `className`: web class, native css interop
- `target`: web-only (\_blank, \_self, \_top, \_parent)
- `rel`: web-only (nofollow, noopener, noreferrer, etc.)
- `download`: web-only download attribute

**examples:**

```tsx
// basic navigation
<Link href="/home/profile">view profile</Link>

// dynamic routes (type-safe)
<Link href={`/user/${userId}`}>user page</Link>

// replace history
<Link href="/login" replace>login</Link>

// external link
<Link href="https://github.com" target="_blank" rel="noopener">
  github
</Link>

// as child (forward to custom component)
<Link href="/about" asChild>
  <CustomButton>about us</CustomButton>
</Link>
```

### Redirect

redirects when route is focused. uses `useFocusEffect` internally.

```tsx
import { Redirect } from 'one'

export default function Page() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Redirect href="/login" />
  }

  return <Content />
}
```

**props:**

- `href`: destination route

**note:** prefer using `~/interface/Link` over One's Link component in this project.

## ui components

### Head

control `<head>` on web and app meta on native.

```tsx
import { Head } from 'one'

export default function Page() {
  return (
    <>
      <Head>
        <title>my page title</title>
        <meta name="description" content="page description" />
        <meta property="og:image" content="/og-image.png" />
      </Head>
      <Content />
    </>
  )
}
```

can be used in any route or component. web: renders into `<head>`, native:
controls app metadata.

### SafeAreaView

re-exports from `react-native-safe-area-context`. respects device safe areas
(notches, status bars).

```tsx
import { SafeAreaView } from 'one'

export default function Page() {
  return (
    <SafeAreaView edges={['top', 'left', 'right']}>
      <Content />
    </SafeAreaView>
  )
}
```

**props:**

- `edges`: array of edges to apply safe area ('top' | 'bottom' | 'left' |
  'right')

one uses `SafeAreaProvider` from react navigation automatically.

### LoadProgressBar

web-only loading bar during page transitions.

```tsx
// app/_layout.tsx
import { LoadProgressBar, Slot } from 'one'

export default function Layout() {
  return (
    <>
      <LoadProgressBar
        startDelay={100}
        finishDelay={100}
        initialPercent={20}
        updateInterval={100}
        sporadicness={0.3}
      />
      <Slot />
    </>
  )
}
```

**props:**

- `startDelay`: delay before showing (ms)
- `finishDelay`: delay before hiding (ms)
- `initialPercent`: starting percentage (0-100)
- `updateInterval`: update frequency (ms)
- `sporadicness`: randomness factor (0-1)

### ScrollBehavior

automatic scroll restoration for web. resets to top on new page, restores
position on back/forward.

```tsx
// app/_layout.tsx
import { ScrollBehavior, Slot } from 'one'

export default function Layout() {
  return (
    <>
      <ScrollBehavior />
      <Slot />
    </>
  )
}
```

**props:**

- `disabled`: boolean | 'restore' - disable completely or only restoration

```tsx
// disable restoration, keep reset behavior
<ScrollBehavior disabled="restore" />

// disable completely
<ScrollBehavior disabled={true} />
```

## practical patterns

### safe area with scroll

```tsx
import { SafeAreaView, ScrollView } from 'one'

export default function Page() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <ScrollView>
        <Content />
      </ScrollView>
    </SafeAreaView>
  )
}
```

### progressive loading indicator

```tsx
// app/_layout.tsx
import { LoadProgressBar, Slot } from 'one'

export default function Layout() {
  return (
    <>
      <LoadProgressBar
        startDelay={200} // wait 200ms before showing
        finishDelay={300} // wait 300ms before hiding
        initialPercent={30} // start at 30%
        updateInterval={80} // update every 80ms
        sporadicness={0.4} // moderate randomness
      />
      <Slot />
    </>
  )
}
```
