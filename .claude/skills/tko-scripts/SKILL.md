---
name: tko-scripts
description: CLI scripts and commands reference for the tko (takeout) CLI. Use when the user asks to run scripts, manage the project, or needs to know what commands are available. tko, takeout, CLI, scripts, commands, bun tko, project tasks, automation, aws, check, db, dev, eas, env, hot-update, icon, ios, ops, sst, test, uncloud, web, zero, aws/configure, aws/health, aws/users, build-initial, changed, check/dependencies, check/knip, check/lint, check/types, clean, cmd, completion, db/add-migration, db/auth-migrate, db/build, db/clear-jwks, db/migrate, db/reset-demo, db/reset-schema, db/seed-demo, dev-tunnel, dev/cleanup-dev, dev/clear-ports, docs, eas/build-dev, eas/build-preview, eas/build-prod, ensure-port, ensure-tunnel, env-pull, env-update, env/sync-to-github, env:setup, exec-with-env, generate-env, hot-update/android, hot-update/ios, icon/add-phosphor, ios/setup-release, node, node-version-check, onboard, one-dev, ops/github-tail, ops/release, ops/run-backend, ops/run-frontend, ops/start-all-dev, postinstall, preinstall, release, run, script, skills, sst-get-environment, sst/check, sync, test/e2e, test/integration, test/unit, typecheck, uncloud/check-deployment, uncloud/clean, uncloud/cluster, uncloud/deploy-local, uncloud/deploy-prod, uncloud/logs, up, update-changelog, wait-for-dev, web/build, web/build-analyze, web/build-docker, web/serve, zero/generate
---

# tko CLI - scripts & commands

run with `bun tko <command>` or `bun tko <script-name>`.

## built-in commands

  onboard - setup wizard for new projects
  docs - view documentation
  env:setup - setup environment variables
  run - run scripts in parallel
  script - manage and run scripts
  sync - sync fork with upstream takeout
  changed - show changes since last sync
  skills - manage claude code skills
  completion - shell completion setup

## local scripts

  node - Start interactive Node REPL with SST resources
  preinstall - Check node and bun versions before install
  postinstall - npm postinstall tasks
  one-dev - Start One framework dev server [--port]

  test/
    unit - Run unit tests
    integration - Run integration tests
    e2e - Run checks, build with test env, and run all tests (unit + integration) [--skip-checks, --skip-unit, --skip-integration, --dev, --start, --unit, --integration, --filter]

  web/
    build-docker - Build docker image for web
    build-analyze - Build with analyzer, run Lighthouse, open reports and site
    serve - Serve web application [--dev, --prod]
    build - Build web application [--dev, --prod]

  hot-update/
    android - Deploy hot update for Android
    ios - Deploy hot update for iOS

  ios/
    setup-release - Setup iOS release secrets for App Store deployment

  env/
    sync-to-github - Sync env variables to GitHub repository secrets

  eas/
    build-dev - Build development profile for all platforms [--android, --ios]
    build-prod - Build production profile for all platforms
    build-preview - Build preview profile for all platforms

  zero/
    generate - Generate Zero sync code [--watch]

  sst/
    check - SST deployment health check [--verbose]

  db/
    auth-migrate - Run better-auth database migrations
    migrate - Build and run database migrations
    reset-demo - Reset demo database to seed state
    add-migration - Add a new database migration
    seed-demo - Seed database with demo users and posts
    clear-jwks - Clear JWKS table to fix auth secret mismatch errors
    reset-schema - Reset migrations to a fresh state from current schema files
    build - Build migrations for production (generates SQL + bundles for docker)

  dev/
    cleanup-dev
    clear-ports - Clear all project ports

  uncloud/
    logs - View logs from production deployment
    cluster - Manage encrypted cluster config
    check-deployment - Check deployment health
    deploy-prod - Deploy to production
    clean - Clean up local Multipass VM
    deploy-local - Deploy to local Multipass VM

  ops/
    run-frontend - Start frontend in production mode for CI [--dev]
    start-all-dev - Start backend and frontend in dev mode for quick integration testing
    github-tail - Tail GitHub CI logs
    run-backend - Start backend services for CI
    release - Run full CI/CD pipeline: test, build prod, deploy [--skip-tests, --skip-deploy, --dry-run, --deploy-only, --redeploy, --dev]

  aws/
    health - AWS health monitoring
    users - AWS IAM Identity Center user management [--email, --name, --display-name, --profile, --permission-set, --dry-run]
    configure - AWS CloudWatch configuration [--clear-logs, --dry-run]

  icon/
    add-phosphor - Add a Phosphor icon to the project

  check/
    lint - Run oxlint linter [--fix]
    dependencies - Check for circular dependencies
    knip - Run knip to find unused dependencies and exports
    types - Run TypeScript type checking [--watch]

## built-in scripts

  wait-for-dev - wait for dev server to be available
  build-initial - bootstrap project workspace and build initial packages
  sst-get-environment
  up - upgrade packages by name or pattern [--tag, --canary, --rc]
  update-changelog - update changelog with recent git commits
  env-update - sync environment variables from package.json to CI and server configs
  dev-tunnel - set up cloudflare dev tunnel for local development [--port]
  ensure-tunnel - check if SST production tunnel is active
  typecheck - run typescript type checking
  env-pull - pull environment variables from SST production
  clean - clean build artifacts and temporary files [--full, --modules, --native]
  generate-env - sync auto-generated env vars to local .env file
  release - publish takeout packages to npm [--patch, --minor, --major, --canary, --rerun, --republish, --finish, --skip-finish, --dry-run, --skip-test, --skip-build, --skip-version, --dirty, --tamagui-git-user, --sync-on-zero, --skip-on-zero-sync]
  cmd
  ensure-port - ensure a port is available, exit with error if in use [--auto-kill]
  run
  exec-with-env
  node-version-check

## usage

```bash
bun tko <command>           # run a built-in command
bun tko <script-name>       # execute direct script
bun tko <group> <script>    # execute nested script (e.g. bun tko aws health)
bun tko run s1 s2 s3        # run multiple scripts in parallel
bun tko script new <path>   # create a new script
```
