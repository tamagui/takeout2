# Takeout Starter

Takeout is a production-ready starter for building real-time, cross-platform
applications. It brings together modern tools and patterns that we've refined
through building real products, with a focus on developer experience and
deployment reliability.

Find out much more by using `bun tko` for available commands and
`bun tko docs list` for built-in docs.

## Repository Structure

The entire project lives in a single package.json to avoid monorepo complexity.
Everything from the web app to native iOS and Android builds, Tauri, and infra
is defined in this codebase.

## Build Pipeline

The CI/CD setup runs on GitHub Actions with WarpBuild for performance, getting
from commit to deployed in about 5 minutes end-to-end. The pipeline handles
everything including running Playwright integration tests, building iOS apps and
pushing to TestFlight, deploying the web app, running the full test suite with
Vitest and Playwright, and managing database migrations and backups.

The system includes rollout monitoring that watches health metrics and error
logs after deploy, automatically flagging issues. Playwright tests get enhanced
logging that makes debugging failures much easier than the default output.

## SST Infrastructure

SST handles deployment with some custom additions. It automatically syncs the
Zero version between client and server to avoid version mismatches, includes
safeguards against crash loops during deployment, and has an optimized mode for
running on spot instances during early development.

## AWS Tooling

There's a collection of scripts for production operations like health checks
that ping the app and verify it's responding correctly, database backups that
run automatically on deploy, clearing CloudWatch logs when they get too verbose,
and administrative tasks like adding or removing users from organizations.

## Services Integration

Environment management is code-driven, with validation and automatic generation
of the env files. Docker Compose orchestrates local development and test
environments. Images go to Cloudflare R2. Analytics and error tracking run
through PostHog. Email sends via Postmark. Video hosting uses Bunny.

## Development Scripts

Beyond the standard npm scripts, there are utilities for upgrading dependencies
safely, running the development environment, tunneling into SST for local
testing against production services, connecting to the production database via
psql, subsetting fonts to reduce bundle size, and launching a REPL with the app
context loaded.

## Libraries

Authentication is handled by better-auth with better-fetch for network requests.
Forms use @tanstack/react-form. Validation runs through Valibot rather than Zod
for better performance and smaller bundles.

## Developer Utilities

@vxrn/helpers and the ./src/ folder has a lot of nice helpers. There's an event
emitter system for cross-component communication, keyboard shortcut management
that works across platforms, URL unfurling for rich link previews, image upload
with progress and error handling, and drag and drop that works in the browser
and Tauri, with support for nested drop areas.

## Desktop Application

The desktop app runs on Tauri with support for sidecars (running additional
binaries alongside the main app), deep linking from browser to app, auto
updates, and icon generation for all platforms.

## Zero Integration

Zero provides the real-time sync foundation. We've built the `over-zero` package
which adds tons of nice helpers on top, and gotten a nice setup for Zero that
makes managing it, debugging it and deploying it easier.

## Development Experience

The project uses Bun for speed. TypeScript runs through tsgo for faster
compilation. Circular dependency detection uses @glideapps/ts-helper. There's
automatic node version checking to catch environment issues early.

Database operations include sync, pull, and push commands that work with both
local and production. Environment variables can be pulled from production for
debugging.

Components like EnsureStableId prevent React key issues. useStableMemo avoids
unnecessary rerenders. The Dev namespace and devGlobal make debugging easier by
exposing internals in development.

Helper functions and hooks cover common patterns like useAsyncEffect for async
operations in effects, sleep for delays without callback hell, useLazyMount for
deferring expensive renders, and idle detection for running background work.

## UI Framework

Tamagui provides the component foundation with Reanimated as the motion driver
for smooth animations across web and native.

There are composable component primitives like ListItem and Button that work as
building blocks for more complex UI.

## Native Dependencies

The project includes several native dependencies that enhance mobile
capabilities:

**UI & Gestures**

- react-native-reanimated for performant animations across platforms
- react-native-gesture-handler for comprehensive gesture support
- @gorhom/bottom-sheet for native bottom sheet modals
- react-native-bottom-tabs for tab navigation with native feel
- @bottom-tabs/react-navigation for React Navigation integration
- react-native-keyboard-controller for advanced keyboard handling
- react-native-safe-area-context for safe area insets

**Media & Graphics**

- @shopify/react-native-skia for 2D graphics and animations
- expo-image for optimized image loading
- expo-image-picker for camera and photo library access
- @nandorojo/galeria for image galleries
- react-native-svg for SVG rendering

**Data & Storage**

- @op-engineering/op-sqlite for local SQLite database (used by Zero)
- react-native-mmkv for fast key-value storage
- expo-secure-store for encrypted credential storage
- react-native-quick-crypto for cryptographic operations

**Permissions & System**

- react-native-permissions for runtime permission handling (camera, photo
  library, microphone, notifications)
- expo-notifications for push notifications
- expo-haptics for haptic feedback
- burnt for native toast notifications
- zeego for native context menus

**Other Native Features**

- @react-native-masked-view/masked-view for view masking effects
- expo-blur for native blur effects
- expo-linear-gradient for gradient support
- expo-glass-effect for frosted glass UI effects
- expo-liquid-glass-view for advanced glass morphism
- react-native-worklets for running JS on UI thread

All native dependencies are configured in app.config.ts with appropriate iOS and
Android permissions and build settings. The project uses static frameworks on
iOS for faster builds and better compatibility.
