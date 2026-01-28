---
name: takeout-tamagui
description: Tamagui UI framework guide. Use when styling, components, tokens ($color, $size, $space), themes (light/dark mode), media queries, breakpoints, responsive design, shorthands (p, m, bg, f, ai, jc), Stack, XStack, YStack, Text, styled(), useTheme, or any Tamagui component.
---

# Tamagui UI Framework

This guide covers the Tamagui configuration and usage patterns in this project.

## Version 2 Notes

This project uses Tamagui v2. Key changes from v1:

### Web-Aligned Defaults

- **`defaultPosition: 'static'`** - Elements no longer default to relative positioning
- **`box-sizing: border-box`** - All elements use border-box by default
- **`transition` prop** - Use `transition` for CSS transitions (not `animation` which is for spring/keyframe animations)

### Web-First Props (Breaking Changes)

**Accessibility:** Use web-standard props only:
- ❌ `accessibilityLabel` → ✅ `aria-label`
- ❌ `accessibilityRole` → ✅ `role`
- ❌ `focusable` → ✅ `tabIndex`

**Events:** Use web-standard event handlers:
- ❌ `onPress` → ✅ `onClick`
- ❌ `onPressIn` → ✅ `onPointerDown`
- ❌ `onPressOut` → ✅ `onPointerUp`
- ✅ `onChangeText` - Still supported (ergonomic exception for RN devs)

**Shadows:** Use CSS `boxShadow` instead of legacy RN shadow props:
- ❌ `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`
- ✅ `boxShadow="0 2px 10px $shadowColor"` - Supports $token in strings

### Updated Components

**Image:** New web-aligned component:
```tsx
<Image src="/path/to/image.png" objectFit="cover" />
```

**Input:** New props for mobile keyboards:
```tsx
<Input inputMode="email" enterKeyHint="send" />
```

## Configuration Settings

**IMPORTANT:** These settings affect how you write Tamagui code in this project.

### Default Font: `body`

All text components use the "body" font family by default. Available font families:
- `body` - System font for general UI text
- `heading` - System font for headings with adjusted sizing
- `mono` - JetBrains Mono for monospace text

### Only Allow Shorthands: `true`

**You MUST use shorthand properties in this project.**

Full property names are not allowed. For example:
- ✅ `<Stack p="$4" />` (correct)
- ❌ `<Stack padding="$4" />` (will error)

See the Shorthand Properties section below for all available shorthands.

### Theme Configuration

- **Theme Class Name on Root:** `true` - Theme classes applied to root HTML element
- **Max Dark/Light Nesting:** `2` - Maximum nesting depth for light/dark theme switching
- **Disable Root Theme Class:** `true` - vxrn color scheme handles this
- **Disable SSR:** `true` - SSR is disabled for Tamagui in this project

## Shorthand Properties

These are the ONLY shorthand properties available in v4 (many from v3 were removed):

**Layout & Position:**
- `b` → `bottom`
- `l` → `left`
- `r` → `right`
- `t` → `top`
- `z` → `zIndex`

**Flexbox:**
- `content` → `alignContent`
- `grow` → `flexGrow`
- `items` → `alignItems`
- `justify` → `justifyContent`
- `self` → `alignSelf`
- `shrink` → `flexShrink`

**Spacing (Margin):**
- `m` → `margin`
- `mb` → `marginBottom`
- `ml` → `marginLeft`
- `mr` → `marginRight`
- `mt` → `marginTop`
- `mx` → `marginHorizontal`
- `my` → `marginVertical`

**Spacing (Padding):**
- `p` → `padding`
- `pb` → `paddingBottom`
- `pl` → `paddingLeft`
- `pr` → `paddingRight`
- `pt` → `paddingTop`
- `px` → `paddingHorizontal`
- `py` → `paddingVertical`

**Sizing:**
- `maxH` → `maxHeight`
- `maxW` → `maxWidth`
- `minH` → `minHeight`
- `minW` → `minWidth`

