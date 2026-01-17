The src directory contains all code that deals with your actual app - frontend,
backend, and infrastructure.

Any code that can be organized by "feature" (think: account, feed, etc), should
live in `./src/features`, and all the rest lives directly in `./src` - things
like infrastructure, or very generic helpers used across many features (like the
UI-related code in `interface` and `hooks`).

Note also `setupClient` and `setupServer` directly in this folder. Since they
run before anything else via the One `setupFile` option, we like them being
directly here.

Nest things lazily - start flat, but if a folder gets large, slowly add sub-folder.
