# Takeout

A full-stack, cross-platform starter kit for building modern web and mobile
applications with React Native, Zero sync, and AWS deployment.

## Quick Start

```bash
bun install
bun onboard
```

The onboarding wizard will guide you through setup.

## General

Takeout comes with a CLI (`bun tko`) that has a variety of helperful commands.
Mostly it includes docs and scripts that can update with a simple bun install,
so we can improve them easily without needing to copy-paste.

Use `bun docs list` or `bun scripts list` to see them all.

If you want to eject the docs and scripts into your repo you can use
`bun tko docs eject` and `bun tko scripts eject`.

### Packages

The `tko` binary comes from `./packages/takeout`. You'll noticed the packages
directory in this repo includes lots of helpful libraries that are used
throughout.

We structured it like this because we think it's nice to have the source files
here by default, but you don't _have_ to have the `./packages` directory at all.
You could delete it and then update your root `package.json` to remove the
`workspaces` key and the `workspace:*` versions for the packages to instead have
their latest version, as we publish all these packages to npm.

The nice part of having the packages here is you get to see all the source
easily, and you can help contribute back improvements easily by sending a PR to
our Takeout repo.

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
│   └── tauri/             # Desktop app glue code
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

You always sync the schema-public to your Zero models.

## Authentication

Built-in authentication with Better Auth supports email/password, GitHub OAuth,
magic links, and session management.

Configure in `.env`:

```bash
BETTER_AUTH_SECRET=<generate-with-openssl-rand-hex-32>
BETTER_AUTH_URL=http://localhost:8081

# Optional: GitHub OAuth
ONECHAT_GITHUB_CLIENT_ID=your-client-id
ONECHAT_GITHUB_CLIENT_SECRET=your-secret
```

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

```bash
bun tko sst deploy production
```

Infrastructure includes:

- ECS Fargate for web app and Zero server
- Aurora Serverless v2 (PostgreSQL)
- CloudFront CDN
- S3/R2 for storage
- Route53 for DNS

Update `sst.config.ts` and `src/constants/app.ts` with your domain, AWS region,
and app name.

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
bun release  # Create new release with OTA update
```

## Desktop App

Build native macOS desktop app with Tauri:

```bash
cd src/tauri
bun tko tauri dev    # Development
bun tko tauri build  # Production build
```

## Built With

- [One](https://onestack.dev/) - Universal React framework
- [Zero](https://zero.rocicorp.dev/) - Real-time sync
- [Better Auth](https://www.better-auth.com/) - Authentication
- [Tamagui](https://tamagui.dev/) - Universal UI
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database
- [SST](https://sst.dev/) - Infrastructure as code