**Other:**
- `bg` → `backgroundColor`
- `rounded` → `borderRadius`
- `select` → `userSelect`
- `text` → `textAlign`

**Note:** Properties like `w` (width), `h` (height), `f` (flex), etc. from v3 are NOT available in v4. Use full property names for these.

## Tokens

Tokens are design system values referenced using the `$` prefix.

### Space Tokens

For margin, padding, gap:

```tsx
<Stack p="$4" gap="$2" m="$3" />
```

Available space tokens:
- Negative: `-20` through `-0.25` (negative spacing)
- Zero: `0`
- Positive: `0.25` through `20`
- `true`: `18` (default/fallback)

Common values:
- `$1`: 2px
- `$2`: 7px
- `$3`: 13px
- `$4`: 18px
- `$5`: 24px
- `$6`: 32px
- `$8`: 46px
- `$10`: 60px

### Size Tokens

For width, height, dimensions:

```tsx
<Stack width="$10" height="$6" />
```

Available size tokens:
- `0` through `20`
- `true`: `44` (default/fallback)

Common values:
- `$1`: 20px
- `$2`: 28px
- `$4`: 44px
- `$6`: 64px
- `$8`: 84px
- `$10`: 104px
- `$12`: 144px

### Radius Tokens

For border-radius:

```tsx
<Stack rounded="$4" />
```

Available radius tokens:
- `0` through `12`
- `true`: `9` (default/fallback)

Common values:
- `$0`: 0px
- `$1`: 3px
- `$2`: 5px
- `$4`: 9px
- `$6`: 16px
- `$8`: 22px

### Z-Index Tokens

```tsx
<Stack z="$3" />
```

Available z-index tokens:
- `$0`: 0
- `$1`: 100
- `$2`: 200
- `$3`: 300
- `$4`: 400
- `$5`: 500

### Color Tokens

Access theme colors:

```tsx
<Stack bg="$background" color="$color" />
<Stack bg="$blue5" color="$gray12" />
```

## Themes

Themes are organized hierarchically and can be combined.

### Theme Levels

**Level 1 (Base):**
- `dark`
- `light`

**Level 2 (Color Schemes):**
- `accent`, `black`, `blue`, `green`, `orange`, `pink`, `purple`, `red`, `teal`, `white`, `yellow`

**Component Themes:**
- `Button`, `Card`, `Checkbox`, `Input`, `ListItem`, `Progress`, `ProgressIndicator`
- `RadioGroupItem`, `SelectTrigger`, `SliderThumb`, `SliderTrack`, `SliderTrackActive`
- `Switch`, `SwitchThumb`, `TextArea`, `Tooltip`, `TooltipArrow`, `TooltipContent`

### Theme Usage

```tsx
// Apply a theme
<Theme name="dark">
  <Button>I'm a dark button</Button>
</Theme>

// Themes nest and combine automatically
<Theme name="dark">
  <Theme name="blue">
    <Button>Uses dark_blue theme</Button>
  </Theme>
</Theme>

// Special props
<Theme inverse>  {/* Swaps light ↔ dark */}
<Theme reset>    {/* Reverts to grandparent theme */}
```

### Theme Values

Available theme variables (access with `$` prefix):
- Colors: `$color1` through `$color12`, `$color0`, `$color02`, `$color04`, `$color06`, `$color08`
- Backgrounds: `$background`, `$backgroundHover`, `$backgroundPress`, `$backgroundFocus`
- Borders: `$borderColor`, `$borderColorHover`, `$borderColorPress`, `$borderColorFocus`
- Text: `$color`, `$colorHover`, `$colorPress`, `$colorFocus`, `$placeholderColor`
- Accents: `$accentBackground`, `$accentColor`
- Named colors: `$blue1` through `$blue12`, `$gray1` through `$gray12`, etc.

## Media Queries

Available responsive breakpoints defined in `tamagui.config.ts`:

### Width Breakpoints

