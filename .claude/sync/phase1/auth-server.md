# Auth, Server & API Changes Analysis

## Summary

The chat app has undergone a major structural refactor since `8321f763e`, splitting the monolithic `src/server/` (3 files) into four purpose-scoped directories: `src/auth/`, `src/api/`, `src/start/`, and `src/dev/`. The takeout template currently has `src/server/` (3 files) and `src/features/auth/`. The chat repo completed a refactor the template should eventually adopt.

## Structural Refactor: src/server/ → src/auth/ + src/api/ + src/start/ + src/dev/

Introduced in the "organizing" commit (`6641cc8ed`). Rationale:
1. `src/server/` was too small (3 files) and misnamed — it held server-only constants and admin check, not server logic.
2. Auth grew significantly (JWT validation, zero auth data, login polling, server member checks) and warranted its own top-level module.
3. The REST API layer (external SDK/CLI access) was entirely new.
4. Dev helpers (admin login, impersonation) needed isolation.

## Auth System Changes

**better-auth Server Configuration — key improvements in chat over takeout:**

1. **Dynamic `trustedOrigins` (async function)** — chat uses an async function doing a DB lookup for custom domains with a 5-minute in-memory cache (1000 entry max). Takeout uses a static array.
2. **`crossSubDomainCookies` conditioned on `SERVER_IS_PRODUCTION_HOST`** — smarter than takeout's domain string check.
3. **JWT expiration shortened**: chat uses `1d`, takeout uses `3y`. Chat's is far more secure.
4. **Logger configured**: `logger: { level: 'warn' }` to suppress noise.
5. **`emailHarmony` removed with comment**: important note about a bug (user created but credential account not created → 422/401 on retry).
6. **Takeout still has** (not in chat): `rateLimit` config, `emailOTP`, `phoneNumber`, Cloudflare IP headers.

**New server-side auth helpers (not in takeout):**

- **`validateToken.ts`** — JWT validation via JWKS with `jose`, cached `createRemoteJWKSet`, supports `FORCE_ISSUER` env for CI.
- **`getJWTRequestCookie.ts`** — Extracts `better-auth.jwt` from cookie header.
- **`getRequestUser.ts`** — JWT-first fast path (no DB) with session fallback.
- **`getZeroAuthData.ts`** — Three-path auth for zero-cache: cookie / Bearer session-token / Bearer sk_ API key. Also maps agent API keys to agent's userId.
- **`adminAuthData.ts`** — Admin auth data constant for server-side operations.
- **`ensureReqAuth.ts`** — Improved vs takeout's `ensureAuth`: distinguishes 401 vs 403, checks `ADMIN_WHITELIST` in addition to role check.
- **`loginPoll.ts`** — Cross-browser login polling (chat-specific).
- **`ensureServerMember.ts`**, **`ensureResourceAccess.ts`**, **`ensureZeroPermission.ts`** — Permission checks combining auth + zero queries (chat-specific model but patterns are useful).

**Auth client changes:**
- `authData` type now includes `email` field.
- Exports added: `getAuth`, `getValidToken`, `updateAuthClient`.
- **`authSync.ts`** (new) — Three-path login detection: popup postMessage, BroadcastChannel cross-tab, server poll.
- `plugins.native.ts` — `expoClient` with `expo-secure-store`.

## API Architecture (entirely new — takeout has nothing equivalent)

Chat built a complete REST API framework in `src/api/`:

- **`types.ts`** — `ApiEndpoint`, `ApiResponse<T>`, `ApiError`, `ApiErrorCodes` enum.
- **`errors.ts`** — `ApiRequestError` class + `classifyError` mapping Postgres SQLSTATE codes to HTTP responses.
- **`response.ts`** — `successResponse`/`errorResponse` returning `{ ok: true, data }` / `{ ok: false, error }`.
- **`generateApiKey.ts`** — `sk_live_<base64url>` generation, SHA256 hashing, preview string.
- **`rateLimit.ts`** — In-memory sliding window rate limiter with per-resource limits and standard response headers.
- **`auth.server.ts`** — `authenticateApiRequest()` handles API key (`sk_...`) and session auth, returns permissions with role flags.
- **`schema.ts`** (`API_MUTATIONS`) — Declarative config of exposed zero mutations with transforms and validators.
- **`queryRegistry.ts`** (`QUERY_REGISTRY`) — Unified registry with description, REST path, query function, SDK/CLI flags, SDK response type. Also `MUTATION_REGISTRY` with metadata.
- **`handler.ts`** — `handleApiRequest()`: auth → find endpoint → rate limit → validate → transform → execute via `zeroServer.mutate`.
- **`queryHandler.ts`** — `handleQueryRequest()`: auth → whitelist → rate limit → parse (GET query string or POST body) → type coercion → valibot validate → `zeroServer.query()`.

