import { nativeBearerClient } from './nativeBearerClient'
import type { NativeBearerClientOptions } from './nativeBearerClient'
import type { PlatformClientPlugin } from './platformClientContract'

export function platformClient(
  options: NativeBearerClientOptions,
): PlatformClientPlugin {
  return nativeBearerClient(options)
}
