# Takeout

> **⚠️ v2-beta** - This stack is in active development. APIs may change.

A full-stack, cross-platform starter kit for building modern web and mobile
applications with React Native.

## Prerequisites

Before you begin, ensure you have:

- **Bun** - [Install Bun](https://bun.sh) (we recommend using a version manager
  like [bunv](https://github.com/ianh/bunv))
- **Docker** - [Install Docker](https://docs.docker.com/get-docker/) (on macOS,
  we recommend [OrbStack](https://orbstack.dev) as a faster alternative)
- **Git** - For version control

Note: Ensure bun matches the version in package.json. We've avoided 1.3 because we saw install times jump 10x, due to issues:

- https://github.com/oven-sh/bun/issues/23655
- https://github.com/oven-sh/bun/pull/21824
- https://github.com/oven-sh/bun/issues/23969

For mobile development:

- **iOS**: macOS with Xcode 15+
- **Android**: Android Studio with JDK 17+

## Quick Start

```bash
./scripts/bootstrap.sh   # checks environment, installs dependencies
bun onboard              # setup wizard
```

The onboarding wizard will guide you through setup. After onboarding, run in
separate terminals:

```bash
bun backend      # start docker services (postgres, zero, minio)
bun dev          # start web dev server at http://localhost:8081
```

## Getting Familiar

This repo is an entire startup in a box, so it will take a little time to get
familiar with. That said, compared to our previous Takeout stack, it's a
dramatic step forward in simplicity.

At a high level, the primary technologies used are:

- [One](https://onestack.dev) - Universal React framework
- [Zero](https://zero.rocicorp.dev) - Real-time sync
- [Tamagui](https://tamagui.dev) - Universal UI
- [Better Auth](https://www.better-auth.com) - Authentication
- [Drizzle ORM](https://orm.drizzle.team) - Database schema
- [SST](https://sst.dev) / [Uncloud](https://uncloud.run) - Deployment

And the high-level structure worth learning:

- `./app` - your file-system routes
- `./src/*` - all non-feature-specific code
- `./src/features/*` - anything logically a feature in the app
- `./src/data` - all Zero setup, data models, mutators and queries

## Documentation

For docs we intend to update over time as we upgrade the repo, we have the
takeout command. See those docs with `bun tko docs list`.

For docs specific to your app, use the [docs](./docs) directory. Any markdown
file with YAML frontmatter containing `name` and `description` will be
automatically symlinked to `.claude/skills/` for Claude Code integration:

```yaml
---
name: my-skill
description: What this skill does and when to use it
---
```

Run `bun tko skills generate` to sync skills after adding new docs.

### Development

You run two commands generally in separate terminals:

```bash
bun backend
bun dev
```

Which runs your backend services + your web app and checks in the other.

## Scripts and Docs

Takeout comes with a CLI (`bun tko`) that has a variety of commands.

Use:

- `bun tko` to see commands
- `bun docs list` to see docs

If you want to eject the docs and scripts into your repo you can use
`bun tko docs eject` and `bun tko scripts eject`.

## Development

### Common Commands

```bash
# Development
bun dev                      # Start web + mobile dev server
bun ios                      # Run iOS simulator
bun android                  # Run Android emulator
bun backend                  # Start Docker services

# Code Quality
bun tko check                # Run all checks (lint, types, dependencies)
bun lint:fix                 # Auto-fix linting issues
bun tko check types          # TypeScript type checking

# Database
bun migrate run              # Build and run migrations
bun db:add-migration <name>  # Create one-off migrations

# Deployment
bun ops release                   # Full CI/CD pipeline
bun tko sst deploy production  # Deploy to AWS production
```

### Scripts and Docs

The `tko` binary comes from `./packages/takeout`. You'll notice the packages
directory in this repo includes lots of helpful libraries that are used
throughout.

We structured it like this because we think it's nice to have the source files
here by default, but you don't _have_ to have the `./packages` directory at all.
You can delete it and then update your root `package.json` to remove
`workspaces` and the `workspace:*` versions for the packages (replace that with
their latest published version).

The nice part of having the packages here is you see the source easily and
everyone can help contribute back.

## Project Structure

```
takeout/
├── app/                   # File-based routing (One router)
│   ├── home/              # Tab navigation
│   └── api/               # API routes
├── src/
│   ├── features/          # Feature modules (auth, feed, profile, etc.)
│   ├── interface/         # Reusable UI components
│   ├── database/          # Database schema and migrations
│   ├── auth/              # Authentication system
│   ├── zero/              # Real-time sync configuration
│   ├── server/            # Server-side code
├── scripts/               # Organized build and deployment scripts
├── docs/                  # Detailed guides
├── assets/                # Images, fonts, splash screens
└── public/                # Static web assets
```

## Scripts

The `tko` CLI provides organized access to scripts you can run:

```bash
# List scripts in a category
bun tko aws                  # Shows all AWS scripts
bun tko web                  # Shows all web build scripts

# Run scripts directly
bun tko aws health           # Run AWS health check
bun tko run check/types      # Run type checking
```

### Adding Icons

This project uses [Phosphor Icons](https://phosphoricons.com/) for all UI icons.
To add a new icon:

```bash
# Add a regular icon
bun tko icon add-phosphor Heart

# Add a different weight (regular, bold, duotone, fill, light, thin)
bun tko icon add-phosphor User --weight=fill
```

Icons are automatically generated in `src/interface/icons/phosphor/` and can be
imported:

```tsx
import { HeartIcon } from '~/interface/icons/phosphor/HeartIcon'
```

**Note:** For brand icons (Apple, Google, Discord, GitHub, X/Twitter), use the
custom icons in `src/interface/icons/` as these are not available in Phosphor.

## Testing

Takeout has two types of tests:

### Unit Tests (Vitest)

Unit tests run fast and don't require the backend:

```bash
bun test:unit
```

- Location: `src/test/unit/` and `packages/*/src/**/*.test.ts`
- Config: `src/test/vitest.config.ts`
- No backend required for most tests

### Integration Tests (Playwright)

Integration tests run against a live server with the full backend:

```bash
# requires backend + frontend running on port 8081
bun test:integration
```

- Location: `src/test/integration/`
- Config: `src/test/playwright.config.ts`
- Requires: Docker backend + frontend server on port 8081

### Running All Tests (CI Mode)

The easiest way to run everything correctly is through CI:

```bash
bun ops release --dry-run    # full pipeline without deploying
bun ops release --skip-deploy # same thing
```

This handles all the setup automatically:
1. Starts Docker backend (postgres, zero, minio)
2. Waits for migrations to complete
3. Runs unit tests
4. Builds and serves the frontend
5. Runs Playwright integration tests

Use `--dev` for faster iteration (runs frontend in dev mode instead of building):

```bash
bun ops release --dry-run --dev
```

## Database

### Local Development

PostgreSQL runs in Docker on port 5433:

- Main database: `postgresql://user:password@localhost:5433/postgres`
- Zero sync databases: `zero_cvr` and `zero_cdb`
- Connect with TablePlus or any PostgreSQL client

### Migrations

In general you just update your `src/database/schema-public.ts` and then run
`bun migrate` while your backend server is up. You can also just run
`bun tko db generate` if the backend isn't running.

Database schema is defined in:

- `src/database/schema-public.ts` - Public tables (exposed to Zero/client)
- `src/database/schema-private.ts` - Private tables

If you need something outside of Drizzle migrations, you can do
`bun db:add-migration`

## Environment Configuration

### File Structure

- `.env.development` - Development defaults (committed)
- `.env` - Active environment (generated, gitignored)
- `.env.local` - Personal secrets/overrides (gitignored)
- `.env.production.example` - Production template (committed)

### Key Variables

```bash
# Authentication
BETTER_AUTH_SECRET=<secret>
BETTER_AUTH_URL=<url>

# Server
ONE_SERVER_URL=<url>

# Database
ZERO_UPSTREAM_DB=<connection-string>
ZERO_CVR_DB=<connection-string>
ZERO_CHANGE_DB=<connection-string>

# Storage (S3/R2)
CLOUDFLARE_R2_ENDPOINT=<endpoint>
CLOUDFLARE_R2_ACCESS_KEY=<key>
CLOUDFLARE_R2_SECRET_KEY=<secret>
```

See `.env.production.example` for complete production configuration.

## Deployment

Takeout supports two deployment options:

**Uncloud (self-hosted)** - Deploy to any VPS with Docker:

```bash
bun tko uncloud deploy-prod
```

**AWS via SST** - Full serverless deployment:

```bash
bun tko sst deploy production
```

See [deployment docs](./docs/deploy.md) for detailed setup instructions.

## Mobile Apps

### iOS

```bash
bun ios          # run in simulator
```

Requires macOS, Xcode 15+, and iOS 17.0+ deployment target.

### Android

```bash
bun android      # run in emulator
```

Requires Android Studio, JDK 17+, and Android SDK 34+.

### Over-the-Air Updates

```bash
bun hot-update ios
bun hot-update android
```