**Min-width (mobile-first):**
- `xxxs`: 260px
- `xxs`: 380px
- `xs`: 440px
- `sm`: 500px
- `md`: 600px
- `lg`: 800px
- `xl`: 1024px
- `xxl`: 1240px

**Max-width (desktop-first):**
- `maxXXXS`: 260px
- `maxXXS`: 380px
- `maxXS`: 440px
- `maxSM`: 500px
- `maxMD`: 600px
- `maxLG`: 800px
- `maxXL`: 1024px
- `maxXXL`: 1240px

### Height Breakpoints

- `heightXXXS`: 260px
- `heightXXS`: 380px
- `heightXS`: 440px
- `heightSM`: 500px
- `heightMD`: 600px
- `heightLG`: 800px

### Other Media Queries

- `pointerTouch`: `{ pointer: 'coarse' }` - Touch devices

### Media Query Usage

```tsx
// As style props (prefix with $)
<Stack width="100%" $md={{ width: "50%" }} $lg={{ width: "33%" }} />

// Multiple breakpoints
<Stack
  p="$2"
  $sm={{ p: "$4" }}
  $md={{ p: "$6" }}
  $lg={{ p: "$8" }}
/>

// Using the useMedia hook
import { useMedia } from 'tamagui'

const media = useMedia()
if (media.lg) {
  // Render for large screens
}
```

## Animations

Available animation presets:

**Duration-based:**
- `0ms`, `30ms`, `50ms`, `75ms`, `100ms`, `200ms`, `300ms`

**Named presets:**
- Speed: `quickest`, `quicker`, `quick`, `medium`, `slow`, `slowest`, `superLazy`, `lazy`
- With bounce: `superBouncy`, `bouncy`, `kindaBouncy`
- Less bounce variants: `quickestLessBouncy`, `quickerLessBouncy`, `quickLessBouncy`
- Special: `tooltip`

Usage:

```tsx
<Stack animation="quick" />
<Stack animation="bouncy" />
```

## Components

### Core Layout Components

- `Stack`, `XStack`, `YStack`, `ZStack` - Flexbox containers
- `SizableStack`, `ThemeableStack` - Variants with additional features
- `View`, `Frame` - Basic containers
- `ScrollView` - Scrollable container
- `Spacer` - Flexible spacing
- `Group`, `XGroup`, `YGroup` - Grouped items

### Typography

- `Text`, `SizableText` - Text components
- `Paragraph` - Paragraph text
- `Heading` - Heading text
- `H1`, `H2`, `H3`, `H4`, `H5`, `H6` - Heading levels

### Form Components

- `Input` - Text input
  - `Input.Frame` - Input container
- `TextArea` - Multi-line text input
  - `Text.Area`, `Text.AreaFrame`
- `Button` - Button component
  - `Button.Frame`, `Button.Text`
- `Checkbox` - Checkbox input
  - `Checkbox.Frame`, `Checkbox.IndicatorFrame`
- `RadioGroup` - Radio button group
  - `RadioGroup.Frame`, `RadioGroup.IndicatorFrame`, `RadioGroup.ItemFrame`
- `Switch` - Toggle switch
  - `Switch.Frame`, `Switch.Thumb`
- `Slider` - Range slider
  - `SliderFrame`, `SliderThumb`, `SliderThumb.Frame`
  - `SliderTrackFrame`, `SliderTrackActiveFrame`
- `Label` - Form label
  - `Label.Frame`
- `Fieldset` - Form fieldset
- `Form` - Form container
  - `Form.Frame`, `Form.Trigger`

### Display Components

- `Card` - Card container
  - `Card.Frame`, `Card.Header`, `Card.Footer`, `Card.Background`
- `ListItem` - List item
  - `ListItem.Frame`, `ListItem.Title`, `ListItem.Subtitle`, `ListItem.Text`
- `Image` - Image component
- `Avatar` - Avatar component
  - `AvatarFrame`, `AvatarFallback`, `AvatarFallback.Frame`
