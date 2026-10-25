# Published Tamagui 3.1.4 consumer update

Parent r116738 assigned task t-mvo9k7l0-myl0 on 2026-10-25 under the
owner rollout direction recorded below. Update the published Tamagui family
from 3.1.3 to exact 3.1.4 pins in the root, local packages and lockfile.
Preserve One 2.10.0, application source and unrelated dependencies. The
parent reports published source 7ea8fdab verified by CI356. The corresponding
Contrast consumer plan is plans/contrast/oss-patch-consumers.md.

Validate the frozen install, installed family alignment, existing typecheck
and headless web demo login/feed with captures. Native builds, production
builds and package publication are outside this task. Parent r116738 owns
the independent Opus review and merge; CI356 owns broader checks.

## Previous Tamagui 3.1.3 consumer update


On 2026-10-22, Nate directed the release coordinator: "Yeah, please cut them
both and then upgrade them across the other repose" (parent rollout task
t-mvk3ej0l-iwp0). This continuation upgrades only the published Tamagui family
to 3.1.3 in the root, local packages and lockfile. One and vxrn remain at
2.9.1; their later same-batch update belongs to the parent.

Continue PR 90 and preserve original author session r114181's 3.1.2 commit.
The published 3.1.3 source is c95f4998d3859dcc34f1ce4026e434ad864e1422.
Use exact pins rather than a moving dist-tag. This repository has no upgrade
script or workspaces declaration. The prior CLI 0.4.17 supports --tag,
--canary and --rc, but does not offer --version or --rootonly and discovers
nested manifests only through workspaces. Update all three manifests together.

Validate the frozen install, family alignment, existing app typecheck, and
browser sign-in, feed, caption-only draft and navigation at desktop and phone
widths. Native builds, production builds and package publication are outside
this task. Parent r116738 owns independent review and landing; CI p103700
owns broader checks.

## Earlier One 2.9.0 dependency batch

Keep the released One, vxrn and @vxrn family at 2.9.0 and Tamagui at
3.0.18. Update the local package peer pins together with the application lockfile.

On 2026-10-20 at 01:20 UTC, Nate answered "Use top alignment" through
owner inbox item i-1792459120819-91917-0. This approves changing only the
notification row HStack in app/home/settings/notifications.ios.tsx from
leading to top for One 2.9.0. Keep the inner VStack leading alignment,
unread condition, spacing and handlers unchanged.

In the same direction on 2026-10-20, Nate said "Yeah, no backwards
compatibility ... were pre-release ... make sure we just support the latest"
and "Make sure you watch those to get them merged all the way to main."
This batch supports the latest released dependency family above. Do not add
compatibility shims, fallback paths, casts or weakened assertions. This scope
does not authorize SDK implementation changes or package publication.

Rerun the existing application typecheck and inspect nearby HStack callers.
Reuse the original frozen install, web build and bounded web navigation proof
where inputs are unchanged. Those web checks do not establish native visual
acceptance or synchronized feed health. Native builds and device checks are
outside this continuation. Parent r104486 owns final independent review and
the watch through main; CI manager p96184 owns natural checks.

## 3.1.4 validation results

- `bun install --frozen-lockfile` passed with the regenerated lockfile.
- `tm window run heavy -- bun run typecheck` passed.
- All 122 resolved Tamagui family records and installed manifests are 3.1.4.
  The seven directly inspected registry artifacts match lockfile integrity.
  Registry metadata for tamagui and core names gitHead
  a49cc7ea6b93ba384e77a4880ae48ac4a5635c14; the release-source verification
  remains the parent's separate CI356 evidence, not a claim from this smoke.
- A parsed comparison against the base lockfile found only 122 Tamagui family
  and two local package records changed. One/vxrn and unrelated records are
  identical, including One 2.10.0.
- Headless Chromium passed public entry and demo login, seeded feed loading,
  desktop profile/feed navigation, and create-dialog typing/cancel at
  1440x1000 and 390x844 CSS pixels. Post stays disabled without an image,
  including with a caption. No browser page errors were observed.
- WebP captures were encoded at quality 90 without resizing from 3x device
  screenshots: desktop 4320x3000, phone 1170x2532. Captures and executable
  probes are retained outside the disposable worktree and linked in the task.

The dev server reports a stale upstream React Native patch and missing orez
source maps. Neither prevented this web validation. No native, production
build, publish or CI dispatch was performed. Independent review, CI and merge
remain with the parent and CI owner.
