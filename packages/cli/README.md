# @take-out/cli

CLI tools for Takeout starter kit - interactive onboarding, project setup,
scripts and script running.

## Features

- 🚀 Interactive onboarding wizard
- ✅ Prerequisite checking (Bun, Docker, Node, Git)
- 🔧 Environment file setup with secret generation
- 📦 Project identity customization
- 🐳 Docker service orchestration
- 🗄️ Database migration automation
- 📚 Documentation management with Claude Code Skills support
- 🎨 Beautiful CLI interface with @clack/prompts

## Installation

```bash
npm install @take-out/cli
# or
bun add @take-out/cli
# or
pnpm add @take-out/cli
```

## Usage

### CLI Commands

#### `takeout onboard`

Interactive onboarding for new Takeout projects:

```bash
takeout onboard
```

This will guide you through:

1. Prerequisites verification (Bun, Docker, Node, Git)
2. Environment file setup (.env from .env.development)
3. Secret generation (BETTER_AUTH_SECRET)
4. Project identity customization (name, bundle ID, domain)
5. Docker service startup (PostgreSQL, Zero, MinIO)
6. Database migrations

**Options:**

- `--skip` - Skip interactive prompts

#### `takeout check`

Quick prerequisite check (used in postinstall):

```bash
takeout check
```

**Options:**

- `--silent` - Run silently with no output

#### `takeout docs`

Manage and retrieve documentation files:

```bash
# list available docs
takeout docs list

# get doc content (for hooks)
takeout docs get zero tamagui

# get path to docs directory
takeout docs path

# eject docs to local ./docs folder
takeout docs eject

# generate Claude Code skills from docs
takeout skills generate
takeout skills generate --clean  # clean and regenerate
```

##### Claude Code Skills

The `skills generate` command generates Claude Code skills from your documentation:

1. scans docs from both `./docs/` (local) and package docs
2. for docs with YAML frontmatter, creates symlinks to `.claude/skills/`
3. for docs without frontmatter, generates skill files with auto-extracted metadata

**adding frontmatter to docs (recommended):**

```markdown
---
name: my-skill
description: What this skill does. Keywords for when Claude should use it.
---

# my skill

content here...
```

docs with frontmatter get symlinked directly - edit the source and the skill
updates automatically. docs without frontmatter get generated copies.

**regenerating skills:**

```bash
# regenerate after doc changes
bun tko skills generate

# clean and regenerate all
bun tko skills generate --clean
```

skills are gitignored by default (`.claude/skills`).

## API

### Prerequisites

```typescript
checkAllPrerequisites(): PrerequisiteCheck[]
checkBun(): PrerequisiteCheck
checkNode(): PrerequisiteCheck
checkDocker(): PrerequisiteCheck
checkGit(): PrerequisiteCheck
hasRequiredPrerequisites(checks: PrerequisiteCheck[]): boolean
```

### Ports

```typescript
checkAllPorts(): PortCheck[]
checkPort(port: number, name: string): PortCheck
hasPortConflicts(checks: PortCheck[]): boolean
getConflictingPorts(checks: PortCheck[]): PortCheck[]

TAKEOUT_PORTS = {
  postgres: 5432,
  zero: 4848,
  web: 8081,
  minio: 9090,
  minioConsole: 9091,
}
```

### Environment

```typescript
generateSecret(length?: number): string
envFileExists(cwd: string, filename?: string): boolean
copyEnvFile(cwd: string, source: string, target: string): Result
updateEnvVariable(cwd: string, key: string, value: string, filename?: string): Result
createEnvLocal(cwd: string): Result
readEnvVariable(cwd: string, key: string, filename?: string): string | null
```

### Files

```typescript
updatePackageJson(cwd: string, updates: { name?: string; description?: string }): Result
updateAppConfig(cwd: string, updates: { name?: string; slug?: string; bundleId?: string }): Result
checkOnboarded(cwd: string): boolean
markOnboarded(cwd: string): Result
```

### Prompts

```typescript
displayWelcome(projectName?: string): void
displayOutro(message: string): void
displayPrerequisites(checks: PrerequisiteCheck[]): void
displayPortConflicts(conflicts: PortCheck[]): void
confirmContinue(message: string, defaultValue?: boolean): Promise<boolean>
promptText(message: string, defaultValue?: string, placeholder?: string): Promise<string>
promptPassword(message: string, placeholder?: string): Promise<string>
promptSelect<T>(message: string, options: Array<{value: T; label: string; hint?: string}>): Promise<T>
showSpinner(message: string): Spinner
showError(message: string): void
showWarning(message: string): void
showSuccess(message: string): void
showInfo(message: string): void
showStep(message: string): void
```

## Integration with Takeout

Add to your `package.json`:

```json
{
  "scripts": {
    "onboard": "takeout onboard",
    "postinstall": "takeout check"
  },
  "dependencies": {
    "@take-out/cli": "^0.0.1"
  }
}
```

Then users can run:

```bash
bun install
bun onboard
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Watch mode
bun run watch

# Lint
bun run lint

# Lint and fix
bun run lint:fix

# Test locally (from this directory)
bun src/cli.ts onboard
bun src/cli.ts check

# Test built version
bun dist/esm/cli.mjs onboard
```

## License

MIT
