import { nativeBearerClient } from './nativeBearerClient'
import type { NativeBearerClientOptions } from './nativeBearerClient'
import type { ContrastPlatformClientPlugin } from './platformClientContract'

export function platformClient(
  options: NativeBearerClientOptions,
): ContrastPlatformClientPlugin {
  return nativeBearerClient(options)
}
