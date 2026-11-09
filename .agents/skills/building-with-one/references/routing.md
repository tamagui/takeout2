# Routing

[Routing](https://onestack.dev/docs/routing), [typed routes](https://onestack.dev/docs/routing-typed-routes).

| File | URL / purpose |
| --- | --- |
| `app/index.tsx` | `/` |
| `app/blog/[slug].tsx` | `/blog/:slug` |
| `app/docs/[...rest].tsx` | Catch-all; `rest` is a string array |
| `app/(account)/settings.tsx` | `/settings`; groups add layouts, not URL segments |
| `app/_layout.tsx` | Root layout |
| `app/_middleware.ts` | Server middleware |
| `app/+not-found.tsx` | Not-found UI |
| `app/api/health+api.ts` | `/api/health` endpoint |
| `app/api/index+api.ts` | `/api` endpoint |

`route+api.ts` is an ordinary named segment, not an index convention. Use `index+api.ts` for a directory's root endpoint.

Render modes use `+ssg`, `+ssr`, `+spa`, or `+api` on files or folders. File suffix wins over the nearest folder suffix, then `web.defaultRenderMode` (SSG by default). Folder suffixes do not appear in URLs. `_layout+ssg.tsx` can render a shell around SPA pages; layouts do not inherit a folder's render mode.

Keep reusable modules outside the route directory, or use `router.ignoredRouteFiles` for explicit exclusions. `router.root` can change the default directory.

Use `.web.tsx`, `.native.tsx`, `.ios.tsx`, or `.android.tsx` siblings through extensionless imports. Check the project's shared route file and generated types when introducing a platform-only route.

One supports named parallel slots (`@sidebar`) and intercept prefixes `(.)`, `(..)`, and `(...)`. Read the installed router's slot/interception contracts before composing them; do not substitute a different framework's layout prop conventions.

`one dev` generates `app/routes.d.ts`; `npx one generate-routes` regenerates types. `createRoute<'/blog/[slug]'>()` supplies typed `useParams` and `createLoader`; `RouteType<'/blog/[slug]'>['LoaderProps']` types a plain loader. `--typed=runtime` or `--typed=type` additionally inserts helpers into route files. Do not edit generated declarations.
