import type { NativeBearerClientOptions } from './nativeBearerClient'
import type { ContrastPlatformClientPlugin } from './platformClientContract'

export function platformClient(
  _options: NativeBearerClientOptions,
): ContrastPlatformClientPlugin {
  return { id: 'contrast-platform' }
}
