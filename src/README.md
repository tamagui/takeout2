The src directory contains all code.

Most app-specific code will be contained in `./src/features`, but not all code
can be organized by "feature", so it goes here directly.

The general idea is that `./src` has things like infrastructure (for example
`storage` directory used by docker-compose s3 storage service in local dev, or
`posthog` which is not a feature but setup code for analytics), or very generic
helpers that are used across many features (like the UI-related code in
`interface` and `hooks`).

The only files directly here for now are `setupClient` and `setupServer` as they
run before anything else via the One `setupFile` option.
