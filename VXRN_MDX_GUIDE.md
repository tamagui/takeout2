# @vxrn/mdx Integration Guide

## Overview

`@vxrn/mdx` is a comprehensive MDX processing library built on top of `mdx-bundler`. It provides utilities for loading, processing, and transforming MDX files with automatic code highlighting, frontmatter extraction, and heading generation.

**Version:** 1.2.7
**Type:** CommonJS (can be imported dynamically in ESM)

---

## Core Dependencies

The package relies on these key dependencies:

- **mdx-bundler** (v10.0.2) - Core MDX processing and bundling
- **gray-matter** (v4.0.3) - YAML frontmatter parsing
- **refractor** (v4.7.0) - Syntax highlighting using refractor (Prism-based)
- **shiki** (1.3.0) - Alternative syntax highlighting (included but not actively used in default config)
- **reading-time** (1.3.0) - Reading time calculation
- **hast-util-to-string** & **hast-util-to-html** - HAST (Hypertext Abstract Syntax Tree) manipulation
- **rehype** ecosystem - HTML processing and transformation
  - rehype-slug
  - rehype-autolink-headings
  - rehype-parse
- **unist-util-visit** - AST tree traversal
- **fast-glob** - File globbing for bulk operations
- **parse-numeric-range** - Parsing number ranges in code metadata

---

## Exported API

### 1. `getMDX(source: string, extraPlugins?: UnifiedPlugin): Promise<{frontmatter: Frontmatter; code: string}>`

**Purpose:** Process a single MDX string and return compiled code with frontmatter.

**Parameters:**
- `source` (string): The MDX content as a string (including YAML frontmatter)
- `extraPlugins` (UnifiedPlugin, optional): Additional rehype plugins to apply

**Returns:** Promise resolving to an object with:
- `frontmatter` (Frontmatter): Parsed metadata + auto-generated headings and reading time
- `code` (string): Compiled/bundled MDX code ready for evaluation

**What it does internally:**
1. Uses `mdx-bundler` to bundle the MDX source
2. Applies rehype plugins in this order:
   - Any `extraPlugins` you pass
   - Default rehype plugins from mdx-bundler
   - `rehypeMetaAttribute` - Parses code block metadata attributes
   - `rehypeHighlightCode` - Syntax highlighting with line/word highlighting
   - `rehypeAutolinkHeadings` - Auto-links headings
   - `rehypeSlug` - Adds slugified IDs to headings
3. Automatically extracts headings from markdown headers
4. Calculates reading time

**Example:**
```typescript
import { getMDX } from '@vxrn/mdx'

const mdxContent = `---
title: "My Blog Post"
description: "A great post"
publishedAt: "2024-01-15"
---

# Getting Started

Your content here with \`code\` blocks.
`

const { frontmatter, code } = await getMDX(mdxContent)

console.log(frontmatter)
// {
//   title: "My Blog Post",
//   description: "A great post",
//   publishedAt: "2024-01-15",
//   slug: "my-slug", // You need to set this in frontmatter or separately
//   headings: [{ title: "Getting Started", priority: 1, id: "#getting-started" }],
//   readingTime: { text: "2 min read", minutes: 2, time: 120000, words: 45 }
// }

console.log(code)
// The bundled/compiled MDX code string - use with mdx-bundler's evaluate()
```

---

### 2. `getMDXBySlug(basePath: string, slug: string, extraPlugins?: UnifiedPlugin): Promise<{frontmatter: Frontmatter; code: string}>`

**Purpose:** Load an MDX file from disk and process it.

**Parameters:**
- `basePath` (string): Base directory containing MDX files
- `slug` (string): File path relative to basePath (without `.mdx` extension)
- `extraPlugins` (UnifiedPlugin, optional): Additional rehype plugins

**Returns:** Same as getMDX

**Smart Version Handling:**
- If `slug` doesn't include a version (dot) AND basePath contains "components", it automatically finds the latest version
- Uses `getAllVersionsFromPath()` to locate versioned files
- Sorts by semantic versioning and returns the latest

**File Resolution:**
- Converts slug to file path: `path.join(basePath, `${mdxPath}.mdx`)`
- Reads file synchronously and passes to `getMDX()`

**Example:**
```typescript
import { getMDXBySlug } from '@vxrn/mdx'

