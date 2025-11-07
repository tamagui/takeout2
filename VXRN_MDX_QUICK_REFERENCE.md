# @vxrn/mdx Quick Reference

## API at a Glance

### getMDX
```typescript
import { getMDX } from '@vxrn/mdx'

const { frontmatter, code } = await getMDX(mdxString, optionalPlugins)
// Parses MDX string, returns frontmatter + bundled code
```

### getMDXBySlug
```typescript
import { getMDXBySlug } from '@vxrn/mdx'

const { frontmatter, code } = await getMDXBySlug('/path/to/docs', 'slug-name')
// Loads file from disk, bundles it
// Auto-detects versions if in 'components' directory
```

### getAllFrontmatter
```typescript
import { getAllFrontmatter } from '@vxrn/mdx'

const frontmatters = getAllFrontmatter('/path/to/docs')
// Scans directory recursively, extracts all frontmatter
// Returns sorted by publishedAt (newest first)
```

### getAllVersionsFromPath
```typescript
import { getAllVersionsFromPath } from '@vxrn/mdx'

const versions = getAllVersionsFromPath('/path/to/component')
// Returns versions sorted by semver descending
// ['2.0.0', '1.2.5', '1.0.0']
```

### createCodeHighlighter
```typescript
import { createCodeHighlighter } from '@vxrn/mdx'

const highlighter = createCodeHighlighter()
const html = highlighter(code, 'tsx', '1-3')
// Standalone syntax highlighting (outside MDX)
```

---

## Frontmatter Format

```yaml
---
title: "Required Title"
slug: "required-slug"
description: "Optional description"
publishedAt: "2024-11-06"
draft: false
by: "Author Name"
image: "/path/to/image.png"
type: "changelog"
---

# Markdown Content
```

---

## Code Block Syntax

### Basic
```tsx
const x = 42
```

### With Line Highlighting
```tsx line="1,3-5"
const x = 1  // highlighted
const y = 2  // normal
const z = 3  // highlighted
const a = 4  // highlighted
const b = 5  // highlighted
```

### With Word Highlighting
```tsx
const important = __this stands out__
```

### With Metadata Attributes
```tsx title="example.tsx" line="2-4" className="custom-class"
const x = 1
const y = 2
const z = 3
```

---

## Directory Structure

```
project/
├── content/
│   ├── docs/
│   │   ├── getting-started.mdx
│   │   ├── api/
│   │   │   ├── overview.mdx
│   │   │   └── reference.mdx
│   │   └── guides/
│   │       └── setup.mdx
│   │
│   ├── blog/
│   │   ├── 2024-01-15-first-post.mdx
│   │   └── 2024-02-20-second-post.mdx
│   │
│   └── components/
│       ├── button/
│       │   ├── 1.0.0.mdx
│       │   ├── 1.2.0.mdx
│       │   └── 2.0.0.mdx
│       └── input/
│           └── 1.0.0.mdx
```

---

## CSS Classes Generated

### From Syntax Highlighting
```css
.token            /* Base token class from refractor/Prism */
.token.keyword    /* Keywords (const, function, etc.) */
.token.string     /* String literals */
.token.number     /* Numbers */
.token.comment    /* Comments */
.token.operator   /* Operators */
.token.function   /* Function names */
/* ... many more from Prism */
```

### From Line Highlighting
```css
.highlight-line {
  display: block;
  padding: 0 1rem;
  margin: 0 -1rem;
}

.highlight-line[data-highlighted="true"] {
  background: rgba(255, 255, 0, 0.2);
}

.highlight-line[data-line="5"] {
  /* Specific line (data-line attribute) */
}
```

### From Word Highlighting
```css
.highlight-word {
  background: rgba(255, 255, 0, 0.3);
  padding: 0.1em 0.3em;
  border-radius: 2px;
}
```

### From Auto-Linking Headings
```css
h1 > a, h2 > a, h3 > a, h4 > a, h5 > a, h6 > a {
  /* Links added by rehype-autolink-headings */
}
```

