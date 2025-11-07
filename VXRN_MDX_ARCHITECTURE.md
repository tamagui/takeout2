# @vxrn/mdx Architecture & Data Flow

## Data Flow Diagram

```
                    ┌─────────────────────────────────────┐
                    │  MDX Source Code (String)           │
                    │  with YAML Frontmatter              │
                    └────────────┬────────────────────────┘
                                 │
                    ┌────────────▼────────────────────────┐
                    │ getMDX(source, extraPlugins)        │
                    │ - Async function                    │
                    │ - Core processing logic             │
                    └────────────┬────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        ┌──────────┐      ┌──────────────┐  ┌─────────┐
        │ mdx-     │      │ gray-matter  │  │ getHead │
        │ bundler  │      │ YAML Parser  │  │ ings()  │
        └────┬─────┘      └──────┬───────┘  └────┬────┘
             │                   │               │
             │           ┌───────▼────────┐      │
             │           │ Frontmatter    │      │
             │           │ Data Object    │      │
             │           └────────────────┘      │
             │                                   │
             ├──── Rehype Plugin Pipeline ──────┤
             │     (AST Transformation)         │
             │                                   │
             ├─► 1. User extraPlugins           │
             ├─► 2. mdx-bundler default         │
             ├─► 3. rehypeMetaAttribute         │
             ├─► 4. rehypeHighlightCode ◄──────┤
             │       └─ refractor (Prism-based) │
             │       └─ rehypeHighlightLine     │
             │       └─ rehypeHighlightWord     │
             ├─► 5. rehypeAutolinkHeadings      │
             └─► 6. rehypeSlug                  │
                     │
                     │
              ┌──────▼──────────────────┐
              │ Compiled MDX Code       │
              │ (JavaScript String)     │
              │ Ready for evaluate()    │
              └────────────────────────┘
```

## Function Relationships

```
High-Level API (User-Facing)
├── getMDX(source, extraPlugins)
│   └── Returns: { frontmatter, code }
│
├── getMDXBySlug(basePath, slug, extraPlugins)
│   ├── Checks for versioned files
│   ├── Calls: getAllVersionsFromPath(fromPath)
│   ├── Reads file with fs.readFileSync()
│   └── Delegates to: getMDX()
│
├── getAllFrontmatter(fromPath)
│   ├── Uses: fast-glob to find **/*.mdx
│   ├── For each file:
│   │   ├── Reads with fs.readFileSync()
│   │   ├── Parses with gray-matter
│   │   ├── Generates slug from path
│   │   ├── Calls: getHeadings(source)
│   │   └── Calculates: reading-time
│   └── Returns: Sorted array
│
├── getAllVersionsFromPath(fromPath)
│   ├── Reads directory with fs.readdirSync()
│   ├── Strips .mdx extension
│   ├── Sorts by semantic version
│   └── Returns: Version strings (descending)
│
└── createCodeHighlighter()
    ├── Registers refractor languages (tsx, css)
    ├── Returns: highlighter function
    │   ├── Param: source, language, line
    │   ├── Calls: refractor.highlight()
    │   ├── Calls: rehypeHighlightLine()
    │   ├── Calls: rehypeHighlightWord()
    │   └── Returns: HTML string
    └── Singleton pattern (one instance)

Internal Utilities (Not Exported)
├── getHeadings(source)
│   ├── Input: raw MDX string
│   ├── Parses markdown headers (#, ##, ###, etc.)
│   ├── Generates slugified IDs
│   └── Returns: Array of heading objects
│
├── rehypeHighlightCode(options)
│   ├── Visits: all <code> elements in <pre>
│   ├── Extracts: language from className
│   ├── Highlights: with refractor
│   ├── Applies: line/word highlighting
│   └── Returns: Modified AST
│
├── rehypeHighlightLine(ast, linesToHighlight)
│   ├── Applies: line numbering to AST
│   ├── Wraps: lines in <div class="highlight-line">
│   ├── Adds: data-highlighted attribute
│   └── Fixes: multiline token issues
│
├── rehypeHighlightWord(code)
│   ├── Pattern: __text__
│   ├── Wraps: in <span class="highlight-word">
│   └── Returns: Modified AST
│
└── rehypeMetaAttribute(options)
    ├── Extracts: meta attributes from code fence
    ├── Pattern: ```tsx title="file.ts" line="1-3"
    ├── Converts: to HTML element properties
    └── Returns: Modified AST
```

## Plugin Pipeline Detail

```
MDX Source
    │
    ▼
