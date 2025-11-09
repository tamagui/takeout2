# @tamatko/takeout

CLI tools for Takeout starter kit - interactive onboarding, project setup,
scripts and script running.

## Features

- 🚀 Interactive onboarding wizard
- ✅ Prerequisite checking (Bun, Docker, Node, Git)
- 🔧 Environment file setup with secret generation
- 📦 Project identity customization
- 🐳 Docker service orchestration
- 🗄️ Database migration automation
- 🎨 Beautiful CLI interface with @clack/prompts

## Installation

```bash
npm install @tamatko/takeout
# or
bun add @tamatko/takeout
# or
pnpm add @tamatko/takeout
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

### Programmatic Usage

Import utilities for use in custom scripts:

```typescript
import {
  checkAllPrerequisites,
  checkAllPorts,
  generateSecret,
  updateEnvVariable,
  displayWelcome,
} from '@tamatko/takeout'

// Check prerequisites
const checks = checkAllPrerequisites()
console.log(checks)

// Check port conflicts
const ports = checkAllPorts()
console.log(ports)

// Generate auth secret
const secret = generateSecret()
console.log(secret)

// Update environment variable
updateEnvVariable(process.cwd(), 'BETTER_AUTH_SECRET', secret)

// Display welcome message
displayWelcome('My App')
```

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
    "@tamatko/takeout": "^0.0.1"
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
