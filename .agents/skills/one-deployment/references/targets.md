# Deployment targets

## Vercel

Set `one({ web: { deploy: 'vercel' } })`. One emits `.vercel/output/` with static output and functions. Use the project's package manager in `installCommand`:

```json
{
  "framework": null,
  "cleanUrls": true,
  "buildCommand": "npx one build",
  "installCommand": "npm install"
}
```

`cleanUrls` matters for SSG direct navigation. After building, `vercel deploy --prebuilt` uploads the output. Configure the server origin and private environment variables for the deployment. Local `one serve` checks the Hono output, not the Vercel function runtime. Promote a preview only within the user's authorization.

## Cloudflare Workers

Set `one({ web: { deploy: 'cloudflare' } })`, then:

```bash
npx one build
npx wrangler deploy --config dist/worker/wrangler.json
```

One emits `dist/worker/index.js` and `dist/worker/wrangler.json`, not `dist/worker.js`. Static assets come from `dist/client` through the ASSETS binding. Server/API/middleware bundles load lazily. Root `wrangler.jsonc` merges app settings and bindings into generated config; One preserves build-required paths, chunk rules and `nodejs_compat`. Do not replace it with a hand-written output config.

Workers handlers can access `worker.env` and `worker.executionCtx` in the API context. CI authentication uses the app's existing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets. Do not print credentials.

## Static hosting

Serve `dist/client` when all required output is static. Runtime SSR, API endpoints, runtime loaders and middleware need a server. SPA navigation may need the host's fallback rewrites; check direct navigation to a nested route.

## Native binaries and OTA

`one build --platform ios` / `--platform android` produces production JS with Rolldown. A device binary still needs the native build/signing process. `one prebuild` generates community native projects from `native.app`; `one run:ios` or `one run:android` builds and runs locally. Archive the iOS workspace in Xcode for distribution. EAS is an optional Expo migration workflow, not a requirement for One.

Use [native build](https://onestack.dev/docs/guides-ios-native), [Expo migration](https://onestack.dev/native/migrating-to-one), and [OTA](https://onestack.dev/docs/guides-ota-updates) for the app's actual build path. OTA cannot deliver new native code, permissions, or release-linked feature groups; ship a matching binary/runtime first.