┌─────────────────────────────────────────┐
│ mdx-bundler mdxOptions()                │
│ - Parse MDX                             │
│ - Create default plugins array          │
└──────────────┬──────────────────────────┘
               │
               ├─ User extraPlugins (if any)
               │  - Can transform AST at beginning
               │
               ├─ mdx-bundler default rehype plugins
               │  - rehype-parse
               │  - other defaults
               │
               ├─ rehypeMetaAttribute
               │  ├─ Input: <code data-meta="title=...">
               │  └─ Output: <code data-meta="..." title="...">
               │
               ├─ rehypeHighlightCode
               │  ├─ Input: <code class="language-tsx">
               │  ├─ Process:
               │  │  1. Extract language: "tsx"
               │  │  2. Get code string
               │  │  3. refractor.highlight(code, "tsx")
               │  │  4. Extract line range from properties.line
               │  │  5. rehypeHighlightLine(ast, lines)
               │  │  6. rehypeHighlightWord(result)
               │  └─ Output: <code> with nested styled spans
               │
               ├─ rehypeAutolinkHeadings
               │  ├─ Input: <h1>, <h2>, etc.
               │  └─ Output: <h1><a href="#id">text</a></h1>
               │
               └─ rehypeSlug
                  ├─ Input: <h1>My Heading</h1>
                  └─ Output: <h1 id="my-heading">...</h1>
                             
                             │
                             ▼
                  Compiled MDX Code
```

## Code Highlighting Stages

### Stage 1: Syntax Highlighting (refractor)

```
Input Code:
  const x = 42

refractor.highlight(code, language) 
  ↓ (Prism-based tokenization)
  
Output AST:
  [
    { type: 'element', tagName: 'span', properties: { className: ['token', 'keyword'] }, children: [{ type: 'text', value: 'const' }] },
    { type: 'text', value: ' x = ' },
    { type: 'element', tagName: 'span', properties: { className: ['token', 'number'] }, children: [{ type: 'text', value: '42' }] }
  ]
```

### Stage 2: Line Numbering (rehypeHighlightLine)

```
Input AST (from refractor)
  + linesToHighlight: [1]
  
lineNumberify(ast) 
  ↓ (Add line numbers to each node)
  
wrapLines(numberedAST, linesToHighlight)
  ↓ (Group by line, wrap in divs)
  
Output AST:
  [
    {
      type: 'element',
      tagName: 'div',
      properties: {
        dataLine: 1,
        className: 'highlight-line',
        dataHighlighted: 'true'
      },
      children: [/* highlighted tokens */]
    }
  ]
```

### Stage 3: Word Highlighting (rehypeHighlightWord)

```
Input AST (from rehypeHighlightLine)

Convert to HTML, apply regex:
  /__(.+?)__/g  → <span class="highlight-word">$1</span>

Parse back to AST

Output: Underscored text wrapped in highlight spans
```

### Stage 4: To HTML

```
Output AST → toHtml() → HTML String

<pre><code class="language-tsx"><div class="highlight-line" data-highlighted="true">
  <span class="token keyword">const</span>
  <span>x = </span>
  <span class="token number">42</span>
</div></code></pre>
```

## File System Operations

```
getMDXBySlug(basePath, slug, extraPlugins)
  │
  ├─ Check if slug contains version marker (.)
  │
  ├─ If no version AND path contains "components"
  │  │
  │  ├─ getAllVersionsFromPath(basePath/slug)
  │  │  ├─ fs.existsSync(path) → bool
  │  │  └─ fs.readdirSync(path) → ['1.0.0.mdx', '2.0.0.mdx']
  │  │       └─ map(stripExtension) → ['1.0.0', '2.0.0']
  │  │       └─ sort(compareVersions) & reverse → ['2.0.0', '1.0.0']
  │  │  
  │  └─ mdxPath = slug + '/' + versions[0]
  │     (e.g., 'button/2.0.0')
  │
  ├─ filePath = path.join(basePath, `${mdxPath}.mdx`)
  │
  ├─ source = fs.readFileSync(filePath, 'utf8')
  │
  └─ await getMDX(source, extraPlugins)
