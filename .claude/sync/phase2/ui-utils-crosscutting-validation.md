# Validation: Interface/UI + Shared Utils + Cross-Cutting

## Confirmed Findings

### Tamagui Config
- CONFIRMED: takeout uses `@tamagui/themes/v5` (createV5Theme), chat uses `@tamagui/themes/v5-subtle` with custom `getTheme` callback adding interpolated `color1pt5`/`color2pt5`/`color3pt5` and hardcoded yellow-light palette
- CONFIRMED: takeout uses `animationsRoot` (CSS-only), chat uses dual-driver `{ default: animationsMotion, css: animationsCSS }`
- CONFIRMED: chat adds custom media queries (`max-lg2`/`lg2` at 948px) and `animationDrivers()` type override
- CONFIRMED: takeout does NOT have `opacify.ts`, `breakpoints.ts`, or `animations-css.ts` in `src/tamagui/`
- CONFIRMED: `@tamagui/themes/v5-subtle`, `@tamagui/config/v5-css`, `@tamagui/config/v5-motion` are all installed in takeout's node_modules (available at `2.0.0-rc.15`)

### Button Component
- CONFIRMED: massive diff between the two. Chat adds `action` prop (confirm/create/destroy/default) with theme mapping, removes `glass`/`haptic`/`isInteractive`/`keepTooltipOpen`/`glassTint` props, removes `IS_SAFARI` import, removes `isNative`/native-only glass wrapping, splits background into `ButtonBackgroundLight`+`ButtonBackgroundDark` (theme-dependent display:none), extracts constants to `constants.tsx`, adds `memo()` wrapping, uses `$background0` bg instead of `transparent`, uses `isolation: isolate` on web, changes disabled opacity from 0.5 to 0.1, removes `xxl` size, removes `elevated` variant, adds `transparent-hoverable` and `flat` variants, uses `$color10` default text color (not `$color12`), adds `z: 1` on ButtonText, removes `fontWeight: '600'` from text, changes import from `@tamagui/helpers-icon` to `~/interface/icons/types`
- CONFIRMED: chat `ButtonFrame` is exported (not just internal), enables external use

### Dialog Component
- CONFIRMED: chat Dialog adds `FadedContent` integration (via Provider wrapper + Header/Footer/Contents sub-components), `DialogStyledContext` for variant-based styling (`default` | `full-scroll`), shake animation on non-dismissable dismiss attempts, `keepMounted`/`dismissable`/`disablePadding`/`variant`/`width`/`height`/`maxW` props, removes `Separator` and `Spacer` imports in favor of `../dividers/Separator`, removes `useHandleEscapeIf` and `useSafeAreaInsets`, uses `animationClamped` for transition, adds grain texture layer, adds a `Dialog.Contents` sub-component
- CONFIRMED: takeout already has `useHandleEscapeIf` in `src/features/shortcuts/handleKeyboardEscape.ts` and `BlurView` -- chat removed both dependencies from Dialog

### Tooltip
- CONFIRMED: chat adds `setAllTooltipsDisabled()`, `disableAllTooltips` prop, `useLayoutEffect` replacing `useEffect`+`useRef`, removes `onMouseLeave` from trigger (relies on global provider for close), uses dark glass style (`bg="$black08"`, `backdropFilter="blur(10px)"`), adds `animatePosition`, removes `allowFlip`/`stayInFrame` from `wrapWithTooltip`, removes `Z_INDICES` usage, wraps `GlobalTooltipProvider` in `memo()`, adds `'use no memo'` directives
- CONFIRMED: both codebases share the same `popoverEmitter` pattern and `closeOpenTooltips`

