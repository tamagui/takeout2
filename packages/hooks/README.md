# @takeout/hooks

collection of reusable react hooks for the takeout project.

## hooks

### useClickOutside

detect clicks outside a referenced element (web only)

```ts
useClickOutside({ ref, active, onClickOutside })
```

### useDebouncePrepend

debounce list updates when prepending items, immediate updates otherwise

```ts
const debouncedList = useDebouncePrepend(list, delay)
```

### useDeepMemoizedObject

deep memoization with optional immutable field tracking

```ts
const memoized = useDeepMemoizedObject(value, {
  immutableToNestedChanges: { 'path.to.field': true },
})
```

### useDeferredBoolean

defer boolean state updates using react transitions

```ts
const deferredValue = useDeferredBoolean(value)
```

### useEffectOnceGlobally

run effect once globally across all component instances, keyed by id

```ts
useEffectOnceGlobally(key, (value) => {
  // runs once per unique key
})
```

### useIsMounted

returns true after component mounts

```ts
const isMounted = useIsMounted()
```

### useLastValue

returns previous value from last render

```ts
const previousValue = useLastValue(currentValue)
```

### useLastValueIf

conditionally keep last value based on boolean

```ts
const value = useLastValueIf(currentValue, shouldKeepLast)
```

### useMemoizedObjectList

memoize list items by identity key, prevents unnecessary re-renders when zero
mutates objects

```ts
const memoizedList = useMemoizedObjectList(list, 'id')
```

### useMemoStable

useMemo with warnings when dependencies change too often (development only)

```ts
const value = useMemoStable(() => expensiveComputation(), deps, {
  name: 'myMemo',
  maxChanges: 5,
})
```

### useThrottle

throttle function calls

```ts
const throttledFn = useThrottle(fn, delay)
```

### useWarnIfDepsChange

warn when dependencies change too often (development only)

```ts
useWarnIfDepsChange(deps, {
  name: 'myEffect',
  maxChanges: 5,
})
```

### useWarnIfMemoChangesOften

warn when memoized value changes frequently (development only)

```ts
useWarnIfMemoChangesOften(value, threshold, 'valueName')
```
