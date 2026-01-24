note on packages folder:

we originally had this repo as a plain single-package.json repo with no monorepo
setup and had these packages published separately.

we've decided to move them into this repo for a few reasons:

1. it lets us develop them more easily alongside the codebase
2. it lets you see their source more easily and contribute to them
3. it serves as an example of setting up your own packages

you don't really need packages for most apps, this is only if you are sharing
code with another app, in which case our release script may be useful for you
as well.

if you'd like to avoid the clutter and just rely on the published versions of
these packages, you can:

1. remove the entire `packages` directory
2. change the `"workspace:*"` values in the root package.json to just use the
   latest version, all packages use the same version
3. remove the "workspaces" field from root package.json
4. run `bun install`
