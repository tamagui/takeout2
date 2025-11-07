# MDX Components - Usage Examples

## Basic MDX Setup

```tsx
import { components } from '~/features/docs'
import { YStack } from 'tamagui'

export default function DocPage({ mdxContent }) {
  return (
    <YStack p="$4" maxWidth={800} mx="auto">
      <MDXProvider components={components}>
        {mdxContent}
      </MDXProvider>
    </YStack>
  )
}
```

## Component Examples

### 1. Code Blocks

#### Simple Code Block

```tsx
// In your MDX file:
```typescript
const greeting = 'Hello, World!'
console.log(greeting)
\```

#### Code Block with File Name

```tsx
```typescript fileName="app.ts"
export const config = {
  port: 3000,
  host: 'localhost'
}
\```

#### Terminal Command with Package Manager Tabs

```tsx
```bash
npm install tamagui
\```
// Automatically shows tabs for npm, yarn, pnpm, bun

### 2. Badges

```tsx
// In your MDX:
<Badge variant="new">New Feature</Badge>
<Badge variant="beta">Beta</Badge>
<Badge variant="deprecated">Deprecated</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="warning">Warning</Badge>
```

### 3. Notice Callouts

```tsx
// Info notice (yellow/default)
<Notice>
  This is an important note about the feature!
</Notice>

// Warning notice
<Notice theme="red">
  **Warning:** This action cannot be undone.
</Notice>

// Success notice
<Notice theme="green">
  Your configuration has been saved successfully.
</Notice>

// Info notice
<Notice theme="blue">
  **Tip:** You can use keyboard shortcuts to navigate.
</Notice>
```

### 4. Cards

```tsx
// Single card with link
<Card
  category="Getting Started"
  title="Installation Guide"
  href="/docs/installation"
/>

// Multiple cards in a column
<CardCol>
  <Card
    category="Basics"
    title="Quick Start"
    href="/docs/quick-start"
  />
  <Card
    category="Advanced"
    title="Configuration"
    href="/docs/config"
  />
  <Card
    category="API"
    title="Reference"
    href="/docs/api"
  />
</CardCol>
```

### 5. Headings with Auto-Links

```tsx
// H3 headings automatically get anchor links
### Installation

// Renders as:
<LinkHeading id="installation">
  <H3>Installation</H3>
</LinkHeading>

// Users can link directly to: /docs/guide#installation
```

### 6. Custom Intro Paragraph

```tsx
// Large, prominent intro paragraph
<IntroParagraph>
  This guide will walk you through setting up your development environment
  and creating your first application with our framework.
</IntroParagraph>
```

### 7. Inline Code

```tsx
// Automatically styled inline code
Use the `npm install` command to install dependencies.

// Renders as:
<CodeInline>npm install</CodeInline>
```

### 8. Lists

```tsx
// Unordered list
- First item
- Second item
- Third item

// Ordered list
1. Step one
2. Step two
3. Step three

// Nested lists work too
- Parent item
  - Child item
  - Another child
- Another parent
```

### 9. Blockquotes

```tsx
> This is a quote or important callout.
> It can span multiple lines.
```

### 10. Images

```tsx
![Alt text](/path/to/image.png)
```

## Advanced Usage

### Collapsible Long Code

```tsx
```typescript hero
// Use 'hero' prop for collapsible code
// Long code blocks automatically collapse
function complexFunction() {
  // ... 100+ lines of code
}
\```

### Code with Line Highlighting

```tsx
```typescript line="3,5-7"
const x = 1
const y = 2
const z = x + y  // highlighted
const a = 10
const b = z * 2  // highlighted
const c = a + b  // highlighted
const d = c - 1  // highlighted
\```

### Code with Line Numbers

```tsx
```typescript showLineNumbers
function example() {
  return true
}
\```

## Component Composition

```tsx
// Combine components for rich documentation
<Notice theme="blue">
  <strong>New Feature:</strong> <Badge variant="new">v2.0</Badge>
</Notice>

<IntroParagraph>
  Check out our new <a href="/docs/api">API documentation</a> to learn more
  about the latest features.
</IntroParagraph>

<CardCol>
  <Card
    category="Tutorial"
    title="Build Your First App"
    href="/docs/tutorial"
  />
  <Card
    category="Examples"
    title="Sample Projects"
    href="/docs/examples"
  />
</CardCol>
```

## Styling Customization

```tsx
// All components accept Tamagui props
<Notice theme="yellow" p="$6" br="$6">
  Custom padding and border radius
</Notice>

<Badge variant="new" fontSize="$6">
  Larger badge
</Badge>

<Card
  category="Custom"
  title="Custom Card"
  href="/custom"
  bg="$blue2"
  hoverStyle={{ bg: '$blue3' }}
/>
```

## Theme Integration

All components automatically adapt to your Tamagui theme:

```tsx
// Light/dark mode automatically handled
<Theme name="dark">
  <Notice>This notice adapts to dark theme</Notice>
</Theme>

<Theme name="light">
  <Notice>This notice adapts to light theme</Notice>
</Theme>
```

## Error Handling

All components are wrapped in ErrorBoundary, so rendering errors won't crash your entire page:

```tsx
// If a component errors, it fails gracefully
<Card invalid={props} />
// Error logged to console, null rendered, page continues
```

## Accessibility

Components include proper accessibility features:

```tsx
// Semantic HTML
<h1> → <H1 tag="h1">
<code> → <Code tag="code">
<a> → <Link> with proper href

// ARIA labels
<Button aria-label="Copy code to clipboard" />
<Button aria-label="Show or hide code" />

// Keyboard navigation
// Tab through links, buttons, and interactive elements
```
