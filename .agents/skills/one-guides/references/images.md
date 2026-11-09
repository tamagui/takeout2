# Images

[Image metadata](https://onestack.dev/docs/guides-images), [native Image](https://onestack.dev/native/image).

Install `sharp` when using build-time metadata imports:

```tsx
import hero from '/images/hero.jpg?imagedata'

<img src={hero.src} width={hero.width} height={hero.height} alt="Hero" />
```

The import supplies `src`, `width`, `height`, and `blurDataURL`. Use dimensions to reserve layout space; render a separate blur placeholder if desired, then hide it once the full image loads. Do not spread `blurDataURL` onto a DOM element as an unknown attribute.

Public and relative image imports are supported. `getImageData` from `one/image` provides server/build-time processing. `@vxrn/mdx` can include frontmatter image metadata. Read that package's return type for the current fields.

For native images, check `One.UI.Image` and its source, sizing and load-event contract before adding another image loader. A web `?imagedata` import does not itself render a React Native image.
