fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios check_app

```sh
[bundle exec] fastlane ios check_app
```

Check bundle ID and app record

### ios setup_certs

```sh
[bundle exec] fastlane ios setup_certs
```

Setup certificates and profiles (readonly)

### ios sync_certs

```sh
[bundle exec] fastlane ios sync_certs
```

Create/sync certificates and profiles (writes to match repo)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
