# Takeout

A full-stack, cross-platform starter kit for building modern web and mobile
applications with React Native, Zero sync, and AWS deployment.

## Quick Start

```bash
git clone <your-repo-url>
cd takeout
bun install
bun onboard
```

The onboarding wizard will guide you through setup.

## Documentation

See detailed guides in the [docs](./docs) directory.

### Development

You run two commands generally in separate terminals:

```bash
bun backend
bun dev
```

Which runs your backend services in one, and your web app and type checker in
the other.

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
bun check                    # Run linter, type-check, and dependency checks
bun lint:fix                 # Auto-fix linting issues
bun types:check              # TypeScript type checking

# Testing
bun test:unit                # Unit tests
bun test:integration         # Integration tests

# Database
bun migrate                  # Run current migrations
bun db:migrate:add <name>    # Create one-off migrations

# Deployment
bun ci                       # Full CI/CD pipeline
bun sst:deploy:production    # Deploy to AWS production
```

## Project Structure

```
takeout/
├── app/                    # File-based routing (One router)
│   ├── (tabs)/            # Tab navigation
│   └── api/               # API routes
├── src/
│   ├── features/          # Feature modules (auth, feed, profile, etc.)
│   ├── interface/         # Reusable UI components
│   ├── database/          # Database schema and migrations
│   ├── auth/              # Authentication system
│   ├── zero/              # Real-time sync configuration
│   ├── server/            # Server-side code
│   └── tauri/             # Desktop app
├── scripts/               # Build and deployment scripts
├── docs/                  # Detailed guides
├── assets/                # Images, fonts, splash screens
└── public/                # Static web assets
```

## Database

### Local Development

PostgreSQL runs in Docker:

- Main database: `postgresql://user:password@localhost:5432/postgres`
- Zero sync databases: `zero_cvr` and `zero_cdb`
- Connect with TablePlus or any PostgreSQL client

### Migrations

```bash
bun db:generate              # Generate migration from schema changes
bun db:migrate:add <name>    # Create custom migration
bun migrate                  # Apply migrations locally
bun migrate:production       # Apply migrations in production
```

Database schema is defined in:

- `src/database/schema-public.ts` - Public tables
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
bun sst:deploy:production
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
bun tauri:dev    # Development
bun tauri:build  # Production build
```

## Built With

- [One](https://onestack.dev/) - Universal React framework
- [Zero](https://zero.rocicorp.dev/) - Real-time sync
- [Better Auth](https://www.better-auth.com/) - Authentication
- [Tamagui](https://tamagui.dev/) - Universal UI
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database
- [SST](https://sst.dev/) - Infrastructure as code
