# Product App Template Agent Guide

This is a Contrast app template: One + Tamagui on web and Peach native,
with better-auth, on-zero, Drizzle, one native SQLite application database,
docs, and a public landing surface. This file is project-local guidance.
The user may edit it; follow the saved project copy and do not overwrite it
unless asked.

## Running locally

On your own machine the `contrast` CLI runs this project
(`curl -fsSL https://contrast.dev/install.sh | sh` installs it).

- `contrast dev` runs the whole stack and prints the web URL. Leave it running
  in the background; it reloads on save.
- `contrast shot [route]` screenshots the running web app to a PNG and exits 1
  when the page logged an error. Check every UI change with it.
- `contrast ios` opens the app in a Peach iOS simulator in the browser;
  `peach describe`, `peach screenshot`, and `peach get errors` inspect it.
- `bunx tsc --noEmit` typechecks the app.
- `contrast login`, then `contrast link --create`, connects the project to
  contrast.dev; `contrast deploy` publishes it.

## Repo Map

- `app/_layout.tsx` owns root providers, document shell, and native stack
  defaults.
- `app/index+ssg.tsx` is the public splash/landing entry and `app/docs/[slug]+ssg.tsx`
  renders MDX docs — both are `+ssg` for SEO/first-paint. Render mode: the app
  defaults to `spa` (`vite.config.ts` `web.defaultRenderMode`), so interactive
  app routes are client-only; PUBLIC marketing/content pages (index, docs) opt
  back into SSG with a `+ssg` suffix. A route that imports a browser-only package
  (e.g. `react-native-wgpu`) must NOT be SSG/SSR — keep it client-only and load
  the package via `React.lazy` (relative import) so the build never evaluates it
  server-side.
- `app/auth/*` is the signed-out auth flow.
- `app/home/_layout.tsx` owns auth redirects and the Zero provider boundary.
  Any `useQuery`, `useZero`, or `usePermission` caller must stay below it.
- `app/home/(tabs)/_layout.tsx` and `_layout.native.tsx` own persistent tab
  chrome. A screen under a tab owns its own content and its own entry in those
  layouts and in the tab bars; it does not restructure the chrome around other
  screens.
- `starter-retirement.json` inventories starter-only leaves, components, and
  registry entries. When a new product replaces the starter, shared navigation
  runs `retire_starter` after the primary Design moves `APP_HOME_HREF`. The tool
  preserves changed leaves and unrelated registrations. Data and seed replacement
  belong to their data owners. `features/account/AccountToolbarButton.tsx`
  (with its `.ios`/`.android` legs) is permanent shared chrome, not starter
  content: each tab root mounts it in its screen content as the trailing
  settings gear of that root's own navigation bar, the native route to
  settings and sign-out after retirement. It is never listed in the manifest;
  a new product's tab roots mount it the same way.
- Each tab root declares its own primary action with `useTabAction` from
  `features/app/tabAction.ts` (label, href, optional `onPress`, and the web,
  SF Symbol, and Material glyphs). The native prominent tab, the web action
  circle (`MobileTabBar` from `contrast-ui/tabs/MobileTabBar`, rendered by
  `app/home/(tabs)/_layout.tsx`), and the desktop header button render the
  focused tab's action, and a tab without one shows none; per the
  `contrast-native-action-button` skill, never edit the three surfaces for it.
- Product identity lives in more than the copy. A rebrand edits `APP_NAME`,
  `APP_TAGLINE`, and `APP_SCHEME` in `constants.ts` (`APP_NAME_LOWERCASE`
  derives from it), `name`, `displayName`, and `scheme` in `vite.config.ts`'s `native.app`, the titles and descriptions in
  `docs/*.mdx`, and the `ZERO_APP_ID` and bucket names in `env.ts`; the
  settings footer, the docs pages, and the native app label all read these,
  so a starter name left in any of them ships.
- `app/home/settings/*` is the signed-in settings stack.
- `features/app/routes.ts` is the app route contract. Route scaffolds that
  rename, delete, or replace the default signed-in route update it first, then
  update owned callers from the constants.
- `interface/` contains reusable Tamagui primitives. Extend these before
  creating parallel button, dialog, image, list, avatar, card, or page wrappers.
- A native screen may import a project `.swift` file as a React component.
  `swift.d.ts` owns that module type, and the Swift entry conforms to
  `RNXPackage`; the browser preview compiles the whole Swift source set as one
  artifact and mounts the imported view inside the React Native tree.
- A create, edit, or quick-entry flow is its own route presented as a sheet;
  `skills/screen-authoring.md` owns that recipe, and `app/_layout.tsx` already
  mounts the `Presentations` host that gives it its web leg, so a leaf layout
  declares only its own screens. `Dialog` from `contrast-ui/dialog/Dialog` is
  for content the user reads or changes in place with no url of its own, and
  `dialogConfirm()` is the yes/no question before a destructive action. Never
  mount a raw `Sheet` for a form. `dialogConfirm()` and `showToast()` come from
  the same package, and `app/_layout.tsx` mounts their host once, inside
  `ContrastProvider`.
- `Input` and `TextArea` come from `contrast-ui/forms/Input` and
  `contrast-ui/forms/TextArea`, never raw Tamagui: one border, one focus ring,
  `size="xs" | "sm" | "md" | "lg" | "xl"`. A calendar day is `DateField` from
  `contrast-ui/forms/DateField` (`value` is the `YYYY-MM-DD` key), and a choice
  from a closed set is `Select` from `contrast-ui/select/Select` with items
  from the data contract's label catalog; neither is ever a plain text input.
  `interface/dialogs/SheetScreen.tsx` is the frame for a create or edit route
  (title, close, body, and one `action` with `disabled` and `disabledReason`).