// Single file
const { frontmatter, code } = await getMDXBySlug(
  '/Users/n8/docs',
  'getting-started'
)
// Loads: /Users/n8/docs/getting-started.mdx

// Versioned component (auto-selects latest)
const { frontmatter, code } = await getMDXBySlug(
  '/Users/n8/components',
  'button'
)
// Automatically loads: /Users/n8/components/button/1.2.5.mdx (latest version)

// Explicit version
const { frontmatter, code } = await getMDXBySlug(
  '/Users/n8/components',
  'button/1.2.3'
)
// Loads: /Users/n8/components/button/1.2.3.mdx
```

---

### 3. `getAllVersionsFromPath(fromPath: string): string[]`

**Purpose:** Get all available versions (filenames) from a directory, sorted by semantic version.

**Parameters:**
- `fromPath` (string): Directory path containing versioned files

**Returns:** Array of filenames (without `.mdx` extension), sorted by semantic version (descending - newest first)

**Behavior:**
- Returns empty array if directory doesn't exist
- Reads all files, strips `.mdx` extension
- Sorts using semantic version comparison (not alphabetical)
- Returns newest versions first

**Example:**
```typescript
import { getAllVersionsFromPath } from '@vxrn/mdx'

const versions = getAllVersionsFromPath('/Users/n8/components/button')
// Returns: ['2.0.0', '1.2.5', '1.2.0', '1.0.0']
```

---

### 4. `getAllFrontmatter(fromPath: string): Frontmatter[]`

**Purpose:** Recursively scan a directory and extract frontmatter from all MDX files.

**Parameters:**
- `fromPath` (string): Base directory to scan

**Returns:** Array of Frontmatter objects, sorted by `publishedAt` (newest first)

**What it does:**
1. Uses `fast-glob` to recursively find all `**/*.mdx` files
2. For each file:
   - Reads file content
   - Parses frontmatter with `gray-matter`
   - Generates slug from file path (relative to fromPath)
   - Extracts headings from markdown
   - Calculates reading time from content
3. Sorts results by `publishedAt` date (descending)

**Slug Generation:**
- Takes full path: `/path/to/docs/blog/my-post.mdx`
- Removes base path and `.mdx`: `blog/my-post`
- This becomes the `slug` in frontmatter

**Example:**
```typescript
import { getAllFrontmatter } from '@vxrn/mdx'

const allPosts = getAllFrontmatter('/Users/n8/docs/blog')
// Returns array of all blog post frontmatter, newest first

console.log(allPosts[0])
// {
//   title: "Latest Post",
//   slug: "2024/latest-post",
//   publishedAt: "2024-11-01",
//   headings: [...],
//   readingTime: { ... },
//   // ... other frontmatter fields
// }
```

---

### 5. `createCodeHighlighter(): (source: string, language: 'tsx' | 'css' | string, line?: string) => string`

**Purpose:** Create a reusable code highlighting function using refractor.

**Returns:** A function that takes source code and returns highlighted HTML string

**Function Signature:**
```typescript
(source: string, language: 'tsx' | 'css' | string, line?: string) => string
```

**Parameters (of returned function):**
- `source` (string): Code to highlight
- `language` (string): Language identifier ('tsx', 'css', or any refractor-supported language)
- `line` (string, optional): Numeric range of lines to highlight (e.g., "1,3,5-7")

**Returns:** HTML string with syntax highlighting and line wrapping

**Supported Languages:**
- Built-in: `tsx`, `css` (explicitly registered)
- Any language supported by refractor (javascript, typescript, python, rust, etc.)

**Line Highlighting Syntax:**
- Single lines: `"1,3,5"`
- Ranges: `"1-5"`
- Mixed: `"1,3-5,7"`
- `"0"` highlights all lines

**What it does:**
1. Registers TSX and CSS languages with refractor
2. Highlights code using refractor (Prism-based syntax highlighting)
3. Applies line number wrapping (creates divs for each line)
4. Applies word highlighting for `__highlighted__` text patterns
5. Returns as HTML string

**Example:**
```typescript
import { createCodeHighlighter } from '@vxrn/mdx'

const highlighter = createCodeHighlighter()

const html = highlighter(
  'const x = 42',
  'tsx',
  '1'
)

// Returns HTML with syntax highlighting and line wrapper div
// Note: This is a singleton - multiple calls return the same function instance
```

---

## Frontmatter Type Definition

```typescript
type Frontmatter = {
  // Required
  title: string
  slug: string

  // Optional metadata
  description?: string
  name?: string
  by?: string
  publishedAt?: string
  draft?: boolean
  type?: 'changelog' | string
  image?: string
  poster?: string
  
  // Component/package related
  component?: string
  package?: string
  demoName?: string
  
  // Version management
  versions?: string[]
  version?: string
  relatedIds?: string[]
  
  // Auto-generated by getMDX/getAllFrontmatter
  headings?: {
    title: string      // Text of the heading
    priority: number   // 1-6 (H1-H6)
    id: string         // #slugified-heading-id
  }[]
  
  readingTime?: {
    text: string       // "2 min read"
    minutes: number    // 2
    time: number       // 120000 (milliseconds)
    words: number      // 45 (word count)
  }
}
```

---

## Plugin System (Rehype)

The package uses Unified/Rehype plugins to transform the HTML AST. The default plugin pipeline is:

### Default Pipeline (in getMDX)

1. **User extraPlugins** (if provided)
2. **mdx-bundler default plugins**
3. **rehypeMetaAttribute** - Converts code block meta to HTML attributes
4. **rehypeHighlightCode** - Main syntax highlighting plugin
5. **rehypeAutolinkHeadings** - Makes headings clickable links
6. **rehypeSlug** - Adds id attributes to headings

### Custom Plugin Example

```typescript
import { getMDX } from '@vxrn/mdx'
import { visit } from 'unist-util-visit'

// Custom plugin to add a data attribute
const customPlugin = () => (tree) => {
  visit(tree, 'element', (node) => {
    if (node.tagName === 'img') {
      node.properties.dataOptimized = 'true'
    }
  })
}

const { frontmatter, code } = await getMDX(mdxContent, [customPlugin])
```

---

## Code Highlighting System

### How It Works

The package uses a **two-stage highlighting approach**:

#### Stage 1: Syntax Highlighting (Refractor/Prism)
- In `rehypeHighlightCode` plugin:
  - Visits all `<code>` elements inside `<pre>` tags
  - Extracts language from `className` (format: `language-{lang}`)
  - Uses refractor to tokenize and highlight
  - Applies line/word highlighting

#### Stage 2: Metadata Parsing
- `rehypeMetaAttribute` plugin:
  - Extracts meta attributes from code fences: ` ```tsx title="example.ts" line="1-3" `
  - Converts them to HTML element properties
  - Available for styling/processing

### Line Highlighting

Used in two ways:

1. **Via metadata in code fence:**
```markdown
```tsx line="1,3-5"
const x = 1   // Line 1: highlighted
const y = 2   // Line 2: normal
const z = 3   // Line 3: highlighted
const a = 4   // Line 4: highlighted
const b = 5   // Line 5: highlighted
```
```

2. **Processed by `rehypeHighlightLine`:**
   - Creates `<div class="highlight-line" data-highlighted="true|false">` wrappers
   - Each line gets a `data-line` attribute with line number
   - Use CSS to style `[data-highlighted="true"]`

### Word Highlighting

- Text wrapped in `__underscores__` gets wrapped in `<span class="highlight-word">`
- Useful for inline emphasis of specific code

```markdown
```tsx
const important = __this is highlighted__
```
```

---

## Integration Steps for takeout3

### 1. Install Dependencies

Add `@vxrn/mdx` to your project:

```bash
yarn add @vxrn/mdx
# or
npm install @vxrn/mdx
```

Since this package is CommonJS, if you're in an ESM app, use dynamic import:

```typescript
const { getMDX, getMDXBySlug } = await import('@vxrn/mdx')
```

### 2. Set Up Directory Structure

Create a standard docs or content directory:

```
takeout3/
├── content/
│   ├── docs/
│   │   ├── getting-started.mdx
│   │   ├── installation.mdx
│   │   └── guides/
│   │       └── tutorial.mdx
│   └── blog/
│       ├── first-post.mdx
│       └── second-post.mdx
```

### 3. Create MDX Files with Frontmatter

```mdx
---
title: "Getting Started"
description: "Learn how to get started with takeout3"
slug: "getting-started"
publishedAt: "2024-01-15"
---

# Getting Started

Your content here...

```tsx
const example = "code block"
```
```

### 4. Basic Usage Example

```typescript
// lib/mdx.ts
import { getMDX, getMDXBySlug, getAllFrontmatter } from '@vxrn/mdx'

const DOCS_PATH = 'content/docs'
const BLOG_PATH = 'content/blog'

// Get all blog posts
export async function getAllBlogPosts() {
  return getAllFrontmatter(BLOG_PATH)
}

// Get single post
export async function getBlogPost(slug: string) {
  return getMDXBySlug(BLOG_PATH, slug)
}

// Get all docs
export async function getAllDocs() {
  return getAllFrontmatter(DOCS_PATH)
}

// Get single doc
export async function getDoc(slug: string) {
  return getMDXBySlug(DOCS_PATH, slug)
}
```

### 5. Rendering MDX

The returned `code` from getMDX needs to be evaluated. Use `mdx-bundler`'s evaluate:

```typescript
import { evaluate } from 'mdx-bundler/client'

// After getting code from getMDX
const { frontmatter, code } = await getMDXBySlug('content/docs', slug)

// Evaluate the code
const { default: MDXContent } = await evaluate(code, {
  // Pass any React components here
  components: {
    // Custom component mappings
  }
})

// Use in JSX
export default function Page() {
  return <MDXContent />
}
```

### 6. Styling Code Blocks

Add CSS to style the highlighted code:

```css
/* Syntax highlighting (from refractor) */
pre {
  background: #1a1a1a;
  color: #d4d4d4;
  overflow-x: auto;
  padding: 1rem;
  border-radius: 6px;
}

