# App Routes & Layouts Analysis

## Summary

Ten key themes emerged from comparing `~/chat` app routes since `8321f763e` to `~/takeout`:

1. **Root layout simplified** — leaner providers, no `ProvideZero` at root, extracted `TamaguiRootProvider` memo
2. **`RootHydrationEffects` pattern** — blocking inline script + `useLayoutEffect` to set body CSS classes before hydration (prevents flash-of-wrong-class for Tauri/transparent backgrounds)
3. **`app/_layout.native.tsx` added** — dedicated native root with Splash gated on auth state, `animation:` → `transition:` for Stack.Screen
4. **Middleware rewrite** — lazy imports, beta access cache (15-min TTL), `redirectToLogin()` helper that clears stale auth cookies + sets `?sessionExpired`, `trackApiError()` extracted
5. **Auth routes moved** from `(app)/auth/` to top-level `app/auth/` — independent layout, cleaner guard separation
6. **Login page hardened** — `sawLoading` ref waits for server auth confirmation, `?returnTo`, `?sessionExpired` clears client storage, `AlreadyLoggedIn` inline component
7. **New auth endpoints** — `login-success.tsx` (popup + Tauri polling), `login-github.tsx` (multi-flow callbackURL), `oauth-success.tsx`, `smoke-auth+api.tsx`
8. **Health endpoint** now includes DB migration count/latest name + `GIT_SHA` + env
9. **Two dev-only local storage APIs** — `app/api/s3/[[...path]]+api.ts` (S3-compatible) and `app/api/file/bunny-mock/` (Bunny CDN mock)
10. **`app/api/geo+api.tsx`** — Cloudflare geo header → `needsCookieConsent` for GDPR

## SYNC - Direct Apply

| File | Notes |
|------|-------|
| `app/api/health+api.ts` → `.tsx` | Add migration query, GIT_SHA, env |
| `app/api/auth/test+api.ts` | Add `if (production) return 404` guard |
| `app/api/geo+api.tsx` | New — no app-specific deps |
| `app/api/smoke-auth+api.tsx` | New — update email/password constants |
| `app/api/s3/[[...path]]+api.ts` | New dev-only local S3 mock |
| `app/+not-found.tsx` | New simple 404 page |
| `app/effects.css` | Add `dialogShake` keyframe |

## ADAPT - Needs Modification

| File | Key adaptations |
|------|----------------|
| `app/_layout.tsx` | Keep font preloads + `RootHydrationEffects`. Remove `LinkHoverPreview`, `TauriEffectsRoot`, `CookieConsentEffect`, Tauri-specific path lists. Rename CSS import to `tamagui.generated.css`. |
| `app/_middleware.ts` | Adopt lazy imports, `redirectToLogin()` with cookie clearing, `trackApiError()` extraction, type-only import. Remove beta cache, custom domain cookie, dev setup. |
| `app/auth/_layout.tsx` | Nearly direct — just verify `AppBackgroundBase` import. |
| `app/auth/login.tsx` | Adopt `sawLoading`, `?returnTo`, `?sessionExpired` clearing, `AlreadyLoggedIn`. Remove beta/notAllowed copy. |
| `app/auth/login-success.tsx` | Adopt popup + poll flows. |
| `app/auth/oauth-success.tsx` | Direct apply. |
| `app/auth/login-github.tsx` | Adopt multi-flow callbackURL logic. |
| `app/_layout.native.tsx` | New file — remove `AppsProvider`, adjust screen group name. |
| `app/root.css` | Large additions — mask utilities, text-wrap, dragging UX are generic. Skip sidebar/menu/Tauri-specific parts. |

## SKIP - App-Specific

- `app/auth/login-external+api.tsx` — validates origins against chat's `server` table
- `app/api/auth-signup+api.tsx` — beta/waitlist with chat-specific tables
- `app/api/login-poll+api.ts` — Tauri desktop polling (unless takeout adds Tauri)
- `app/api/file/bunny-mock/` — Bunny CDN (chat's provider)
- `app/(chat)/`, `app/(site)/`, `app/(synced)/` — all chat product/site/infra routes
- Middleware: beta cache + dev setup logic