- `interface/buttons/Button.tsx` re-exports the kit's `Button` from
  `contrast-ui/buttons/Button`, so every template's buttons improve with the
  kit. It takes boolean props for its looks: `<Button accent>` for the primary
  action, `<Button subtle>`, and `<Button glass>` for a control floating over
  content (a capsule, or a circle when square), plus `size` and `disabled`.
  Glass buttons that belong together share one `ButtonGroup`; a button on a
  surface such as a dialog footer stays plain. `variant` accepts only
  Tamagui's `outlined` and `quiet`. `contrast-ui` is imported by subpath only
  (`contrast-ui/forms/Input`, `contrast-ui/toast/Toast`); there is no root
  barrel.
- `sm`, `md`, `lg` are `contrast-ui` size names, and Tamagui controls take the
  same `xs`-`xl` names where they take a `size` at all (`Button`, `Progress`,
  `Slider`, `Input`, `Card`, `Select`, `Tabs`, and the checkbox/radio/switch/
  list-item family). A component with no `size` prop takes an explicit
  dimension or the `interface/` wrapper. Any other value, such as `"3"`, gets
  no size at all and the types accept it: a switch, checkbox, or radio
  collapses to a dot. Omit `size` for the default.
- `interface/app/Link.tsx` renders a real anchor and takes navigation props
  only. tamagui style props (`color`, `size`, `cursor`, conditional values) do
  nothing on it and leak onto the DOM node. style the child,
  or use `<Link asChild>` around a tamagui child with `render="a"`.
- `features/` contains feature helpers for auth, app chrome, docs, settings,
  theme, storage, and user data.
- `database/schema.ts`, `database/relations.ts`, and namespace files under
  `data/` are the source of truth for synced data.
- **Anything the user would expect to still have on another device belongs in
  the database, reached through Zero.** Device storage (`localStorage`,
  AsyncStorage, `@o/helpers` storage) is for state that is genuinely
  local: a collapsed section, a chosen tab, a theme override, an unsent draft.
  Put a product record there and it never syncs, never reaches the server, and
  is invisible on every other device and in the other platform's preview.
- each namespace under `data/` is one `<table>/` folder with `queries.ts` and
  `mutations.ts`. `data/generated/**`, `data/zero-client.tsx`, and
  `data/zero-server.ts` are generated/load-bearing wiring.

## First Visible Surfaces

Web and native land a first-time visitor on different screens, deliberately.
`app/index+ssg.tsx` branches on `isWeb`:

- **Web** renders `interface/marketing/TakeoutWebsite.tsx`: the public
  marketing/landing page, which sells the product and links into the app.
- **Native** redirects to `app/auth/login.tsx`, which renders
  `features/auth/ui/LoginScreen.tsx`. There is no public splash on native.
  `app/home/_layout.tsx` also redirects a signed-out user to `/auth/login`, so a
  deep link into the app lands on the same login surface.

The two surfaces currently share product identity but use different
compositions for their different jobs. The web entry action has the stable test
id `public-app-entry`; the native auth action has `login-as-demo`.

The web homepage preserves Takeout’s original artwork, animated phone demo,
terminal, responsive composition, and long-form sections. Its fonts and themes
are scoped to marketing; the app uses the canonical Contrast template UI.
`app/auth/login.tsx` and
`features/auth/ui/LoginScreen.tsx` are both rendered files for the native login
surface; the route file establishes `/auth/login` and the shared screen owns the
native mark, panel, and auth actions. The `native.app` icon, adaptive-icon,
favicon, and splash files are startup assets rather than children of either rendered
surface.

## Screen Geometry

The tab layouts wrap every leaf with clearance for their rendered bottom bar,
so replacing a screen body cannot put content beneath persistent chrome. Use
`interface/layout/PageScrollView` for ordinary scrolling screens instead of a
raw `ScrollView`; its native implementation owns safe-area and screen-specific
content insets while its web implementation preserves document scrolling. Use
`PageScrollView` plus `.map()` for most collections. Only genuinely long or
unbounded data earns virtualization, and that path is
`interface/layout/PageVirtualList`, built on `VirtualList` from
`contrast-ui/lists/VirtualList`. Never use React Native `FlatList`. Screen routes express only ordinary extra spacing through
the shared primitives' padding props and never read `useSafeAreaInsets()` for
scroll content. Verify the first visible node begins at or below the native top
inset and the final item can scroll above the bottom chrome.

## Auth And Demo Login

The template ships a real demo auth path:

- The public hero's primary app entry has stable `testID="public-app-entry"`.
- Open `/auth/login` when signed out.
- The demo button is labeled `Login as Demo User`.
- `features/auth/ui/LoginDemoButton.tsx` owns `testID="login-as-demo"` and
  `data-testid="login-as-demo"`; a login redesign keeps that component (or
  moves the ids with it).
- Pressing it signs in `demo@example.com`.

These ids and actions are part of the current auth contract, and
`package.json` `contrast.entry` states them for the platform that drives entry,
along with the `files` that render each entry surface's body.
A visual rebrand does not by itself change the entry or demo-login behavior; a
task that changes the auth flow or moves an entry surface's body must update its
callers and `contrast.entry` as part of the same change.

Do not touch the demo identity in `auth/demoIdentity.ts` (`DEMO_EMAIL`,
`DEMO_PASSWORD`, `DEMO_NAME`, `DEMO_USER_ID`) when re-branding. It is auth
infrastructure, is never shown to a user, and the password must stay >= 8
characters or better-auth rejects the demo sign-up ("Password is too short")
and the login loops forever. Re-brand user-visible copy, not these.
