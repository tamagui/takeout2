# Tauri Desktop Application Guide

## Overview

This guide covers how Tauri is integrated into the start.chat application. Tauri
enables us to build a native desktop application with web technologies,
providing a lightweight, secure, and performant alternative to Electron.

## Architecture

### Core Components

1. Rust Backend (`src/tauri/src/`)

   - `main.rs`: Entry point for the Tauri application
   - `lib.rs`: Core Tauri functionality including window management and
     platform-specific features
   - Custom commands for vibrancy effects and window creation

2. Frontend Integration (`src/tauri/`)

   - `TauriEffects.tsx`: React component managing Tauri-specific effects
   - `useTauriUpdater.ts`: Auto-update functionality hook
   - `menu.ts`: Native application menu configuration
   - `authFlowHelpers.ts`: Deep linking for OAuth authentication

3. Sidecar Process (`src/tauri/sidecar/`)
   - `main.ts`: Node.js sidecar for extended functionality
   - Communicates via stdin/stdout with JSON messages
   - Handles background tasks and processes

## Key Features

### 1. Window Management

The application uses Tauri's window APIs with custom vibrancy effects:

```rust
apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
```

Features:

- Transparent windows with blur effects
- Hidden title bar with overlay style
- Window state persistence via `tauri-plugin-window-state`

### 2. Auto-Updates

Automatic update system with user notifications:

- Check Interval: Every 30 minutes
- Update Server: `https://start.chat/api/tauri-update`
- Process:
  1. Checks for updates automatically
  2. Shows toast notification when available
  3. Downloads update with progress tracking
  4. Automatically restarts to apply update

### 3. Deep Linking

Custom URL scheme support for OAuth and theme installation:

- Schemes:
  - Production: `start-chat://`
  - Development: `start-chat-dev://`
- Handlers:
  - `finish-auth`: OAuth callback handling
  - `theme`: Custom theme installation

### 4. Native Menus

Platform-specific application menus:

- File, Edit, View, Window menus
- Custom shortcuts (e.g., Cmd+, for settings)
- Integration with app navigation

### 5. Security Configuration

Content Security Policy (CSP) settings:

```json
{
  "default-src": "'self' start-chat: asset:",
  "connect-src": "ipc: http://localhost:8081 https://start.chat",
  "img-src": "'self' asset: https://storage.start.chat blob: data:"
}
```

## Development Setup

### Prerequisites

- Rust toolchain (specified in `rust-toolchain.toml`)
- Tauri CLI: `@tauri-apps/cli`
- Platform-specific dependencies for your OS

### Commands

#### Development

```bash
bun tko tauri dev
bun tko tauri build:dev  # build development version (with dev icon and config)
```

#### Production Build

```bash
bun tko tauri build:prod
bun tko tauri build  # build both prod and dev versions
bun tko tauri build-and-release
```

#### Utilities

```bash
bun tauri:upload-release
bun build:sidecar
```

## Build Process

### 1. Icon Generation

Icons are automatically generated from source images:

- Production: `assets/icon.png`
- Development: `assets/icon-dev.png`

Generated sizes: 32x32, 64x64, 128x128, 256x256, and platform-specific formats

### 2. Sidecar Compilation

The sidecar is built using Bun's native compiler:

```bash
bun build ./sidecar/main.ts --compile --outfile ./binaries/sidecar-[target-triple]
```

### 3. Configuration Management

The build script automatically modifies `tauri.conf.json` for development
builds:

- Changes `productName` to `start.chat.dev`
- Updates `frontendDist` to `./shell-dev`
- Modifies deep-link schemes

### 4. Bundle Creation

Production builds create:

- `.app` bundle for macOS
- `.dmg` installer for distribution
- Update artifacts with signatures

## CI/CD Integration

### Automated Builds

The CI pipeline (`scripts/ci/ci.ts`) includes Tauri builds:

1. Validates configuration consistency
2. Builds production and development versions
3. Generates update artifacts
4. Uploads releases to S3

### Release Process

1. Version Bumping: Automated version updates in `tauri.conf.json`
2. Hash Generation: Creates hash file for update verification
3. S3 Upload: Uploads DMG and hash to `releases/macos/`
4. Update Server: Serves update manifest at `/api/tauri-update`

### Environment Variables for CI

```bash
# apple signing (required for production)
APPLE_CERTIFICATE
APPLE_CERTIFICATE_PASSWORD
APPLE_API_KEY
APPLE_API_ISSUER

# build configuration
PREBUILD  # skip actual build, only prepare
TAMAGUI_DEBUG  # enable debug mode
```

## Plugin System

### Installed Plugins

1. Core Functionality

   - `tauri-plugin-window-state`: Window position/size persistence
   - `tauri-plugin-single-instance`: Prevent multiple instances
   - `tauri-plugin-deep-link`: Custom URL scheme handling

2. File System & Dialog

   - `tauri-plugin-fs`: File system access
   - `tauri-plugin-dialog`: Native dialogs

3. System Integration

   - `tauri-plugin-notification`: System notifications
   - `tauri-plugin-shell`: Shell command execution
   - `tauri-plugin-process`: Process management

4. Updates
   - `tauri-plugin-updater`: Auto-update functionality

### Capabilities Configuration

Permissions are defined in `capabilities/default.json`:

- File system access (app data, cache directories)
- Window management (create, drag, resize)
- Shell execution (including sidecar)
- Remote URL access for API calls

## Platform-Specific Features

### macOS

- Vibrancy Effects: HudWindow material for translucent backgrounds
- Private API: Enabled for advanced window customization
- Title Bar Style: Overlay style for seamless integration

### Windows & Linux

- Fallback configurations without vibrancy
- Standard window decorations
- Platform-appropriate file paths

## Troubleshooting

### Common Issues

1. Build Failures

   - Ensure Rust toolchain matches `rust-toolchain.toml`
   - Check for missing platform dependencies
   - Verify icon files exist at correct paths

2. Update Issues

   - Confirm update server endpoint is accessible
   - Check signing certificates for production builds
   - Verify hash file generation

3. Sidecar Problems
   - Ensure sidecar binary has executable permissions
   - Check target triple matches build platform
   - Monitor sidecar output for errors

### Debug Tools

```javascript
// access Tauri update system from console
window.__tauriUpdate.check()
window.__tauriUpdate.install()
window.__tauriUpdate.isAvailable
window.__tauriUpdate.progress
```

## Best Practices

1. Version Management

   - Always verify `productName` before releases
   - Keep dev and prod configurations separate
   - Use semantic versioning for updates

2. Security

   - Minimize required permissions
   - Validate all IPC messages
   - Use CSP to restrict resource loading

3. Performance

   - Lazy load Tauri-specific features
   - Use sidecar for CPU-intensive tasks
   - Implement proper error boundaries

4. Testing
   - Test updates on development builds first
   - Verify deep links on all platforms
   - Check window state persistence

## Future Enhancements

Potential improvements and features:

- Cross-platform sidecar builds
- Enhanced update UI with changelogs
- Custom protocol handlers
- System tray integration
- Global shortcuts
- Native context menus