### Glint
- CONFIRMED: chat uses named export `export const Glint`, takeout uses `export default Glint`
- CONFIRMED: chat uses `position: 'absolute'` + `inset: 0` instead of `fullscreen: true`
- CONFIRMED: chat uses `$highlight1` border color vs `$white` in takeout
- CONFIRMED: chat uses `z: 100_000_000` vs `z: 10` in takeout
- CONFIRMED: chat uses `opacity: 0.5` dark theme vs `opacity: 0.1` in takeout
- CONFIRMED: chat removes `isNative` import and side borders, uses `$platform-native` variant instead
- CONFIRMED: chat uses `boxShadow` string syntax for bottomShadow instead of `shadowRadius`/`shadowOffset`/`shadowColor`

### Helpers
- CONFIRMED: `clearAllDataAndStorages.ts` -- path difference: takeout has it at `src/helpers/storage/clearAllDataAndStorages.ts`, chat has it at `src/helpers/clearAllDataAndStorages.ts`. Bug fixes are real: `deleteReq.error ?? new Error(...)` null guard and `substr` -> `substring`
- CONFIRMED: `formatDuration.ts` does NOT exist in takeout, is a clean zero-dep utility in chat
- CONFIRMED: `openPopout.ts` does NOT exist in takeout, depends on `isTauri` from `@take-out/helpers` (available)
- CONFIRMED: `extractOpacityFromColor.ts` does NOT exist in takeout, zero deps, has dev-mode console.warn guard
- CONFIRMED: `debug.ts` does NOT exist in takeout, depends on `debug` npm package (available transitively but NOT in takeout's package.json)
- CONFIRMED: `src/helpers/color/` directory does NOT exist in takeout at all

### PostHog
- CONFIRMED: chat completely replaced the class-based `PostHog` in `posthog.ts` with a simple module-level `setPostHogInstance` pattern, removing `DEBUG_LEVEL` dependency and lazy-loading
- CONFIRMED: chat's `PostHogInstance` type removes `isFeatureEnabled`, `getFeatureFlag`, `reloadFeatureFlags` -- takeout's type still has them
- CONFIRMED: chat's `instance.ts` and `instance.native.ts` remove feature flag methods from the implementation classes
- CONFIRMED: the blank line removal in `instance.ts` and `instance.native.ts` is real (line 2 blank line between import and type import)

### New Components
- CONFIRMED: `FadedContent` exists at `chat/src/interface/scroll/FadedContent.tsx`, 337 lines, composable with `Provider`/`Header`/`Footer`/`Content` sub-components. Takeout has NO equivalent
- CONFIRMED: `Separator` exists at `chat/src/interface/dividers/Separator.tsx`, styled wrapper with platform-specific defaults. Takeout only has `LinearGradientSeparator` in `src/interface/separators/`
- CONFIRMED: `sizes.ts` exists at `chat/src/interface/sizes.ts`, simple `SimpleSize` type and `getSimpleSize` utility. Takeout has no equivalent
- CONFIRMED: `ErrorBoundary` exists at `chat/src/interface/utils/ErrorBoundary.tsx`. Takeout has `handleError` at `src/features/errors/handleError.ts` and `showNotification` -- both dependencies are available
- CONFIRMED: `RenderChildrenWhenIdle` exists at `chat/src/interface/utils/RenderChildrenWhenIdle.tsx`. Depends on `useLazyMount` from `@take-out/helpers` (available)
- CONFIRMED: `Notice` at `chat/src/interface/notice/Notice.tsx` -- 15-line styled component, zero deps beyond tamagui
- CONFIRMED: `Pill` at `chat/src/interface/pill/Pill.tsx` -- depends on `Tooltip` from `~/interface/tooltip/Tooltip`

## Corrections

### Phase 1 Report Errors

1. **fuzzySearch.ts DOES NOT EXIST in takeout** -- Phase 1 says "Takeout already has this file at the same path with identical logic". This is WRONG. No `fuzzySearch` file exists anywhere in takeout's `src/helpers/`. The SYNC item is invalid for takeout.

2. **generateRandomAvatar.ts DOES NOT EXIST in takeout** -- Phase 1 says "Takeout has this file -- same content modulo trailing commas". WRONG. No such file exists in takeout. The lint fix SYNC item is invalid.

3. **tauri/download.ts DOES NOT EXIST in takeout** -- Phase 1 says "Takeout has this file under src/helpers/" and suggests checking tauri/ subdir. WRONG. No download helper exists in takeout's helpers at all. The SYNC item is invalid.

4. **clearAllDataAndStorages path is different** -- Phase 1 correctly notes the path difference but implies sync is straightforward. The actual paths are: takeout `src/helpers/storage/clearAllDataAndStorages.ts` vs chat `src/helpers/clearAllDataAndStorages.ts`. The bug fixes should be applied to the takeout-path file.

5. **PostHog instance blank-line claim is overstated** -- Phase 1 says "removed one blank line after the import in each file". Actually, the change is removing the blank line between `import posthog from 'posthog-js'` and `import type { PostHogInstance } from './types'` (consolidating import block). Additionally, the instance files have MUCH larger changes: feature flag methods were completely removed from both `instance.ts` and `instance.native.ts`.

6. **Button refactor is more invasive than Phase 1 suggests** -- Phase 1 categorizes it as ADAPT. This is correct but understates the scope. The chat Button removes ALL native-specific code (glass, haptics, GlassView, IS_SAFARI, isAndroid, Platform import), which are features takeout actively uses on native. A direct merge would break native functionality.

7. **`animationClamped.ts` difference not mentioned** -- Chat has additional entries in the `springToTime` map (`bouncy`, `superBouncy`, `medium`, `slow`, `slowest`, `lazy`, `superLazy`). This is a prerequisite for the Tooltip and Dialog changes that reference these animation names.

## Conflicts Found

### HIGH RISK

1. **Button: native functionality removal** -- Chat removed `glass`, `haptic`, `GlassView`, `IS_SAFARI`, `isAndroid`, `Platform`, `isNative` from Button. Takeout's Button actively uses all of these for native app support. The chat Button is web-only. Merging chat's Button would break takeout's native builds. Files: `/Users/n8/takeout/src/interface/buttons/Button.tsx`

2. **PostHog: feature flag removal** -- Chat removed `isFeatureEnabled`, `getFeatureFlag`, `reloadFeatureFlags` from both the type interface and all implementations. Takeout's `posthog.ts` class and `instance.ts`/`instance.native.ts` all implement these methods. Any consumers of feature flags in takeout would break. Files: `/Users/n8/takeout/src/posthog/posthog.ts`, `/Users/n8/takeout/src/posthog/types.ts`, `/Users/n8/takeout/src/posthog/instance.ts`, `/Users/n8/takeout/src/posthog/instance.native.ts`

3. **Dialog: FadedContent dependency** -- Chat's Dialog wraps everything in `FadedContent.Provider` and uses `FadedContent.Header`/`Footer`/`Content`. This component doesn't exist in takeout. Must add FadedContent BEFORE Dialog changes. Files: `/Users/n8/takeout/src/interface/dialogs/Dialog.tsx`

4. **Dialog: useHandleEscapeIf removal** -- Chat's Dialog removed `useHandleEscapeIf` and `useSafeAreaInsets`. Takeout uses `useHandleEscapeIf` for escape key handling. This is a functional regression if removed. File: `/Users/n8/takeout/src/interface/dialogs/Dialog.tsx`

5. **Themes: v5 -> v5-subtle** -- Switching from `createV5Theme()` to `createV5Theme()` from `v5-subtle` changes color values across the entire app. The `componentThemes: false` option in chat also removes component-level theme definitions. The yellow-light hardcoded palette and interpolated midpoint colors are chat-specific visual choices. This is a visual breaking change across the entire UI. File: `/Users/n8/takeout/src/tamagui/themes.ts`

6. **Themes: client optimization difference** -- Takeout uses `process.env.VITE_ENVIRONMENT === 'client' ? ({} as typeof themesJS) : themesJS` for client-side optimization. Chat uses `process.env.VITE_ENVIRONMENT === 'client' ? ({} as never) : createV5Theme(...)`. Different approach to the same optimization -- must choose one.

### MEDIUM RISK

7. **Tooltip: dark glass style** -- Chat uses `bg="$black08"` + `backdropFilter="blur(10px)"` on tooltip content. Takeout uses `theme="accent"` with theme-based shadow styling. This is a visual design change, not just a code change. File: `/Users/n8/takeout/src/interface/tooltip/Tooltip.tsx`

8. **Glint: z-index from 10 to 100_000_000** -- This massive z-index increase could cause stacking issues with other elements. File: `/Users/n8/takeout/src/interface/effects/Glint.tsx`

9. **Button: `$color10` text default** -- Chat uses `$color10` as default button text color, takeout uses `$color12`. This is a visible style regression across all buttons.

10. **animationClamped: missing keys** -- Several chat components reference animation keys (`bouncy`, `medium`, `slow`, etc.) that aren't in takeout's `animationClamped` `springToTime` map. Must sync `animationClamped.ts` BEFORE syncing Tooltip or Dialog.

## Already Applied

1. **`crypto/polyfill.native.ts` and `crypto/polyfill.ts`** -- identical in both codebases
2. **`closeOpenTooltips.ts`** -- identical in both codebases
3. **`interface/icons/types.ts`** -- identical in both codebases (though import paths differ: takeout's Button uses `@tamagui/helpers-icon`, chat uses `~/interface/icons/types`)
4. **`@tamagui/themes` v5 / v5-subtle packages** -- both available in node_modules
5. **`@tamagui/config/v5-css` and `v5-motion`** -- both installed

## Missing Dependencies

### Must add before syncing

1. **`debug` npm package** -- Not in takeout's `package.json` (only transitive). Required for `createDebugger` utility. Must `bun add debug && bun add -D @types/debug`.

2. **`FadedContent` component** -- Must exist at `src/interface/scroll/FadedContent.tsx` before Dialog refactor can proceed. Currently does not exist in takeout.

3. **`DialogStyledContext`** -- Must exist at `src/interface/dialogs/DialogContext.ts` before Dialog refactor.

4. **`FormContext`** -- Must exist at `src/interface/forms/FormContext.ts` before Input or LabeledGroup refactor.

5. **`../dividers/Separator`** -- Chat's Dialog imports from `../dividers/Separator`. Takeout has no `dividers/` directory. Must add Separator component first.

6. **`./constants` for buttons** -- Chat's Button imports from `./constants.tsx`. Must add `src/interface/buttons/constants.tsx`.

7. **`animationClamped` additional entries** -- Must add `bouncy`, `superBouncy`, `medium`, `slow`, `slowest`, `lazy`, `superLazy` to `springToTime` map before syncing components that reference them.

### Already available

- `@take-out/helpers` (isTauri, createEmitter, useEmitterValue, useLazyMount, etc.)
- `handleError` at `src/features/errors/handleError.ts`
- `showNotification` at `src/interface/notification/Notification.tsx`
- All tamagui packages
- `popoverEmitter` pattern

## Risk Assessment

### CRITICAL (do not sync without careful planning)
- **Themes v5 -> v5-subtle**: visual impact across entire app. Requires screenshot comparison testing. Risk: HIGH.
- **Button refactor**: removes native support (glass, haptics). Cannot be directly synced if takeout has active native users. Risk: HIGH.
- **PostHog refactor**: removes feature flags. Must verify no takeout code calls `isFeatureEnabled`/`getFeatureFlag`/`reloadFeatureFlags`. Risk: HIGH.

### HIGH (significant changes, test thoroughly)
- **Dialog refactor**: large dependency chain (FadedContent -> DialogStyledContext -> Separator -> animationClamped). Risk: MEDIUM-HIGH.
- **Tooltip dark glass style**: visual change. Risk: MEDIUM.
- **Glint z-index 100M**: stacking order. Risk: MEDIUM.
- **Animation config (dual driver)**: architectural change to how animations work. Risk: MEDIUM.

### MODERATE (worth syncing, test lightly)
- New components: FadedContent, Separator, sizes.ts, ErrorBoundary, Notice, Pill, RenderChildrenWhenIdle
- animationClamped additional entries
- clearAllDataAndStorages bug fixes

### LOW (safe to sync directly)
- `formatDuration.ts` (new file, zero deps)
- `extractOpacityFromColor.ts` (new file, zero deps)
- `opacify.ts` (new file in tamagui/, zero new deps)
- `breakpoints.ts` (new file in tamagui/, zero deps)
- PostHog instance blank-line cleanups (cosmetic only -- but NOTE the feature flag removal is NOT cosmetic)

## Cross-Cutting Concerns

### 1. Import Path Patterns
Both codebases use `~/` for project-root imports. The pattern is consistent. However:
- Takeout's Button imports `IconProps` from `@tamagui/helpers-icon`; chat imports from `~/interface/icons/types`. The local types file is identical in both, so the chat pattern (local import) is better for decoupling.
- Chat's `clearAllDataAndStorages.ts` lives at `src/helpers/` (flat); takeout's at `src/helpers/storage/` (nested). The chat location would need to stay at takeout's existing path.

### 2. The `over-zero` -> `on-zero` Rename
- **takeout**: Only 1 hit for `over-zero` (in changelog docs). But 32 files reference `on-zero` -- this rename is ALREADY DONE in takeout.
- **chat**: 0 files reference `over-zero`, 160+ files reference `on-zero` -- also done.
- **STATUS**: Already aligned. No action needed.

### 3. `server-only` Usage
- **takeout**: 5 files use `server-only` import -- very limited.
- **chat**: 5 files use `server-only` import -- also limited.
- Both use it in the same pattern (top-of-file import). No gap.

### 4. `memo()` Adoption Gap
- **takeout**: ~9 interface component files use `memo`.
- **chat**: ~36 interface component files use `memo`.
- Chat has 4x more memo usage. This is a gradual alignment -- individual component syncs should each add memo where chat has it. Not a blocker.

### 5. Named Exports vs Default Exports
- **takeout**: 3 files use `export default` in `src/interface/`: `haptics.ts`, `Glint.tsx`, `DialogOnboard.tsx`
- **chat**: 1 file uses `export default` in `src/interface/`: `haptics.ts`
- **Gap**: Glint.tsx needs to switch from `export default Glint` to `export const Glint`. This affects 4 import sites in takeout:
  - `src/interface/buttons/Button.tsx`
  - `src/interface/notification/Notification.tsx`
  - `src/features/onboarding/Onboarding.tsx`
  - `src/features/onboarding/OnboardingSlide.tsx`
- DialogOnboard.tsx was not changed in chat (still default export in takeout only).

### 6. Fonts Are Completely Different
- **takeout**: extends `@tamagui/config/v5` base fonts, adds mono font
- **chat**: completely custom `body` font (system font stack with explicit size/lineHeight tables), custom `martian`/`martianXWd` heading fonts with width scaling
- This is intentionally app-specific. DO NOT sync fonts.

### 7. CSS Token Availability
- `$highlight1`, `$black08`, `$color005`, `$background0`, `$shadow2`, `$shadow3`, `$shadow4` -- all exist in takeout's generated CSS from v5 themes. Chat's component styles using these tokens will work in takeout.

### 8. `animationClamped` Dependency Chain
Chat's Tooltip uses `animationClamped('quickerLessBouncy')` and Dialog uses `animationClamped('quickestLessBouncy')` and `animationClamped('quick')`. All three keys exist in BOTH codebases. However, syncing chat's animationClamped with the additional keys (`bouncy`, `medium`, `slow` etc.) is needed if any OTHER future synced component uses them.

### 9. `withStaticProperties` Usage
Both codebases use `withStaticProperties` for compound components (Button, Dialog). This is aligned.

### 10. `'use no memo'` Directives
Chat's Tooltip has `'use no memo'` directives. This is a React Compiler hint. Takeout's Tooltip does not have these. Adding them is safe (no-op without compiler) but signals intent.

## Precise Diffs Needed

### 1. clearAllDataAndStorages bug fixes (SAFE)
File: `/Users/n8/takeout/src/helpers/storage/clearAllDataAndStorages.ts`

BEFORE (line 21):
```ts
            deleteReq.onerror = () => reject(deleteReq.error)
```
AFTER:
```ts
            deleteReq.onerror = () =>
              reject(deleteReq.error ?? new Error('failed to delete database'))
```

BEFORE (line 48):
```ts
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
```
AFTER:
```ts
    const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie
```

### 2. animationClamped additional keys (SAFE)
File: `/Users/n8/takeout/src/interface/animations/animationClamped.ts`

BEFORE (lines 6-13):
```ts
const springToTime: Partial<Record<TransitionKeys, TransitionKeys>> = {
  quickLessBouncy: '300ms',
  quick: '200ms',
  quicker: '100ms',
  quickerLessBouncy: '200ms',
  quickest: '75ms',
  quickestLessBouncy: '75ms',
}
```
AFTER:
```ts
const springToTime: Partial<Record<TransitionKeys, TransitionKeys>> = {
  quickLessBouncy: '300ms',
  quick: '200ms',
  quicker: '100ms',
  quickerLessBouncy: '200ms',
  bouncy: '250ms',
  quickest: '75ms',
  quickestLessBouncy: '75ms',
  superBouncy: '400ms',
  medium: '400ms',
  slow: '500ms',
  slowest: '500ms',
  lazy: '500ms',
  superLazy: '500ms',
}
```

### 3. Glint named export + style updates (MEDIUM - requires updating 4 import sites)
File: `/Users/n8/takeout/src/interface/effects/Glint.tsx`

BEFORE:
```ts
import { isNative } from '@take-out/helpers'
import { styled, YStack } from 'tamagui'

const Glint = styled(YStack, {
  fullscreen: true,
  pointerEvents: 'none',
  borderTopWidth: 0.5,
  borderColor: '$white',
  // Workaround for native
  ...(isNative && {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  }),

  z: 10,

  '$theme-dark': {
    opacity: 0.1,
  },
  ...
})

export default Glint
```
AFTER:
```ts
import { styled, YStack } from 'tamagui'

export const Glint = styled(YStack, {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',

  borderTopWidth: 0.5,
  borderTopColor: '$highlight1',
  borderLeftColor: 'transparent',
  borderRightColor: 'transparent',
  borderBottomColor: 'transparent',

  '$platform-native': {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
  },

  z: 100_000_000,

  '$theme-dark': {
    opacity: 0.5,
  },

  '$theme-light': {
    opacity: 0.8,
  },

  variants: {
    bottomShadow: {
      true: {
        '$theme-dark': {
          boxShadow: '0 0.5px 0.5px 1px $shadow4',
        },
        '$theme-light': {
          boxShadow: '0 0.5px 2px $shadow3',
        },
      },
    },
  } as const,
})
```
Import sites to update (change `import Glint from` to `import { Glint } from`):
- `/Users/n8/takeout/src/interface/buttons/Button.tsx`
- `/Users/n8/takeout/src/interface/notification/Notification.tsx`
- `/Users/n8/takeout/src/features/onboarding/Onboarding.tsx`
- `/Users/n8/takeout/src/features/onboarding/OnboardingSlide.tsx`

NOTE: z-index 100_000_000 may cause stacking issues -- validate visually.

### 4. New file: formatDuration.ts (SAFE)
File: `/Users/n8/takeout/src/helpers/formatDuration.ts` (new file)

```ts
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const rem = Math.round(s % 60)
  return `${m}m${rem}s`
}
```

### 5. New file: extractOpacityFromColor.ts (SAFE)
File: `/Users/n8/takeout/src/helpers/color/extractOpacityFromColor.ts` (new file, new dir)

```ts
export function extractOpacityFromColor(color: string): number {
  if (color === 'transparent') return 0

  const hexMatch = color.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/)
  if (hexMatch) {
    const [, _rgb, alphaHex] = hexMatch
    if (alphaHex) {
      const alpha = parseInt(alphaHex, 16)
      return alpha / 255
    }
    return 1
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn(`Unsupported color format: ${color}`)
  }
  return 1
}
```

### 6. New file: opacify.ts (SAFE)
File: `/Users/n8/takeout/src/tamagui/opacify.ts` (new file)

Exact copy from `/Users/n8/chat/src/tamagui/opacify.ts` -- 35 lines, depends only on `tamagui` ColorTokens type.

### 7. New file: breakpoints.ts (SAFE)
File: `/Users/n8/takeout/src/tamagui/breakpoints.ts` (new file)

Exact copy from `/Users/n8/chat/src/tamagui/breakpoints.ts` -- 22 lines, zero deps.

### 8. New file: sizes.ts (SAFE)
File: `/Users/n8/takeout/src/interface/sizes.ts` (new file)

Exact copy from `/Users/n8/chat/src/interface/sizes.ts` -- 13 lines, zero deps.

### 9. New file: Separator.tsx (SAFE)
File: `/Users/n8/takeout/src/interface/dividers/Separator.tsx` (new file, new dir)

Exact copy from `/Users/n8/chat/src/interface/dividers/Separator.tsx` -- 12 lines, depends only on tamagui.

### 10. New file: RenderChildrenWhenIdle.tsx (SAFE)
File: `/Users/n8/takeout/src/interface/utils/RenderChildrenWhenIdle.tsx` (new file)

Exact copy from `/Users/n8/chat/src/interface/utils/RenderChildrenWhenIdle.tsx` -- 12 lines, depends on `useLazyMount` from `@take-out/helpers` (available).

---

## Recommended Sync Order

Phase A (safe, no deps, no conflicts):
1. `formatDuration.ts`
2. `extractOpacityFromColor.ts` (+ create `src/helpers/color/` dir)
3. `opacify.ts` (in tamagui/)
4. `breakpoints.ts` (in tamagui/)
5. `sizes.ts` (in interface/)
6. `Separator.tsx` (+ create `src/interface/dividers/` dir)
7. `Notice.tsx` (+ create `src/interface/notice/` dir)
8. `RenderChildrenWhenIdle.tsx` (in interface/utils/)
9. `clearAllDataAndStorages.ts` bug fixes
10. `animationClamped.ts` additional keys

Phase B (safe but requires import updates):
11. Glint refactor (named export + style changes + update 4 import sites)

Phase C (new components with some deps):
12. `FadedContent.tsx` (+ create `src/interface/scroll/` dir)
13. `ErrorBoundary.tsx` (depends on handleError + showNotification, both available)
14. `Pill.tsx` (depends on Tooltip)
15. `FormContext.ts`, `forms/constants.ts` (form primitives)

Phase D (major refactors, need careful testing):
16. Tooltip refactor (visual change, test manually)
17. Dialog refactor (needs FadedContent, DialogStyledContext, Separator)
18. Button refactor (CAUTION: do not remove native support)
19. Menu types.ts (worth syncing type hierarchy, skip Menu.tsx)
20. PostHog refactor (CAUTION: preserve feature flag support)
21. Tamagui config changes (themes v5-subtle, dual animation driver, media queries)
