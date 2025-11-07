# Scripts Directory

This directory contains executable scripts organized by category, providing a
structured way to manage project operations.

## How It Works

Scripts are organized into category directories, and the `tko` CLI provides
discovery and execution capabilities:

- **Filesystem-based discovery**: Scripts are automatically discovered from
  subdirectories
- **Metadata extraction**: Scripts can include `@description` and `@args`
  comments for documentation
- **Lazy loading**: Directories are only scanned when needed for performance
- **Hybrid system**: Works alongside built-in scripts from npm packages

## Usage

```bash
# List all available scripts in a category
tko <category>

# Run a specific script
tko <category> <script-name> [args...]

# Create a new script from template
tko script new <category>/<name>
```

## Script Structure

Scripts are standard TypeScript/JavaScript files that:

- Use `#!/usr/bin/env bun` shebang for direct execution
- Can include metadata comments for documentation
- Have access to Bun's built-in `$` template literal for shell commands
- Can parse arguments using Node's built-in `parseArgs` utility

## Categories

Scripts are organized into logical categories based on their purpose. Each
category directory contains related scripts that can be discovered and executed
through the CLI.

The hybrid approach allows local scripts to override built-in ones, giving
flexibility to customize behavior while maintaining a clean package.json.
