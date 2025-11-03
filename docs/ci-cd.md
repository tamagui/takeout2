# CI/CD Pipeline Guide

This guide explains the continuous integration and deployment pipeline for this
project.

## Overview

The CI/CD pipeline is configured using GitHub Actions and handles:

- Automated testing and linting
- Building and deploying web, mobile, and desktop applications
- Hot update deployments for React Native
- Tauri desktop app auto-updates
- Database migrations
- Environment-specific deployments

## GitHub Actions Workflow

The main CI workflow (`.github/workflows/ci.yml`) runs on every push and
includes:

### 1. Tauri Build Check

For main branch commits, checks if Tauri desktop app needs rebuilding:

- Compares file hashes to detect changes
- Checks if update manifest exists
- Triggers build only when necessary

### 2. Build, Test & Deploy

Runs on all branches with different configurations:

- **Main branch**: Full deployment with high-performance runners
- **Other branches**: Build and test only with standard runners

## Deployment Targets

### Web Application

Deployed to Cloudflare Workers using SST:

```bash
bun run ci  # Runs full CI pipeline including deployment
```

### Mobile Applications (iOS/Android)

Built using EAS Build:

```bash
# Development builds
eas build --profile development --platform all

# Preview builds
eas build --profile preview --platform all

# Production builds
eas build --profile production --platform all
```

### Desktop Application (Tauri)

Built and distributed with auto-updates:

```bash
# Build Tauri app
bun ./src/tauri/scripts/build-tauri-ci.ts

# Create version bump PR
bun ./src/tauri/scripts/create-version-bump-pr.ts [major|minor|patch]
```

## Hot Updates

### React Native Hot Updates

Configured using `@hot-updater/react-native`:

- Automatic OTA updates for React Native apps
- Channel-based distribution (development, preview, production)
- Controlled via feature flags

### Tauri Auto-Updates

Desktop app checks for updates every 30 minutes:

- Update manifest served from Cloudflare R2
- Automatic download and installation
- User notification when updates are available

## Environment Configuration

### Environment Variables

Managed through `bun env:update`:

```bash
# Pull latest environment variables
bun env:pull

# Update environment configuration
bun env:update
```

### Secrets Management

All secrets are stored in GitHub Actions secrets and include:

- API keys (Anthropic, OpenAI, etc.)
- Cloud service credentials (AWS, Cloudflare)
- OAuth client credentials
- Database connection strings

## Database Migrations

### Adding Migrations

```bash
# Add a new migration
bun db:migrate:add migration-name

# Run migrations locally
bun migrate
```

### Production Database

```bash
# Backup production database
bun db:backup:production

# Pull production database locally
bun db:pull:production
```

## Monitoring & Debugging

### Deployment Status

```bash
# Check deployment status
bun ci:check

# Tail CI logs
bun ci:tail
```

### AWS ECS Monitoring

```bash
# Monitor ECS health
bun aws:monitor

# Clear CloudWatch logs
bun aws:clear-logs
```

## Local CI Testing

### Running CI Locally

```bash
# Run full CI pipeline locally
CI=true NODE_ENV=production bun ci

# Run backend CI only
bun ci:backend

# Run frontend CI only
bun ci:frontend-prod
```

### Docker Compose Services

```bash
# Start all services
bun backend

# Clean Docker environment
bun backend:clean
```

## Scripts Reference

Key CI/CD scripts in `scripts/` directory:

- `ci/ci.ts` - Main CI orchestrator
- `ci/check-deployment.ts` - Deployment verification
- `ci/ci-run.ts` - CI task runner
- `release.ts` - Release management
- `db-push.ts` - Database deployment
- `build-apps.ts` - Application building

## Best Practices

1. **Always test locally** before pushing to main
2. **Use feature branches** for development
3. **Run linting and type checking** before commits:
   ```bash
   bun lint:fix && bun types:check
   ```
4. **Monitor deployments** after merging to main
5. **Check CI logs** if builds fail
6. **Version appropriately** for Tauri releases

## Troubleshooting

### Build Failures

1. Check GitHub Actions logs
2. Verify environment variables are set
3. Ensure dependencies are up to date
4. Clear caches if needed

### Deployment Issues

1. Verify SST configuration
2. Check Cloudflare Workers status
3. Ensure database migrations ran successfully
4. Review deployment logs with `bun ci:tail`

### Update Problems

1. Check feature flags are enabled
2. Verify update server URL is correct
3. Review update manifest format
4. Check network connectivity

## Security

- Never commit secrets to the repository
- Use environment variables for sensitive data
- Rotate API keys regularly
- Review dependency updates for vulnerabilities
- Use signed commits when possible
