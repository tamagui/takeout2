# Takeout

Takeout is a free, open-source starter: a marketing website and, underneath it, a social feed
app with email and password login, posts, comments, profiles, and account
settings on web and React Native. It uses One v2, Tamagui v3, takeout-ui, Better Auth, Drizzle,
and Lime Sync over SQLite: Zero's client and query model with our Rust sync
engine (`orez-lite`) on Cloudflare Durable Objects.

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

One builds iOS and Android without Expo. iOS needs macOS and Xcode; Android
needs JDK 17 and the Android SDK.

```sh
bunx one prebuild --platform ios   # generates ios/
bunx one run:ios                   # build and launch on the simulator
bunx one prebuild --platform android
bunx one run:android               # connected device or emulator
```

For a signed device or store build, open `ios/*.xcworkspace` in Xcode, or run
`./gradlew bundleRelease` in `android/` after configuring signing. Native
identity follows `APP_VARIANT=development|preview|production`, preserving the
existing Takeout bundle identifiers and `takeout` URL scheme. Use
`APP_VARIANT=preview` for an isolated native build. `ONE_SERVER_URL` must name the
backend that build should use.

## Deploy

The production build emits `dist/worker` and `dist/client` for Cloudflare.
`takeout.tamagui.dev` runs the `takeout-site` app worker, its SQLite Durable
Object, the `takeout-site-sync` Lime Sync worker, and the `takeout-site-files`
R2 bucket. Pushes to `main` build, typecheck, and deploy through GitHub Actions.

```sh
ALLOW_MISSING_ENV=1 ONE_SERVER_URL=https://takeout.tamagui.dev BETTER_AUTH_URL=https://takeout.tamagui.dev bun run build
ONE_SERVER_URL=https://takeout.tamagui.dev bun scripts/deploy-cloudflare.ts
```

Wrangler uses `CLOUDFLARE_API_TOKEN`. The app's `BETTER_AUTH_SECRET` is a worker
secret. [docs/publishing.md](./docs/publishing.md) records the cutover, data
mapping, and deployment ownership. Native builds are manual and out of scope
for the web cutover; the retired Expo and Uncloud workflows are removed.

## License

Takeout source, including the packages under `packages/`, is available under
the [MIT License](./LICENSE). Third-party dependencies retain their own
licenses. The hosted app offers demo login.