/* Line highlighting */
.highlight-line {
  display: block;
  padding: 0 1rem;
  margin: 0 -1rem;
  background: rgba(255, 255, 255, 0.1);
}

.highlight-line[data-highlighted='true'] {
  background: rgba(255, 255, 255, 0.15);
}

/* Word highlighting */
.highlight-word {
  background: rgba(255, 255, 0, 0.3);
  padding: 0.1em 0.3em;
  border-radius: 2px;
}

/* Heading auto-links */
h1, h2, h3, h4, h5, h6 {
  position: relative;
}

h1 > a, h2 > a, h3 > a, h4 > a, h5 > a, h6 > a {
  position: absolute;
  left: -1.5em;
  opacity: 0;
  transition: opacity 0.2s;
}

h1:hover > a, h2:hover > a, h3:hover > a, h4:hover > a, h5:hover > a, h6:hover > a {
  opacity: 1;
}
```

### 7. Advanced: Custom Plugins

If you need to customize the MDX processing:

```typescript
import { getMDX } from '@vxrn/mdx'
import { visit } from 'unist-util-visit'

// Custom plugin to handle custom components
const customComponentPlugin = () => (tree) => {
  visit(tree, 'text', (node, index, parent) => {
    if (node.value.includes('CUSTOM')) {
      parent.children[index] = {
        type: 'element',
        tagName: 'custom-element',
        children: [node]
      }
    }
  })
}

