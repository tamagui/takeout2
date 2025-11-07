# MDX Documentation Components

Complete MDX component mappings and code display components for rendering documentation with Tamagui.

## Components

### MDXComponents.tsx

Complete component mapping for MDX content. Maps HTML elements to Tamagui components with error boundaries.

**Usage:**

```tsx
import { components } from '~/features/docs'

// In your MDX setup
<MDXProvider components={components}>
  <YourMDXContent />
</MDXProvider>
```

**Mapped Elements:**

- `h1, h2, h3, h4, h5` → H1, H2, H3, H4, H5 with proper styling
- `p` → Paragraph
- `ul, ol, li` → Styled list components
- `a` → Link from 'one'
- `code` → Inline code or code block
- `strong, blockquote, img, hr` → Styled components

**Custom Components:**

- `Card` - Clickable card with category and title
- `CardCol` - Column layout for cards
- `Notice` - Callout boxes (info, warning, error, success)
- `Badge` - Status badges (new, beta, deprecated)
- `IntroParagraph` - Large intro paragraph styling

### DocsCodeBlock.tsx

Syntax-highlighted code blocks with advanced features:

**Features:**
- Copy to clipboard button
- Line highlighting support
- File name display
- Terminal detection
- Collapsible for long code blocks
- Show more/less functionality
- Package manager tabs (npm, yarn, pnpm, bun)

**Usage:**

```tsx
import { DocCodeBlock } from '~/features/docs'

<DocCodeBlock
  className="language-typescript"
  fileName="example.ts"
  showLineNumbers
>
  {codeString}
</DocCodeBlock>
```

### Code.tsx

Inline and block code styling components.

**Usage:**

```tsx
import { Code, CodeInline } from '~/features/docs'

<CodeInline>npm install</CodeInline>
<Code>const foo = 'bar'</Code>
```

### Badge.tsx

Status badges for documentation.

**Variants:**
- `new` - Green badge for new features
- `beta` - Blue badge for beta features
- `deprecated` - Red badge for deprecated features
- `info` - Purple badge for info
- `warning` - Yellow badge for warnings

**Usage:**

```tsx
import { Badge } from '~/features/docs'

<Badge variant="new">New</Badge>
<Badge variant="beta">Beta</Badge>
<Badge variant="deprecated">Deprecated</Badge>
```

### Notice.tsx

Callout boxes for important information.

**Themes:**
- `yellow` (default) - Warning/info
- `red` - Error/danger
- `green` - Success
- `blue` - Info

**Usage:**

```tsx
import { Notice } from '~/features/docs'

<Notice theme="yellow">
  This is an important note!
</Notice>

<Notice theme="red">
  Warning: This is dangerous!
</Notice>
```

### LinkHeading.tsx

Auto-linkable headings with anchor links.

**Usage:**

```tsx
import { LinkHeading } from '~/features/docs'

<LinkHeading id="section-title">
  <H3>Section Title</H3>
</LinkHeading>
```

## Utilities

### unwrapText.tsx

Helper to unwrap text from React children.

### useClipboard.tsx

Hook for clipboard functionality with copy feedback.

### useBashCommand.ts

Hook for transforming bash commands between package managers (npm/yarn/pnpm/bun).

### useLocalStorageWatcher.tsx

Hook for syncing state between components using localStorage.

## Implementation Notes

- All components use Tamagui for styling
- Error boundaries wrap each MDX component for better debugging
- Components follow the patterns from onestack.dev
- Code blocks support syntax highlighting (requires external highlighter)
- Package manager tabs automatically transform commands
- All components are mobile-responsive with Tamagui media queries