```

```
getAllFrontmatter(fromPath)
  │
  ├─ glob.sync(`${fromPath}/**/*.mdx`)
  │  └─ Returns: array of file paths
  │     ['/path/docs/intro.mdx', '/path/docs/guides/setup.mdx']
  │
  ├─ For each filePath:
  │  │
  │  ├─ source = fs.readFileSync(filePath, 'utf8')
  │  │
  │  ├─ { data, content } = matter(source)
  │  │  ├─ Parses YAML frontmatter
  │  │  ├─ Separates frontmatter from content
  │  │  └─ Returns: { data: Object, content: String }
  │  │
  │  ├─ slug = filePath
  │  │           .replace(`${fromPath}/`, '')
  │  │           .replace('.mdx', '')
  │  │  └─ Example: 'guides/setup'
  │  │
  │  ├─ Merge: { ...data, slug, headings, readingTime }
  │  │
  │  └─ Push to results array
  │
  ├─ Sort by publishedAt (descending)
  │
  └─ Return array
```

## Type Relationships

```
Frontmatter Type
├── title: string (required)
├── slug: string (required)
├── description?: string
├── publishedAt?: string (used for sorting in getAllFrontmatter)
├── draft?: boolean
├── type?: 'changelog' | string
├── image?: string
├── poster?: string
├── by?: string
├── name?: string
├── component?: string
├── package?: string
├── demoName?: string
├── version?: string
├── versions?: string[]
├── relatedIds?: string[]
├── headings?: Array (auto-generated)
│   ├── title: string
│   ├── priority: number (1-6)
│   └── id: string (#slugified-id)
└── readingTime?: Object (auto-generated)
    ├── text: string ("X min read")
    ├── minutes: number
    ├── time: number (milliseconds)
    └── words: number
```

## Configuration Points

```
getMDX Configuration:
├── extraPlugins parameter
│   └─ Array of Unified/Rehype plugins
│
└── mdx-bundler internal options
    ├─ mdxOptions hook
    │  └─ Modifies rehypePlugins array
    │
    └─ Default plugins (mdx-bundler provided)

createCodeHighlighter Configuration:
├── Hardcoded languages
│  ├─ tsx (refractor/lang/tsx.js)
│  └─ css (refractor/lang/css.js)
│
└─ Line parsing
   └─ Uses parse-numeric-range for "1,3-5" syntax
```

## Cache/Singleton Pattern

```
createCodeHighlighter()
├─ Global variable: let highlighter
│
├─ First call:
│  ├─ Check: if (highlighter) return highlighter
│  ├─ Register languages with refractor
│  ├─ Create function and assign to global
│  └─ Return function
│
└─ Subsequent calls:
   └─ Return cached function (no re-initialization)
```

## Error Handling

```
getMDX(source)
├─ Throws: If mdx-bundler fails
│  ├─ Invalid syntax in MDX
│  ├─ Import errors
│  └─ Bundler errors
│
└─ Returns: Successful bundle

getMDXBySlug(basePath, slug)
├─ Throws: If file not found
│  └─ fs.readFileSync fails
│
├─ Throws: Via getMDX if bundling fails
│
└─ Returns: Bundled result

getAllFrontmatter(fromPath)
├─ No error throwing
│  └─ Uses glob.sync (no try/catch in code)
│
├─ May throw: If file reading fails (no visible handling)
│
└─ Returns: Array of frontmatter

getAllVersionsFromPath(fromPath)
├─ Safe: fs.existsSync check
│
└─ Returns: Empty array if path doesn't exist
```

## Async/Await Pattern

```
getMDX()              → Promise
getMDXBySlug()        → Promise (uses await getMDX)
getAllFrontmatter()   → Synchronous (returns array)
getAllVersionsFromPath() → Synchronous (returns array)
createCodeHighlighter() → Synchronous (returns function)
```

## Performance Characteristics

```
getMDX(source)
├─ Time: Depends on code size (bundling with esbuild-wasm)
├─ Memory: Creates AST, stores in memory
└─ I/O: None (processing string in memory)

getMDXBySlug(basePath, slug)
├─ Time: I/O + getMDX time
├─ I/O: One fs.readFileSync call
└─ Note: Synchronous file read (blocks)

getAllFrontmatter(fromPath)
├─ Time: O(n) where n = number of MDX files
├─ I/O: fast-glob + fs.readFileSync for each file
├─ Memory: All file contents + frontmatter objects
└─ Sorting: By publishedAt (optional caching recommended)

getAllVersionsFromPath(fromPath)
├─ Time: O(n) where n = files in directory
├─ I/O: fs.readdirSync + compareVersions
└─ Note: Only reads directory, not file contents

createCodeHighlighter()
├─ Time: First call registers languages, subsequent calls instant
├─ Memory: Highlighter function singleton
└─ Use: Synchronous, HTML string output
```