const { frontmatter, code } = await getMDX(mdxContent, [customComponentPlugin])
```

### 8. Configuration Notes

**Important:** The package uses `mdx-bundler` which:
- Requires `esbuild` (bundled as `esbuild-wasm`)
- Runs in Node.js (not browser)
- Bundles all imports into the code string
- Needs to be evaluated at runtime with `evaluate()`

**Frontmatter Requirements:**
- Must be valid YAML
- `title` and `slug` are essential
- Other fields are optional
- All custom fields will be passed through

---

## Example: Complete Integration

Here's a complete working example for takeout3:

```typescript
// app/lib/mdx.ts
import { 
  getMDX, 
  getMDXBySlug, 
  getAllFrontmatter,
  type Frontmatter 
} from '@vxrn/mdx'
import path from 'path'

const DOCS_DIR = path.join(process.cwd(), 'content', 'docs')

export async function getDocBySlug(slug: string) {
  try {
    const result = await getMDXBySlug(DOCS_DIR, slug)
    return result
  } catch (error) {
    console.error(`Failed to load doc: ${slug}`, error)
    throw new Error(`Doc not found: ${slug}`)
  }
}

export function getAllDocs(): Frontmatter[] {
  return getAllFrontmatter(DOCS_DIR)
}

export function getDocTOC(slug: string): Frontmatter['headings'] {
  const docs = getAllDocs()
  const doc = docs.find(d => d.slug === slug)
  return doc?.headings || []
}