## SYNC — Direct Apply

1. **`validateToken.ts`** — JWT JWKS validation with caching and CI support.
2. **`getJWTRequestCookie.ts`** — Cookie parser helper.
3. **`getRequestUser.ts`** — JWT-first fast auth path.
4. **`adminAuthData.ts`** — Admin auth data constant (change email value).
5. **`CAN_ADMIN_BYPASS` constant** — Add to `src/features/auth/constants.ts`.
6. **`getIsAdmin` null safety** — Handle `null`/`undefined` input.
7. **BroadcastChannel cross-tab sync** — From `authSync.ts`, generic part.
8. **`api/types.ts`** — Error codes, endpoint types, response types.
9. **`api/errors.ts`** — Postgres error classification.
10. **`api/response.ts`** — Response helpers.
11. **`api/generateApiKey.ts`** — Key generation utilities.
12. **`api/rateLimit.ts`** — Rate limiter.
13. **`dev/middlewareDevTools.ts`** — Dev auth bypass middleware.
14. **better-auth logger config** — `logger: { level: 'warn' }`.
15. **JWT expiration `1d`** — Change from `3y` in authServer.

## ADAPT — Needs Modification

1. **Dynamic `trustedOrigins`** — Remove DB lookup for chat's `server.domain` table; adapt for takeout's needs.
2. **`getZeroAuthData.ts`** — Keep three-path pattern; remove `agentConfig` table reference.
3. **`ensureReqAuth`** — Add whitelist check + 401/403 distinction; keep takeout's auto-sign-in logic in apiHandler.
4. **`authenticateApiRequest`** — Role permissions shape may differ from takeout's model.
5. **`api/schema.ts`** — Framework is reusable; exposed mutations are chat-specific.
6. **`api/queryRegistry.ts`** — Registry pattern is excellent; specific queries are chat-specific.
7. **`afterCreateUser.ts`** — Different data model; needs adaptation to takeout's `userPublic`/`userState` setup.
8. **`authFetch.ts`** — Chat uses `@better-fetch/fetch`; verify package compatibility.
9. **`authClient.ts` `authData`** — Add `email` to AuthData type and memo.

## SKIP — App-Specific

- `src/start/` — Entire directory (chat CLI/SDK external package).
- `createTamaguiServer.server.ts` — Chat server initialization.
- `testUsers.ts` — Chat test user setup.
- `loginPoll.ts` — Cross-browser login poll for custom domains.
- `openAuthPopup.ts` — Cross-domain auth popup.
- `ensureServerMember.ts` / `ensureResourceAccess.ts` — Chat permission model.
- `checkBetaInvite.ts` / `ensurePrivateBetaAccess.ts` / `getPrivateBetaAccess.ts` — Private beta gate.
- `auth/ui/Login.tsx` / `LoginSignupContents.tsx` — Chat login UI.
- Specific mutations/queries in `api/schema.ts` and `api/queryRegistry.ts`.

## Key Dependencies (new in chat, not yet in takeout)

- `jose` — JWKS JWT verification in `validateToken.ts`
- `@better-fetch/fetch` — Used in `authFetch.ts`
- `valibot` — Query param validation in `queryHandler.ts`
- `server-only` — Server file guard (used extensively in chat)

## Migration Path

**Phase 1 (no restructure):** Add `validateToken`, `getJWTRequestCookie`, `getRequestUser`, update `ensureAuth`→`ensureReqAuth`, fix `getIsAdmin`, add `CAN_ADMIN_BYPASS`, update `AuthData` type with `email`, fix JWT expiration and logger in `authServer`.

**Phase 2 (new API module):** Create `src/features/api/` with types, errors, response, generateApiKey, rateLimit, auth, handler, queryHandler. Wire up routes.

**Phase 3 (structural refactor, optional):** Move `src/features/auth/` → `src/auth/`, `src/server/` env vars → `src/constants/env-server.ts`, dev helpers → `src/dev/`. Update all imports.
