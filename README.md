# Takeout

A full-stack, cross-platform starter kit for building modern web and mobile
applications with React Native, Zero sync, and AWS deployment.

## Quick Start

```bash
bun install
bun onboard
```

The onboarding wizard will guide you through setup.

## Getting Familiar

This repo is an entire startup in a box, so it will take a little time to get
familiar with. That said, compared to our previous Takeout stack, it's a
dramatic step forward in simplicity.

At a high level, the primary technologies used are:

- [One](https://onestack.dev) - Universal React framework
- [Zero](https://zero.rocicorp.dev) - Real-time sync
- [Tamagui](https://tamagui.dev) - Real-time sync
- [Better Auth](https://www.better-auth.com) - Authentication
- [Tamagui](https://tamagui.dev) - Universal UI
- [Drizzle ORM](https://orm.drizzle.team) - Database Schema
- [SST](https://sst.dev) - Infrastructure as code

And high level structure that is good to start learning:

- `./app` - your file-system routes
- `./src/*` - all non-feature-specific code
- `./src/features/*` - anything logically a feature in the app
- `./src/data` - all Zero setup, data models, mutators and queries

## Documentation

We use the [docs](./docs) directory for documentation.

More docs are viewable with `bun tko docs list`.

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
bun migrate                  # Run database migrations

# Code Quality
bun tko check                # Run all checks (lint, types, dependencies)
bun lint:fix                 # Auto-fix linting issues
bun tko check types          # TypeScript type checking

# Testing
bun test:unit                # Unit tests
bun test:integration         # Integration tests

# Database
bun migrate                  # Run current migrations
bun db:migrate:add <name>    # Create one-off migrations

# Deployment
bun ci                       # Full CI/CD pipeline
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
│   ├── (tabs)/            # Tab navigation
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

This project uses [Phosphor Icons](https://phosphoricons.com/) for all UI icons. To add a new icon:

```bash
# Add a regular icon
bun tko icon/add-phosphor Heart

# Add a different weight (regular, bold, duotone, fill, light, thin)
bun tko icon/add-phosphor User --weight=fill
```

Icons are automatically generated in `src/interface/icons/phosphor/` and can be imported:

```tsx
import { HeartIcon } from '~/interface/icons/phosphor/HeartIcon'
```

**Note:** For brand icons (Apple, Google, Discord, GitHub, X/Twitter), use the custom icons in `src/interface/icons/` as these are not available in Phosphor.

## Database

### Local Development

PostgreSQL runs in Docker:

- Main database: `postgresql://user:password@localhost:5432/postgres`
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
`bun db:migrate-add`

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

This starter kit deploys to AWS using [SST](https://sst.dev/):

[todo]

## Mobile Apps

### iOS

```bash
bun ios          # Run in simulator
bun ios:device   # Run on physical device
```

Requires macOS, Xcode 15+, and iOS 17.0+ deployment target.

### Android

```bash
bun android              # Run in emulator
bun android:device       # Run on physical device
```

Requires Android Studio, JDK 17+, and Android SDK 34+.

### Over-the-Air Updates

```bash
bun hot-update ios
bun hot-update android
```