// app/routes/docs/[slug].tsx
import { getDocBySlug, getDocTOC } from '@/lib/mdx'
import { evaluate } from 'mdx-bundler/client'

export default async function DocPage({ params }: { params: { slug: string } }) {
  const { code, frontmatter } = await getDocBySlug(params.slug)
  const toc = getDocTOC(params.slug)
  
  // Evaluate MDX code
  const { default: MDXContent } = await evaluate(code)
  
  return (
    <div>
      <header>
        <h1>{frontmatter.title}</h1>
        {frontmatter.description && <p>{frontmatter.description}</p>}
        {frontmatter.readingTime && <span>{frontmatter.readingTime.text}</span>}
      </header>
      
      {toc && (
        <aside>
          <h3>Table of Contents</h3>
          <ul>
            {toc.map(heading => (
              <li key={heading.id} style={{ marginLeft: `${(heading.priority - 2) * 1.5}rem` }}>
                <a href={heading.id}>{heading.title}</a>
              </li>
            ))}
          </ul>
        </aside>
      )}
      
      <main>
        <MDXContent />
      </main>
    </div>
  )
}
```

---

## Troubleshooting

### Issue: "Cannot find module 'mdx-bundler'"
**Solution:** mdx-bundler is a CJS package. Use dynamic import:
```typescript
const { getMDX } = await import('@vxrn/mdx')
```

### Issue: Code blocks not highlighted
**Cause:** Missing CSS classes or styling
**Solution:** Ensure your CSS targets the generated classes:
- `.token` (from refractor)
- `.highlight-line[data-highlighted]`
- `.highlight-word`

### Issue: Frontmatter not parsing
**Cause:** Invalid YAML or missing closing `---`
**Solution:** Ensure frontmatter is:
```
---
key: value
---

Content here
```

### Issue: Custom rehype plugin not working
**Solution:** Check that:
1. Plugin is a valid Unified plugin
2. It's passed in the `extraPlugins` array
3. It transforms the tree in place or returns modified tree

---

## Performance Considerations

- `getMDX()` is async - bundle happens at request time
- `getAllFrontmatter()` is sync but reads all files - cache the result
- Line highlighting can be expensive for large code blocks
- Consider caching frontmatter with a build step

```typescript
// Cache-friendly pattern
let cachedFrontmatter: Frontmatter[] | null = null

export function getAllDocsPage(refresh = false) {
  if (cachedFrontmatter && !refresh) {
    return cachedFrontmatter
  }
  cachedFrontmatter = getAllFrontmatter(DOCS_DIR)
  return cachedFrontmatter
}
```

---

## Summary

The `@vxrn/mdx` package provides a complete solution for MDX processing with:

1. **getMDX()** - Parse individual MDX strings
2. **getMDXBySlug()** - Load and parse MDX files from disk
3. **getAllFrontmatter()** - Bulk extract metadata from a directory
4. **createCodeHighlighter()** - Standalone syntax highlighting
5. **Automatic features**: headings extraction, reading time, slug generation
6. **Plugin system**: Customizable rehype plugins for AST transformation
7. **Code highlighting**: Line and word highlighting with Refractor/Prism

For takeout3, follow the integration steps above to set up a fully functional content system with minimal configuration.
