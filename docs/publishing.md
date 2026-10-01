# Publishing the Takeout example

This branch is a reviewable replacement of the starter. It does not upgrade the
existing production database, publish npm packages, change repository visibility,
or deploy to `takeout.tamagui.dev`. Nate’s explicit instruction prohibiting
Takeout main pushes remains in effect.

## Existing production

The previous starter uses Postgres, stock Zero, One 1.25, Tamagui 2, Expo native
configuration, and Uncloud/SST deployment. The template uses SQLite, Lite Sync,
One 2, Tamagui 3, and Cloudflare Durable Objects. The old workflows and release
scripts are replaced by a build-only workflow in this candidate. They remain
available on the unchanged main branch.

The old schema includes reports, blocks, devices, invitations, user state, and
whitelist records beyond this template’s feed, comments, profiles, notifications,
and Better Auth records. Those product features are absent from this example.
No old rows or infrastructure have been changed.

The draft is free and open source under MIT, with no paid tier or Help & Support
service, following Nate’s direction. Existing production remains unchanged.

## Owner decisions before publication

1. Approve this smaller example as Takeout’s intended scope and lift the
   Takeout main-push restriction for this branch.
2. Publish the MIT-licensed source in the chosen public repository.
3. Choose a new example URL or explicitly approve replacing
   `takeout.tamagui.dev`. Use a fresh example database by default. An actual
   production cutover requires a separately reviewed migration preserving
   accounts, posts, comments, uploads, relationships, and timestamp units.

Do not point the old production workflows at the new SQLite app. Do not reuse
populated identifiers or buckets for a preview. Auth, database, sync, and upload
bindings must belong to the same new deployment. Native builds keep the existing
Takeout scheme and bundle variants; production signing remains owner-controlled.

## Example deployment

From a clean clone, sign into Contrast, create a new `app` project with
`contrast link --create --name takeout-example --template app`, and deploy it
using an unused slug. Do not link this branch to an existing production project.
The deployment pipeline owns the Cloudflare worker, SQL Durable Object, Rust
sync host, and upload bindings. Smoke-test landing, demo login, feed sync,
comments, profile, and a mutation against that deployed URL before calling the
example shipped.
