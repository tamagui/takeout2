# Interface & UI Components Analysis

## Summary

~492 commits touching src/interface/ and src/tamagui/. Major theme/animation system overhaul, significant component refactors, and many new generic components.

## src/tamagui/ Changes

- Animation files renamed: `animationsRoot.ts` → `animations.ts`, exports dual-driver object `{ default: animationsMotion, css: animationsCSS }` enabling `animatedBy="css"` on components
- New `animations-css.ts` thin re-export of `@tamagui/config/v5-css`
- `themes.ts` switches to `@tamagui/themes/v5-subtle`, adds custom `getTheme` callback with interpolated midpoint colors (`color1pt5`, `color2pt5`, `color3pt5`) and hardcoded yellow-light palette
- `tamagui.config.ts` adds custom media queries (`max-lg2`/`lg2` at 948px), dual animation driver wiring, `animationDrivers()` type override
- New `opacify.ts` — color opacity utility (hex + HSL support)
- New `breakpoints.ts` — reference constants for breakpoints

## Major Component Refactors

- **Button**: `action` prop (`confirm/create/destroy/default`) replaces `variant='action'`; constants extracted to `constants.tsx`; background split into `ButtonBackgroundLight` + `ButtonBackgroundDark`; glass/haptic removed; `memo()` added
- **Dialog**: `DialogStyledContext` for variant-based styling; shake animation on non-dismissable; `FadedContent` integration; new props (`keepMounted`, `dismissable`, `variant`, `disablePadding`)
- **Menu/types.ts**: Full type hierarchy with `MenuItem`, `MenuSeparator`, `MenuTitle`, type guards; new `Menu.tsx` with global emitter, hover-switching, submenu support, link items
- **Tooltip**: Dark glass style (backdropFilter), `setAllTooltipsDisabled()`, `memo()`, `stayInFrame` with padding
- **forms/Input**: Uses `inputStyle` constant from `constants.ts`, FormContext integration, `useComposedRefs`
- **Glint**: Named export, only top border visible, `z: 100_000_000`

## New Generic Components Worth Adding

- `FadedContent` — composable mask-image fade scroll with Header/Footer sub-components
- `AnimatedSteps` — direction-aware step transition
- `AnimationDriver` — runtime animation driver switcher
- `HoverGlow` — mouse-tracking glow hook
- `LabeledGroup` — label+input layout with validation state display
- `Toggle`, `Checkbox`, `SectionLabel` — form primitives
- `ErrorBoundary` — with error tracking and notification
- `RenderChildrenWhenIdle` — lazy mount wrapper
- `Notice` — styled notice box
- `Pill` — badge/tag component
- `Separator` — styled separator with platform overrides
- `sizes.ts` — `SimpleSize` type and `getSimpleSize` utility
- `FormContext` + `getValidationState` — TanStack Form integration helpers

## Pattern/Architecture Changes

- `memo()` on virtually all components
- Constants extracted to `constants.ts` per directory
- Named exports over default exports
- `withStaticProperties` for compound components
- Emitter logic consolidated into component files (not separate emitter.ts)
- Platform-specific glass/haptic code removed from shared components

## SYNC - Direct Apply

- All src/tamagui/ changes (animations, themes, config, opacify, breakpoints)
- Glint refactor (named export, z-index fix)
- Tooltip improvements (dark glass, disable API, memo)
- Separator component
- sizes.ts utility
- ErrorBoundary
- RenderChildrenWhenIdle
- Notice, Pill components

## ADAPT - Needs Modification

- Button refactor (large, needs careful merge with takeout's current Button)
- Dialog refactor (needs FadedContent first, review variant system)
- Menu/types.ts (type hierarchy is great, but Menu.tsx has chat-specific patterns)
- forms/Input (needs FormContext, review takeout's current form setup)
- FadedContent (standalone, but verify CSS mask-image support requirements)
- LabeledGroup (needs FormContext)
- Toggle, Checkbox (verify takeout's current form primitives)

## SKIP - App-Specific

- Chat-specific components (ChannelList, MessageBubble, etc.)
- HoverGlow (complex, niche use case)
- AnimationDriver (complex runtime switching, may not be needed)
- AnimatedSteps (chat onboarding specific)

## Key Dependencies

- Tamagui v5-subtle themes require @tamagui/themes update
- Dual animation driver requires @tamagui/config/v5-css
- FormContext requires @tanstack/react-form
- FadedContent is prerequisite for Dialog refactor
