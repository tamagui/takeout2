# Web deployment skew

[Skew protection](https://onestack.dev/docs/guides-skew-protection).

Old tabs can request chunks removed by a newer deploy. `web.skewProtection: true` is the default error-recovery mode: One catches chunk/preload failures and reloads with a session guard against loops.

`web.skewProtection: 'proactive'` additionally emits a version endpoint and polls for a new cache key. A stale client uses a full page load on a later navigation. `one-version-update` can support an app-owned update notice. Prefer the installed implementation's timing and event types over copying internal flags into app code.

Set `false` only when the app intentionally owns recovery. Keep HTML/version endpoint cache policy compatible with the deployment, and avoid long-lived cached HTML referencing deleted chunks. SSR personalized response caching still needs its own policy; skew recovery does not authorize public caching.