---

## Setup for React App

### Step 1: Install
```bash
yarn add @vxrn/mdx mdx-bundler
```

### Step 2: Create lib file
```typescript
// lib/mdx.ts
import { getMDXBySlug, getAllFrontmatter } from '@vxrn/mdx'
import path from 'path'

const DOCS_DIR = path.join(process.cwd(), 'content/docs')

export async function getDoc(slug: string) {
  return getMDXBySlug(DOCS_DIR, slug)
}

export function getAllDocs() {
  return getAllFrontmatter(DOCS_DIR)
}
```

### Step 3: Use in pages
```typescript
// pages/docs/[slug].tsx
import { getDoc } from '@/lib/mdx'
import { evaluate } from 'mdx-bundler/client'

export default function DocPage({ code, frontmatter }) {
  const { default: Component } = await evaluate(code)
  
  return (
    <div>
      <h1>{frontmatter.title}</h1>
      <Component />
    </div>
  )
}

export async function getStaticProps(context) {
  const { code, frontmatter } = await getDoc(context.params.slug)
  return { props: { code, frontmatter } }
}
```

### Step 4: Add CSS
```css
/* globals.css or styles.module.css */

pre {
  background: #1a1a1a;
  color: #d4d4d4;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
}

.highlight-line {
  display: block;
  padding: 0 1rem;
  margin: 0 -1rem;
  background: rgba(255, 255, 255, 0.05);
}

.highlight-line[data-highlighted="true"] {
  background: rgba(255, 255, 0, 0.15);
}

.highlight-word {
  background: rgba(255, 255, 0, 0.3);
  padding: 0.1em 0.3em;
  border-radius: 2px;
}
```

---

## Common Patterns

### Get single post with frontmatter
```typescript
const { code, frontmatter } = await getMDXBySlug(BLOG_DIR, 'my-post')
console.log(frontmatter.title)
console.log(frontmatter.headings)
console.log(frontmatter.readingTime.text)
```

### Get all posts sorted by date
```typescript
const posts = getAllFrontmatter(BLOG_DIR)
// Already sorted by publishedAt descending
posts.forEach(post => {
  console.log(`${post.title} (${post.publishedAt})`)
})
```

### Filter drafts
```typescript
const posts = getAllFrontmatter(BLOG_DIR)
const published = posts.filter(p => !p.draft)
```

### Generate table of contents
```typescript
const { frontmatter } = await getMDXBySlug(DOCS_DIR, slug)
const toc = frontmatter.headings?.map(h => ({
  text: h.title,
  href: h.id,
  level: h.priority
}))
```

### Custom component mapping
```typescript
import { evaluate } from 'mdx-bundler/client'
import CustomButton from './CustomButton'
import CustomAlert from './CustomAlert'

const { default: Component } = await evaluate(code, {
  components: {
    Button: CustomButton,
    Alert: CustomAlert,
    // ... more mappings
  }
})
```

### Add custom rehype plugin
```typescript
import { getMDX } from '@vxrn/mdx'
import { visit } from 'unist-util-visit'

const customPlugin = () => (tree) => {
  visit(tree, 'element', (node) => {
    if (node.tagName === 'a') {
      node.properties.className = 'custom-link'
    }
  })
}

const { code, frontmatter } = await getMDX(mdxString, [customPlugin])
```

---

## Performance Tips

### Cache frontmatter
```typescript
let cache: Frontmatter[] | null = null

export function getAllDocsCached() {
  if (!cache) {
    cache = getAllFrontmatter(DOCS_DIR)
  }
  return cache
}
```

### Lazy load bundles
```typescript
// Don't evaluate all at once
const { code } = await getMDXBySlug(DOCS_DIR, slug)

// Defer evaluation until rendering
const { default: Component } = await evaluate(code)
```