- `Progress` - Progress bar
  - `Progress.Frame`, `Progress.Indicator`, `Progress.IndicatorFrame`
- `Spinner` - Loading spinner
- `Separator` - Visual separator

### Shapes

- `Circle` - Circle shape
- `Square` - Square shape

### Overlays & Dialogs

- `Dialog` - Modal dialog
  - `DialogOverlay`, `DialogOverlay.Frame`
  - `DialogPortalFrame`
  - `DialogContent`, `DialogTitle`, `DialogDescription`
  - `DialogTrigger`, `DialogClose`
- `AlertDialog` - Alert dialog
  - `AlertDialogOverlay`
  - `AlertDialogTitle`, `AlertDialogDescription`
  - `AlertDialogTrigger`, `AlertDialogAction`, `AlertDialogCancel`
- `Popover` - Popover overlay
  - `PopoverContent`, `PopoverArrow`
- `Tooltip` - Tooltip
  - `Tooltip`, `TooltipContent`, `TooltipArrow`
- `Sheet` - Bottom/side sheet
  - `SheetOverlayFrame`, `SheetHandleFrame`
- `Overlay` - Generic overlay

### Popper

- `PopperAnchor` - Anchor for positioned elements
- `PopperContentFrame` - Positioned content
- `PopperArrowFrame` - Arrow pointer

### Select

- `SelectGroupFrame` - Select group container
- `SelectIcon` - Select icon
- `SelectSeparator` - Select separator

### Navigation

- `Tabs` - Tab navigation
- `Anchor` - Link/anchor element

### Semantic HTML

- `Article`, `Aside`, `Footer`, `Header`, `Main`, `Nav`, `Section`

### Utilities

- `VisuallyHidden` - Accessible hidden content
- `EnsureFlexed` - Ensure flex layout
- `Handle`, `Thumb` - Draggable elements

## Project-Specific Component Preferences

When building UI components, prefer these project-specific implementations over Tamagui defaults:

### Custom Components (in `src/interface`)

- **Buttons:** Use `Button` from `~/interface/buttons/Button` instead of Tamagui's `Button`
- **Select/Dropdown:** Use the custom `Select` component
- **Tabs:** Use the custom `Tabs` component
- **Popover:** Use the custom `Popover` component

### Component Hierarchy

1. Check if a project-specific component exists in `src/interface` first
2. Check existing components for patterns before creating new ones
3. Only use Tamagui's default components when no custom alternative exists
4. Maintain consistency with existing UI patterns in the codebase

## Default Props

### Button

The Button component has custom default props:

```tsx
{
  fontFamily: '$mono',
  cursor: 'default',
  focusVisibleStyle: {
    outlineWidth: 3,
    outlineStyle: 'solid',
    outlineColor: '$background04',
  }
}
```

## Best Practices

1. **Always use shorthands** - Full property names will cause errors due to `onlyAllowShorthands: true`
2. **Use tokens consistently** - Prefer `$` token syntax over hardcoded values
3. **Mobile-first responsive design** - Use min-width media queries (`sm`, `md`, `lg`) rather than max-width when possible
4. **Leverage theme system** - Use theme tokens (`$color`, `$background`, etc.) for automatic light/dark mode support
5. **Follow project component hierarchy** - Check `src/interface` for custom components before using Tamagui defaults
6. **Maintain semantic HTML** - Use semantic components (`Article`, `Header`, `Nav`, etc.) for better accessibility
7. **Type safety** - Tamagui provides full TypeScript support for all tokens and props
8. **Performance** - Use media query props for responsive design rather than conditional rendering when possible

## Additional Resources

- Tamagui configuration: `src/tamagui/tamagui.config.ts`
- Theme definitions: `src/tamagui/themes-out.ts`
- Breakpoints: `src/tamagui/breakpoints.ts`
- Animations: `src/tamagui/animations.ts`
- Custom components: `src/interface/`

---

*This documentation was generated using `bunx tamagui generate-prompt` and enhanced with project-specific guidance.*
