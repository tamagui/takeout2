# Published Tamagui 3.1.3 consumer update

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
