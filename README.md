# Takeout

Takeout is the standalone example of Contrast’s app template: a social feed with
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
The six seeded posts provide a working feed immediately.

## Native

[EJECT.md](./EJECT.md) covers One’s Expo-free iOS and Android builds. Native
identity follows `APP_VARIANT=development|preview|production`, preserving the
existing Takeout bundle identifiers and `takeout` URL scheme. Use
`APP_VARIANT=preview` for an isolated native build. `ONE_SERVER_URL` must name the
backend that build should use.

## Deploy

The production build emits `dist/worker` and `dist/client` for Cloudflare. The
app needs its SQLite Durable Object, Rust sync host, auth secret, and R2 upload
bindings. Contrast’s deployment pipeline provisions those together:

```sh
contrast login
contrast link --create --name takeout-example --template app
contrast deploy --slug takeout-example
```

Run those commands from a clean clone. [docs/publishing.md](./docs/publishing.md)
records the existing production boundaries and outstanding owner decisions.
The branch CI checks types and produces a build artifact; it does not deploy.

## Source and license

[docs/template-source.md](./docs/template-source.md) records the canonical source
and the MIT packages bundled under `packages/`, so installation needs no new npm
release. The optional Peach CLI is consumed from npm under its own license;
private Contrast engine packages are not copied here.

This draft retains Takeout’s existing [LICENSE](./LICENSE). Selecting an open
source license and making the repository public remain owner decisions.
