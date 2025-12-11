#!/bin/bash
# setup-simulator.sh - Prepare iOS simulator for Maestro testing
# This script disables the Expo dev menu auto-show behavior

set -e

APP_ID="${APP_ID:-com.takeout.app.dev}"
DEVICE_ID="${DEVICE_ID:-$(xcrun simctl list devices booted -j | grep -o '"udid" : "[^"]*"' | head -1 | cut -d'"' -f4)}"

if [ -z "$DEVICE_ID" ]; then
    echo "Error: No booted simulator found"
    exit 1
fi

echo "Setting up simulator $DEVICE_ID for app $APP_ID"

# Mark dev menu onboarding as finished to prevent auto-show
xcrun simctl spawn "$DEVICE_ID" defaults write "$APP_ID" EXDevMenuIsOnboardingFinished -bool true
echo "  - Set EXDevMenuIsOnboardingFinished=true"

# Disable auto-launch of dev menu
xcrun simctl spawn "$DEVICE_ID" defaults write "$APP_ID" EXDevMenuDisableAutoLaunch -bool true
echo "  - Set EXDevMenuDisableAutoLaunch=true"

# Ensure showsAtLaunch is disabled
xcrun simctl spawn "$DEVICE_ID" defaults write "$APP_ID" EXDevMenuShowsAtLaunch -bool false
echo "  - Set EXDevMenuShowsAtLaunch=false"

echo "Simulator setup complete"
