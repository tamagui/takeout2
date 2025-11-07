# @vxrn/mdx Documentation for takeout3

This directory contains comprehensive documentation about the `@vxrn/mdx` package, created from thorough source code analysis of `/Users/n8/one/packages/mdx/`.

## Documents

### 1. VXRN_MDX_GUIDE.md (19 KB, 736 lines)
**Comprehensive Integration Guide**

The complete reference with:
- Full API documentation for all exported functions
- Detailed parameter explanations
- Return value specifications
- Internal mechanism explanations
- Plugin system documentation
- Code highlighting system details
- 8-step integration guide for takeout3
- Complete working examples
- Troubleshooting section
- Performance considerations

**Best for:** Understanding the complete picture, reference material, deep dives

### 2. VXRN_MDX_ARCHITECTURE.md (14 KB, 435 lines)
**Architecture & Data Flow Diagrams**

Visual representation of:
- Data flow diagram (MDX source → compiled code)
- Function relationships and dependencies
- Plugin pipeline detail with AST transformations
- Code highlighting stages (4-stage process)
- File system operations
- Type relationships
- Configuration points
- Cache/singleton patterns
- Error handling strategies
- Async/await patterns
- Performance characteristics

**Best for:** Understanding how components connect, debugging, architecture decisions

### 3. VXRN_MDX_QUICK_REFERENCE.md (10 KB, 520 lines)
**Quick Cheat Sheet**

Fast lookup for:
- API at a glance (one-liners)
- Frontmatter YAML format
- Code block syntax examples
- Directory structure template
- CSS classes generated
- React app setup (4 steps)
- Common patterns and recipes
- Performance tips
- Troubleshooting quick fixes
- Complete minimal example
- Key files summary
- Dependencies list

**Best for:** Quick lookups, copy-paste examples, getting started quickly

## How to Use These Documents

### For Quick Start
1. Read: VXRN_MDX_QUICK_REFERENCE.md (5 min)
2. Run: The "Setup for React App" section (Step 1-4)
3. Reference: Come back for details as needed

### For Complete Understanding
1. Read: VXRN_MDX_GUIDE.md - Overview section
2. Skim: VXRN_MDX_ARCHITECTURE.md - Architecture diagrams
3. Study: VXRN_MDX_GUIDE.md - Your specific needs (getMDX? Plugins? etc.)

### For Debugging
1. Check: VXRN_MDX_QUICK_REFERENCE.md - Troubleshooting
2. Refer: VXRN_MDX_ARCHITECTURE.md - Data flow & error handling
3. Deep dive: VXRN_MDX_GUIDE.md - Specific section details

### For Implementing Features
1. Search: VXRN_MDX_QUICK_REFERENCE.md - Common Patterns section
2. Adapt: Copy example from VXRN_MDX_GUIDE.md
3. Customize: Refer to API docs for parameters

## Key Insights

### What @vxrn/mdx Does
- Bundles MDX files using `mdx-bundler`
- Extracts YAML frontmatter using `gray-matter`
- Highlights code using `refractor` (Prism-based)
- Generates table of contents from markdown headers
- Calculates reading time automatically
- Provides plugin system for customization

### Main Functions You'll Use
1. **getMDX()** - Process MDX string
2. **getMDXBySlug()** - Load MDX from disk
3. **getAllFrontmatter()** - Batch metadata extraction
4. **createCodeHighlighter()** - Standalone syntax highlighting

### Important Notes
- All functions are Node.js based (not browser)
- Package is CommonJS (use dynamic import in ESM)
- Code must be evaluated with `mdx-bundler/evaluate()`
- Default syntax highlighting covers TSX and CSS (register more with refractor)
- Line/word highlighting are post-processing features
- Frontmatter is auto-enhanced with headings and reading time

### Integration Steps
1. Install: `yarn add @vxrn/mdx`
2. Create content directory: `content/docs/`
3. Write .mdx files with YAML frontmatter
4. Create lib file: `lib/mdx.ts` with functions
5. Use in pages/routes
6. Add CSS for syntax highlighting
7. Optionally: Add custom rehype plugins

