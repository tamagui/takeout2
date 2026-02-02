---
name: takeout-sync-prompt
description:
  Intelligent sync guide for updating forked Takeout with upstream changes while
  preserving customizations. sync, upstream sync, fork sync, merging upstream,
  git merge, tamagui/takeout2, upstream changes, update from takeout, takeout
  updates.
---

# Takeout Repository Sync Prompt

You are helping sync a fork of the Takeout starter kit with the latest upstream
changes.

## Context

This application was forked from Takeout, a full-stack starter kit for building
production-ready apps. The upstream repository is at
`git@github.com:tamagui/takeout2.git`.

## Your Task

Intelligently sync the latest Takeout changes into this repository while
preserving all user customizations.

## Process

### 1. Clone Upstream Repository

Clone the upstream Takeout repository to a temporary directory:

```bash
git clone git@github.com:tamagui/takeout2.git /tmp/takeout-upstream
cd /tmp/takeout-upstream
```

### 2. Identify Last Synced Commit

Compare the current repository with the upstream to determine the last commit
that was synced from Takeout. You can do this by:

- Checking git history for merge commits from upstream
- Comparing file contents and commit messages
- Looking for a `.takeout` marker file (if it exists) that contains the last
  synced commit SHA

Create or update a `.takeout` file in the project root with the current HEAD SHA
after syncing.

### 3. Analyze New Commits

Starting from the last synced commit, go through each new commit in the upstream
repository:

```bash
git log --oneline <last-synced-commit>..HEAD
```

For each commit:

1. **Read the commit message and diff** to understand what changed
2. **Categorize the change**:
   - Infrastructure/tooling updates (build scripts, CI/CD, etc.)
   - Feature additions or enhancements
   - Bug fixes
   - Dependency updates
   - Documentation updates
   - Breaking changes

3. **Determine if it's applicable** to this repository:
   - Does this repository still contain the code being modified?
   - Has the user customized this area significantly?
   - Is this a core Takeout feature or something the user likely removed?

### 4. Apply Changes Intelligently

For each applicable change:

**If the code still exists and hasn't been heavily customized:**

- Apply the change directly, preserving user modifications where possible
- Use three-way merge strategies when conflicts arise

**If the code has been customized:**

- Pause and ask the user:
  - Show them the upstream change
  - Show them their current code
  - Ask if they want to: (a) apply the change, (b) skip it, (c) manually merge
    it, or (d) see more details

**If the code doesn't exist anymore:**

- Skip the change (user likely removed this feature intentionally)
- Optionally mention it in a summary at the end

### 5. Handle Package Ejection

Check if the user has ejected from the monorepo setup:

```bash
# If ./packages directory doesn't exist, they've ejected
```

**If ejected:**

- DO NOT copy any changes from `./packages/*` directories
- Instead, at the end of syncing, check the latest `@take-out/*` package
  versions in the upstream `package.json`
- Run: `bun add @take-out/cli@^X.X.X @take-out/helpers@^X.X.X` (etc.) with the
  latest versions

**If NOT ejected:**

- Sync changes to `./packages/*` normally
- Preserve any local modifications to these packages

### 6. Handle Special Cases

**Environment variables:**

- Never overwrite `.env` or `.env.local`
- For new variables in `.env.development`, notify the user but don't auto-add

**Configuration files:**

- `package.json`: Merge dependencies carefully, don't overwrite user's custom
  scripts/config
- `tsconfig.json`, `.oxfmtrc.jsonc`, `.oxlintrc.json`: Merge carefully,
  preserving user customizations
- `app.config.ts`: Never overwrite (contains user's app identity)

**Database migrations:**

- Always apply new migrations in `./migrations/*`
- Never modify existing migrations

**Generated files:**

- Skip `src/data/generated/*` (these are auto-generated)
- Skip `node_modules/`, `.vxrn/`, `dist/`, etc.

### 7. Pause for Decisions

Stop and ask the user whenever:

- A change conflicts with their customizations
- A breaking change is detected
- Multiple valid approaches exist for merging a change
- The change affects core app functionality they've modified
- You're uncertain about the best approach

When pausing, provide:

- Clear explanation of the situation
- The upstream change details
- Their current code
- Recommended options with pros/cons
- A way to skip and continue

### 8. Summary and Completion

After processing all commits:

1. Create a summary document showing:
   - Commits applied successfully
   - Changes skipped (with reasons)
   - Manual interventions made
   - New package versions (if ejected)
   - Any recommended follow-up actions

2. Update the `.takeout` marker file with the new HEAD SHA

3. Run post-sync checks:

   ```bash
   bun install
   bun lint:fix
   bun tko check types
   ```

4. If checks fail, report the errors and suggest fixes

## Important Guidelines

- **Preserve user intent**: When in doubt, preserve the user's changes over
  upstream changes
- **Be transparent**: Always explain what you're doing and why
- **Ask questions**: Better to pause and ask than to make a wrong assumption
- **Test incrementally**: After significant changes, suggest running tests
- **Document decisions**: Keep track of choices made for future reference
- **Respect customizations**: Recognize that users forked Takeout to make it
  their own

## Example Decision Points

**Example 1: Upstream updates a component the user has heavily customized**

```
⚠️  Decision needed: Upstream updated Button component

Upstream changes:
- Added new 'variant' prop
- Changed default styling
- Fixed accessibility issue

Your current code:
- Custom 'theme' prop added
- Completely different styling approach
- Same accessibility issue present

Options:
a) Skip upstream changes (keep your customizations)
b) Apply only the accessibility fix
c) Manually merge all changes
d) Show me the full diff

What would you like to do? [a/b/c/d]
```

**Example 2: New dependency in upstream**

```
ℹ️  Upstream added new dependency: @tamagui/animate-presence@1.0.0

This is used in the new modal animations feature. You don't currently have
any modals in your app.

Options:
a) Add dependency and related code (prepare for future use)
b) Skip (you can add it later if needed)

What would you like to do? [a/b]
```

## Final Notes

- This is an **intelligent sync**, not a blind merge
- The goal is to **keep you up-to-date** while **respecting your
  customizations**
- When uncertain, **always ask** before making changes
- Keep a **detailed log** of all changes for review

## What's meant to not sync

Note that apps have different schemas and use-cases, for things inside app/, for
src/data/ models and such, what you do want to sync is if there were sweeping
changes to how these things are structured fundamentally - but you don't want to
sync the actual specific models, or ./src/data/generated, or things like the
schema changes specific to an individual app.
