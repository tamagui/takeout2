# Template source

This branch was materialized from Contrast commit `abb832acb6`, using the
canonical `templates/app` seed, server files, schema baseline, catalog version
materialization, and `buildSelfContainedProjectFiles` export path. It does not
require the Contrast monorepo to install or run.

The exported MIT packages are `contrast-ui`, `contrast-native`,
`contrast-better-auth`, `contrast-mdx`, `contrast-notifications`, and
`peach-swipeable`. Their package manifests and source remain under `packages/`.
`peachsim@0.1.628` is an npm dev dependency under its own license. The template’s
unused `contrast-kit` dev dependency is omitted, so its private engine globals
are absent from this repository.

The app preserves template routes, auth and demo identities, sync contracts,
server source, upload paths, and UI components. Takeout-specific changes are its
name, scheme, native bundle variants, public domain, local database/upload
identity, standalone scripts, and documentation. `contrast.runtime` and entry
metadata remain because the Contrast CLI consumes them. The starter retirement
manifest also remains for editing this example through Contrast.

Refresh through the canonical app export, then reapply these identity and
standalone manifest edits. Fix shared behavior in Contrast’s template or the
owning package before refreshing this copy.