## Package Version

**@vxrn/mdx v1.2.7**

Key Dependencies:
- mdx-bundler v10.0.2 (core)
- gray-matter v4.0.3 (frontmatter)
- refractor v4.7.0 (syntax highlighting)
- reading-time v1.3.0 (reading time calc)
- rehype ecosystem (HTML transformation)
- fast-glob v3.3.3 (file scanning)

## Directory Structure Example

```
takeout3/
├── content/
│   ├── docs/
│   │   ├── getting-started.mdx
│   │   └── api/
│   │       └── reference.mdx
│   └── blog/
│       └── first-post.mdx
├── lib/
│   └── mdx.ts
├── pages/
│   ├── docs/[slug].tsx
│   └── blog/[slug].tsx
├── styles/
│   └── globals.css (with code highlighting styles)
└── VXRN_MDX_*.md (this documentation)
```

## Common Use Cases

### Documentation Site
- Use `getAllFrontmatter()` for doc index
- Use `getMDXBySlug()` for individual pages
- Use headings for TOC generation

### Blog
- Use `getAllFrontmatter()` to list posts
- Filter by `draft: false`
- Sort by `publishedAt` (auto-sorted)

### API Docs with Versions
- Store in `docs/components/button/1.0.0.mdx`
- Use `getMDXBySlug()` with auto-version detection
- Use `getAllVersionsFromPath()` for version switcher

### Custom Code Highlighting
- Use `createCodeHighlighter()` outside of MDX
- Or add custom `extraPlugins` to `getMDX()`

## Source Code Location

All source code analyzed is from:
```
/Users/n8/one/packages/mdx/src/
```

Key files:
- `getMDX.ts` - Core bundling
- `getMDXBySlug.tsx` - File loading
- `getAllFrontmatter.tsx` - Bulk extraction
- `rehypeHighlightCode.tsx` - Syntax highlighting
- `types.ts` - Type definitions

Generated type definitions:
```
/Users/n8/one/packages/mdx/types/
```

## Next Steps for Integration

1. **Install the package:**
   ```bash
   cd /Users/n8/takeout3
   yarn add @vxrn/mdx
   ```

2. **Create content structure:**
   ```bash
   mkdir -p content/docs content/blog
   ```

3. **Create lib file** (see VXRN_MDX_QUICK_REFERENCE.md - "Setup for React App")

4. **Create .mdx files** (see examples in all guides)

5. **Add CSS** (see VXRN_MDX_QUICK_REFERENCE.md - "Add CSS")

6. **Update routes/pages** to use the lib functions

7. **Test** with `yarn dev` or your build command

## Questions to Ask Yourself

- Will I use versioned components? (affects directory structure)
- What React components should be available in MDX? (component mapping)
- Do I need custom code highlighting languages? (register with refractor)
- Should I cache frontmatter? (yes, for performance)
- Will I need custom plugins? (for special AST transformations)

## Troubleshooting Quick Links

See VXRN_MDX_QUICK_REFERENCE.md sections:
- "Troubleshooting Quick Fixes" - Common problems
- "CSS Classes Generated" - For styling issues
- "Exported Types" - For TypeScript issues

See VXRN_MDX_GUIDE.md section:
- "Troubleshooting" - Detailed solutions

See VXRN_MDX_ARCHITECTURE.md section:
- "Error Handling" - How errors flow through system

## Performance Tips

From VXRN_MDX_QUICK_REFERENCE.md - "Performance Tips":

1. Cache `getAllFrontmatter()` results
2. Lazy load bundles (don't evaluate all at once)
3. Use static generation where possible
4. Consider build-time preprocessing

## Credits

Documentation created by analyzing source code from `/Users/n8/one/packages/mdx/` - a comprehensive MDX processing package created with:
- TypeScript / TSX
- Unified/Rehype ecosystem
- mdx-bundler
- Modern Node.js/React tooling

---

**Last Updated:** November 6, 2024
**Status:** Complete, Ready for Integration
**Total Documentation:** 1,691 lines across 3 files (43 KB)
