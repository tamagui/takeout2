# MDX content routes

[MDX guide](https://onestack.dev/docs/guides-mdx).

`@vxrn/mdx` and `mdx-bundler` provide file-driven content, frontmatter, headings, reading time and image metadata. Keep file reads and MDX compilation in loaders/build-time code.

```tsx
export async function generateStaticParams() {
  const { getAllFrontmatter } = await import('@vxrn/mdx')
  return getAllFrontmatter('data/docs').map(({ slug }) => ({ slug }))
}

export async function loader({ params }) {
  const { getMDXBySlug } = await import('@vxrn/mdx')
  return getMDXBySlug('data/docs', params.slug)
}
```

Choose paths and slug mapping that match the actual content directory and route. In the page, use `useLoader(loader)` and memoize `getMDXComponent(code)` from `mdx-bundler/client`. Supply an HTML component map for web or a deliberate React Native map for native; a web MDX body cannot automatically render as native Text.

Dynamic imports in the server exports accommodate the compiler's ESM dependencies. Use targeted SSR externalization only if required by the installed dependency. `@vxrn/mdx` reports content dependencies for HMR; custom file reads can register `watchFile` from `one`.

MDX executes compiled JavaScript. Use a trusted content source; arbitrary user text should not be treated as an executable MDX module.
