import type { NativeBearerClientOptions } from './nativeBearerClient'
import type { PlatformClientPlugin } from './platformClientContract'

export function platformClient(
  _options: NativeBearerClientOptions,
): PlatformClientPlugin {
  return { id: 'web-platform' }
}
