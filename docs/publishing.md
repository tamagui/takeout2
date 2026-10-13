# Publishing Takeout

Nate, 2026-10-06: "takeout is gonna move to the new version. In fact we can do
that now ... the new takeout site actually can be migrated right now as well"
and "That should already be on a branch". This authorizes the web cutover and
landing the validated replacement branch on Takeout main. Repository visibility
and native signing remain unchanged.

Nate, 2026-10-06, reviewing the preview: "the video doesn't show for me at least
in my in-line browser here" and "have we refreshed it to talk like about the
whole new stack that we've done with Cloudflare and the new sink engine". The
landing and docs describe One 2, Tamagui 3, Better Auth, Drizzle, Lime Sync,
SQLite Durable Objects, and R2. The phone demo uses one H.264 MP4 in the owned
R2 bucket, a demo poster, muted inline autoplay on a loop, and tap or keyboard pause/resume without
native controls.

Nate, 2026-10-06: "Maybe we could call it like durable zero because basically
it's zero it's still zero but it's just adapted to work on cloud flare,
durable objects, right". Lime Sync is the public name for Zero's client
and query model with our Rust sync engine on Cloudflare Durable Objects. The
implementation package remains `orez-lite`; deployed names and bindings stay
stable.

Nate, 2026-10-06: "I would also mention like truly native" and "the new one
version too let you access any native API like hundred percent native UI and
every major native feature". The landing and introduction emphasize One 2's
native UI, SwiftUI, Jetpack Compose, direct API access, and concrete native
features. Native and TestFlight builds remain outside this web cutover.

## Cloudflare ownership

The app deploys directly into account `aa20b480cc813f2131bc005e2b7fd140`.
`takeout-site` owns the singleton application SQLite Durable Object and R2
uploads. `takeout-site-sync` owns the Lime Sync cache and reaches the app's
private `OrezDataFeed` entrypoint through a service binding. The app forwards
`/zero-http/*` to that sync worker. `scripts/deploy-cloudflare.ts` uses the
published `orez-lite/cloudflare/build` helpers and the generated query registry.
The app applies checked-in SQLite migrations without demo fixtures.

GitHub Actions builds and checks each pull request, then deploys pushes to main.
It uses `TAKEOUT_CLOUDFLARE_API_TOKEN` scoped to Workers, routes, and R2 in this
account and zone, plus `TAKEOUT_BETTER_AUTH_SECRET`. The bucket is provisioned
once; deployments preserve its contents and the SQLite namespaces. No reset
endpoint secret remains on the production worker.

## Data cutover

The old Supabase `takeout-new` data is read only during migration. Five users,
one credential account, five public profiles, seven posts, and fifty comments
map to the new schema. Timestamp columns convert from PostgreSQL timestamps to
integer epoch milliseconds. Private auth IDs and password hashes are preserved;
existing browser sessions must sign in again. Derived comment counts are
computed from imported comments. Columns belonging to retired features remain
in the offsite PostgreSQL dump rather than the new database.

Two image URLs point at an unavailable historical localhost upload service.
Their post records and comments are preserved, with images replaced by bundled
demo photos. The other images are copied to the new upload bucket so the feed
can survive retirement of old image storage.

The old VPS stack, `zero.tamagui.dev`, and Supabase remain live until the cutover
owner closes them after the one-hour observation. Native and TestFlight work
are outside this web cutover. The removed iOS workflow used an Expo bundle
command against a starter that now builds native with One; it is not carried
into this deployment.

## Observation

Record the first verified production response time and `version.json` marker.
Run `scripts/watch-cutover.ts <origin> <version> <started-at-ISO>` through one
detached `tm wait` for the remaining observation interval, at most fifty minutes.
The watcher checks the homepage, login, version, and unsigned sync route after
one hour has elapsed. Desktop and phone flow captures accompany those endpoint
checks. The coordinator owns CI and closure of the old infrastructure.

## Source publication

The repository remains private. Takeout and the bundled source packages retain
their MIT licensing and original artwork. There is no paid tier or support
service. No npm release or repository visibility change occurs in this cutover.

## Marketing font validation

Nate, 2026-10-09: "we can just adjust the takeout fonts I guess to the new one
just kinda make sure that they visually look right". Preserve the marketing
fonts' numbered sizes, weights, and line heights while supplying v3 named
sizes. Compare landing, login, docs, and feed against the parent of `44e4493`
with headless Playwright at 3x. Marketing button labels retain their previously
rendered 16px size and 18px line height; app fonts stay independently scoped.
