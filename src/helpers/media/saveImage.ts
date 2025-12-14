// re-export saveRemoteImage - bundler resolves to .web.ts or .native.ts
export { saveRemoteImage, saveRemoteImageWithProxy } from './saveRemoteImage'

// alias for backwards compatibility
export { saveRemoteImage as saveImageToDevice } from './saveRemoteImage'
