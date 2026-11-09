---
name: one-deployment
description: Build and deploy One web apps to Node, Vercel, Cloudflare Workers or static hosting, and route native binary/OTA work to the native setup guides.
license: MIT
metadata:
  version: "2.0.0"
---

# Deployment

[Deployment guide](https://onestack.dev/docs/guides-deployment), [build](https://onestack.dev/docs/one-build), [serve](https://onestack.dev/docs/one-serve).

Choose the existing app's deployment target. Build and prepare artifacts before publishing; a skill does not grant permission to create paid resources or deploy an app.

```bash
ONE_SERVER_URL=https://app.example.com npx one build
npx one serve
```

Node output includes `dist/client`, `dist/server`, and `dist/api`. Keep required runtime dependencies with the deployed server. Use the project's lockfile and package manager rather than mixing installers in a container. `one serve --cluster` or `--cluster=4` enables multiple Node workers when the workload warrants it. Configure ports with `--port`, `ONE_PORT`, or overriding `ONE_FORCE_PORT`.

Read [targets](references/targets.md) for Vercel, Workers, static output, and native builds. `build.securityScan: 'error'` fails builds that detect secrets in client output; this is an additional check, not a replacement for server/client separation. `build.workers` and `build.concurrency` control static generation; use the app's build scripts and current option types.
