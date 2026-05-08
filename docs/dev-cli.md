---
name: takeout-dev-cli
description: Interactive dev CLI (bun dev / one dev) — keyboard shortcuts to open iOS sim / web / android.
---

# dev cli

when you run `bun dev`, takeout starts several processes in parallel including the
One framework dev server (`one dev`). the dev server provides an interactive CLI
with keyboard shortcuts for common actions.

## keyboard shortcuts

the dev server uses a two-key combo system. press the first key, then the second:

- `ow` - open web in your browser
- `oi` - open app in iOS Simulator
- `oa` - open app in Android Emulator
- `oe` - open editor
- `qr` - show Expo Go QR code
- `dt` - open React Native DevTools
- `?` or `/` - show help menu

keys auto-clear after 3 seconds if you don't press the second key. press `Escape`
to cancel a partial combo.

## focusing a process

`bun dev` runs multiple processes in parallel via `tko run-all --pty`. by default
you're in **dashboard mode** where output from all processes is interleaved with
color-coded prefixes. in this mode, no process receives your keyboard input.

to interact with a specific process (like the dev server), you need to **focus** it.
each process gets a shortcut letter derived from its name — shown in the dashboard
header (e.g. `[d] dev  [w] watch  [t] types  [z] zero`).

- press a process's shortcut letter (e.g. `d` for one:dev) to focus it
- when focused, all keyboard input routes to that process and only its output is shown
- press `Ctrl+Z` to unfocus and return to the dashboard
- press `Ctrl+C` to exit all processes

so to use the dev server's two-key shortcuts like `oi` to open iOS Simulator, you
first press `d` to focus the dev server, then use the shortcuts as normal. press
`Ctrl+Z` when you're done to go back to the dashboard.

other process-level shortcuts from dashboard mode:

- `r` + shortcut letter — restart that process
- `k` + shortcut letter — kill that process

## what `bun dev` runs

the dev command starts several things in parallel:

```bash
tko run-all --pty --flags=last watch watch:types watch:zero:generate one:dev
```

- `watch` - watches for file changes
- `watch:types` - watches and rebuilds types
- `watch:zero:generate` - regenerates zero sync code on changes
- `one:dev` - the interactive One framework dev server (port 8081 by default)

## changing the dev port

the dev server defaults to port 8081 (set via `VITE_PORT_WEB`). you can override
it:

```bash
bun one:dev --port 3000
```

or set `VITE_PORT_WEB=3000` in your `.env` file.
