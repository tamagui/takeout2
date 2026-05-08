---
name: add-icon
description: Phosphor icons — add, search, browse for src/interface/icons/phosphor/.
---

# Icons

icons are stored in `src/interface/icons/phosphor/` and use the Phosphor icon library.

## adding a new icon

use the add-phosphor script to fetch and convert icons:

```bash
bun tko icon add-phosphor <IconName>
bun tko icon add-phosphor <IconName> --weight=fill
```

### weights

- `regular` (default)
- `bold`
- `duotone`
- `fill`
- `light`
- `thin`

### examples

```bash
bun tko icon add-phosphor Heart
bun tko icon add-phosphor ArrowUpRight
bun tko icon add-phosphor User --weight=fill
```

## browsing available icons

browse all phosphor icons at: https://phosphoricons.com

## using icons

```tsx
import { HeartIcon } from '~/interface/icons/phosphor/HeartIcon'

<HeartIcon size={16} color="$color" />
```

### icon props

- `size` - icon size in pixels
- `color` - icon color (supports tamagui tokens)
- standard svg/view props

## existing icons

check `src/interface/icons/phosphor/` for already-added icons before adding new ones.
