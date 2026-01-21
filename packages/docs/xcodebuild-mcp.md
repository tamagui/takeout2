---
name: takeout-xcodebuild-mcp
description: iOS debugging with XcodeBuildMCP. run or test react native, debug ios, debug native, ios simulator, run simulator, ios device, device debugging, xcode build, native app debugging, simulator logs, capture screenshot, ui automation, test ios, run on device, launch simulator.
---

# xcodebuild mcp

ai-powered xcode automation for building, testing, and debugging ios apps.

## setup

xcodebuildmcp is configured in `.mcp.json` at the repo root. install axe for ui automation:

```bash
brew install cameroncooke/axe/axe
```

### requirements

- macos 14.5+
- xcode 16.x+
- node.js 18.x+

## common tasks

### build and run on simulator

```
build the ios app and run it on iphone 16 pro simulator
```

### debug with logs

```
capture simulator logs while I test the login flow
```

### run on physical device

requires code signing configured in xcode. then:

```
deploy to my connected iphone and show logs
```

### capture evidence

```
take a screenshot of the current simulator state
record a video of me testing this flow
```

### ui automation

```
tap the login button
scroll down on the simulator
describe the current ui elements
```

## available tools

### simulator management

- list/boot simulators
- install and launch apps
- capture logs, screenshots, video
- perform gestures (tap, swipe, scroll)
- describe ui elements for automation

### device management

- discover connected devices (usb/wifi)
- install and launch apps
- capture logs
- stop running apps

### build & test

- build for any platform (macos, ios sim, ios device)
- run test suites
- list schemes and configurations

## debugging workflow

1. build and run on simulator

```
build takeout for ios simulator and run on iphone 16 pro
```

2. capture logs while testing

```
show simulator logs filtered for "error"
```

3. capture screenshot on issue

```
take a screenshot now
```

4. check ui state

```
describe the current ui elements on screen
```

## troubleshooting

run the doctor command to diagnose issues:

```bash
npx xcodebuildmcp doctor
```

common issues:

- **build fails**: check xcode command line tools: `xcode-select -p`
- **device not found**: ensure device is trusted and connected
- **ui automation fails**: ensure axe is installed via homebrew

## links

- https://www.xcodebuildmcp.com
- https://github.com/cameroncooke/XcodeBuildMCP
