const CONTRAST_ROUTER_ZONES = new Set(['contrast.run', 'contrast.dev'])

function loopbackOrigin(request: Request | undefined): string | null {
  const value = request?.headers.get('origin')
  if (!value) return null
  try {
    const origin = new URL(value)
    const hostname = origin.hostname.replace(/^\[|\]$/g, '').toLowerCase()
    if (origin.protocol !== 'http:' && origin.protocol !== 'https:') return null
    if (
      hostname !== 'localhost' &&
      !hostname.endsWith('.localhost') &&
      hostname !== '0.0.0.0' &&
      hostname !== '::1' &&
      !/^127(?:\.\d{1,3}){3}$/.test(hostname)
    ) {
      return null
    }
    return origin.origin
  } catch {
    return null
  }
}

function forwardedHttpsOrigin(request: Request | undefined): string | null {
  if (!request || !CONTRAST_ROUTER_ZONES.has(request.headers.get('cf-worker') ?? '')) {
    return null
  }
  const host = request.headers.get('x-forwarded-host')?.trim().toLowerCase()
  if (!host || !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(host)) return null
  const origin = new URL(`https://${host}`)
  return origin.host === host ? origin.origin : null
}

function pairedContrastRunOrigin(forwardedOrigin: string | null): string | null {
  if (!forwardedOrigin) return null
  const origin = new URL(forwardedOrigin)
  const match = /^(ios-)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\.contrast\.run$/.exec(
    origin.hostname,
  )
  if (!match) return null
  const slug = match[2]
  if (!slug) return null
  return `https://${match[1] ? '' : 'ios-'}${slug}.contrast.run`
}

// better auth resolves function-based origins for each request. cloudflare adds
// cf-worker to router subrequests, so a direct workers.dev caller cannot make
// an arbitrary forwarded host trusted by supplying x-forwarded-host itself.
export function trustedContrastAppOrigins(origins: string[]) {
  return (request?: Request): string[] => {
    const forwardedOrigin = forwardedHttpsOrigin(request)
    const dynamicOrigins = [
      forwardedOrigin,
      pairedContrastRunOrigin(forwardedOrigin),
      loopbackOrigin(request),
    ].filter((origin): origin is string => origin !== null)
    return dynamicOrigins.length > 0
      ? [...new Set([...origins, ...dynamicOrigins])]
      : origins
  }
}
