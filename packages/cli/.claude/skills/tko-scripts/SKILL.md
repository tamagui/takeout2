---
name: tko-scripts
description: CLI scripts and commands reference for the tko (takeout) CLI. Use when the user asks to run scripts, manage the project, or needs to know what commands are available. tko, takeout, CLI, scripts, commands, bun tko, project tasks, automation, , build-initial, changed, clean, completion, dev-tunnel, docs, ensure-port, ensure-tunnel, env-pull, env-update, env:setup, exec-with-env, generate-env, node-version-check, onboard, release, run, script, skills, sst-get-environment, sync, typecheck, up, update-changelog, wait-for-dev
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
  ensure-port - ensure a port is available, exit with error if in use [--auto-kill]
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