### Batch static generation
```typescript
export async function getStaticPaths() {
  const docs = getAllFrontmatter(DOCS_DIR)
  return {
    paths: docs.map(doc => ({ params: { slug: doc.slug } })),
    fallback: 'blocking'
  }
}
```

---

## Troubleshooting Quick Fixes

### Code not highlighting
Check CSS targets these classes:
- `.token` (from refractor)
- `.highlight-line[data-highlighted]`
- `.highlight-word`

Add to CSS:
```css
pre { background: #f5f5f5; color: #333; }
.token.keyword { color: #0066cc; }
.token.string { color: #cc0000; }
.token.comment { color: #999; }
```

### Frontmatter not parsing
Ensure format:
```
---
title: "value"
slug: "value"
---

Content here
```

No extra spaces before `---`

### File not found in getMDXBySlug
Check:
1. File exists: `basePath/slug.mdx`
2. Path separators (use forward slashes)
3. No `.mdx` extension in slug parameter

### Import errors in MDX
Make sure imports in MDX files are valid:
```mdx
import { Button } from '@/components/Button'  // OK
import Button from './Button'                 // Depends on bundler config
```

### Line highlighting not working
Syntax must be:
```
```tsx line="1,3,5-7"
```

Not: `line: 1-3` or `highlight: 1-3`

---

## Exported Types

```typescript
import type { Frontmatter } from '@vxrn/mdx'

const fm: Frontmatter = {
  title: "string (required)",
  slug: "string (required)",
  headings: [
    { title: "string", priority: 1-6, id: "#string" }
  ],
  readingTime: {
    text: "string",
    minutes: 5,
    time: 300000,
    words: 1500
  },
  // ... other optional fields
}
```

---

## Complete Minimal Example

```typescript
// content/docs/hello.mdx
---
title: "Hello World"
slug: "hello"
---

# Hello

```tsx line="2"
const greeting = "Hello, World!"
console.log(__greeting__)
```
```

// lib/mdx.ts
import { getMDXBySlug, getAllFrontmatter } from '@vxrn/mdx'

export async function getDoc(slug: string) {
  return getMDXBySlug('content/docs', slug)
}

// pages/docs/[slug].tsx
import { getDoc } from '@/lib/mdx'
import { evaluate } from 'mdx-bundler/client'

export default function Page({ frontmatter, code }) {
  const { default: Mdx } = await evaluate(code)
  
  return (
    <div>
      <h1>{frontmatter.title}</h1>
      <Mdx />
    </div>
  )
}

export async function getStaticProps({ params }) {
  const { frontmatter, code } = await getDoc(params.slug)
  return { props: { frontmatter, code } }
}
```

---

## Key Files to Know

From `/Users/n8/one/packages/mdx/src/`:

| File | Purpose |
|------|---------|
| `index.ts` | Exports public API |
| `getMDX.ts` | Core bundling logic |
| `getMDXBySlug.tsx` | File loading + bundling |
| `getAllFrontmatter.tsx` | Bulk metadata extraction |
| `getHeadings.ts` | Markdown header parsing |
| `highlightCode.tsx` | Standalone highlighting |
| `rehypeHighlightCode.tsx` | Main syntax highlighting plugin |
| `rehypeLine.tsx` | Line highlighting logic |
| `rehypeWord.tsx` | Word highlighting logic |
| `rehypeMetaAttribute.tsx` | Meta attribute parsing |
| `types.ts` | TypeScript type definitions |

---

## Package.json Dependencies

```json
{
  "mdx-bundler": "^10.0.2",
  "gray-matter": "^4.0.3",
  "refractor": "^4.7.0",
  "reading-time": "1.3.0",
  "rehype-slug": "^5.0.1",
  "rehype-autolink-headings": "^6.1.1",
  "fast-glob": "^3.3.3",
  "hast-util-to-html": "^8.0.3",
  "hast-util-to-string": "^2.0.0",
  "unist-util-visit": "^2.0.3",
  "parse-numeric-range": "^1.3.0"
}
```

All bundled as CommonJS, must use dynamic import in ESM apps.
