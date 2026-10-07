# Takeout

Takeout is a free starter prepared for future open-source publication. It keeps its original marketing website and uses
Contrast’s app template
for the app underneath: a social feed with
email and password login, posts, comments, profiles, and account settings on web
and React Native. It uses One v2, Tamagui v3, contrast-ui, Better Auth, Drizzle,
and Lite Sync (`orez-lite`) over SQLite.

## Run

Use Bun 1.4.2 or newer and Node 24.16 or newer.

```sh
bun install --frozen-lockfile
bun dev
```

Open http://localhost:4200, choose the app entry, and use **Login as Demo User**.
The local SQLite database, sync backend, and upload store start with the app.
`PORT_OFFSET=100 bun dev` moves all four services together.

```sh
bun run typecheck
bun run build
bun run generate
```

Routes live in `app/`, feature code in `features/`, reusable UI in `interface/`,
queries and mutations in `data/`, and schema and migrations in `database/`.
Public pages opt into static rendering; signed-in screens use client rendering.
The development database contains six seeded posts.

## Native

[EJECT.md](./EJECT.md) covers One’s Expo-free iOS and Android builds. Native
identity follows `APP_VARIANT=development|preview|production`, preserving the
existing Takeout bundle identifiers and `takeout` URL scheme. Use
`APP_VARIANT=preview` for an isolated native build. `ONE_SERVER_URL` must name the
backend that build should use.

## Deploy

The production build emits `dist/worker` and `dist/client` for Cloudflare.
`takeout.tamagui.dev` runs the `takeout-site` app worker, its SQLite Durable
Object, the `takeout-site-sync` Lite Sync worker, and the `takeout-site-files`
R2 bucket. Pushes to `main` build, typecheck, and deploy through GitHub Actions.

```sh
ALLOW_MISSING_ENV=1 ONE_SERVER_URL=https://takeout.tamagui.dev BETTER_AUTH_URL=https://takeout.tamagui.dev bun run build
ONE_SERVER_URL=https://takeout.tamagui.dev bun scripts/deploy-cloudflare.ts
```

Wrangler uses `CLOUDFLARE_API_TOKEN`. The app's `BETTER_AUTH_SECRET` is a worker
secret. [docs/publishing.md](./docs/publishing.md) records the cutover, data
mapping, and deployment ownership. Native builds are manual and out of scope
for the web cutover; the retired Expo and Uncloud workflows are removed.

## Source and license

[docs/template-source.md](./docs/template-source.md) records the canonical source
and the MIT packages bundled under `packages/`, so installation needs no new npm
release. The optional Peach CLI is consumed from npm under its own license;
private Contrast engine packages are not copied here.

Takeout source is available under the [MIT License](./LICENSE). Third-party
dependencies retain their own licenses. There is no paid tier or Help & Support
service. The existing repository stays private until the owner is ready to
open-source it. The hosted app offers demo login.
