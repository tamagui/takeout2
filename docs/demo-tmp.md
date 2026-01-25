
Hello, I'm here to do a quick demo of some stuff we're releasing today.

Mostly three new major versions of OSS software:

One, Tamagui, and Takeout

In front of you here is Takeout, the apps works here on web and native, and everything is shared with web, so this splash page is not using some other setup.

Takeout is a complete re-write, with all new modern tech

It brings more Rails-like simplicity to modern cross-platform React. 

It's an incredible boost to productivity. We got fully scalable infra, website, and app approved into both app stores in two weeks late last year with a very early version of it, and it's gotten much better since.

Takeout solves for the three biggest pain points we with cross-platform React:

Framework, UI, and Data

So, One version 1 release candidate
It's a web framework and a native framework at once,
all with a single Vite plugin
Version 1 Release Candidate is out today.

There's honestly so many features, so check out the post,
some highlights include global and per-page render modes, the built-in Hono production server, Metro mode,  Middleware, Vercel and Cloudflare deploy, new dev tools, and a ton of new components, hooks, and helpers.

Tamagui 2 RC is also out today, and is an even bigger release.
Every aspect has improved:
 
- install, configuration, docs and tests
- web props, style props, the compiler, and native performance
- a new motion driver, faster gestures and animations
- and a new Sheet and Menu that rival the best

Ok, so Framework and UI, both libraries can claim to be the only ones that truly let you build truly web-native React Native apps.

But Data was the last, big hurdle.

We've continued to play with Zero sync over the last year,
deploying it to multiple production apps.

In the process we built a new open source `over-zero` library
that lets you get a more Rails-like structure to your Zero data,
more on that later

Anyway - let me stop yapping and let's take a look.

So this entire site is shared with this app
This homepage gets a 96 Lighthouse score without cheating 

- it's a fully hydrated React app, 100% shared UI
- and loads lots - popovers, sheets, tooltips, etc.

this tiny toolip shows multiple Tamagui features:

- a novel technique for onLayout that avoids repaints/reflows
- a new scope prop to mount only a single tooltip instance
- animatePositionChange for this nice effect
- Swappable animation drivers - here the lighter CSS driver

We can take a look at the vite.config
which is nice because this is just a plain Vite app

Some small highlights -

- we alias to react-native-web-lite
- it's a lightweight TypeScript fork of rnw
- it tree-shake to half the size, shares the fast onLayout engine
- has flicker-free SSR, and made our web apps feel much faster
- a small svg shim saved another 15Kb bundle on the web
- and of course we have the tamagui optimizing compiler.

There's a bunchf One optimizations, too: 

- experimentalMinChunkSize support
- react compiler option
- and the experimental_scriptLoading and inlineLayoutCSS options which gained us nearly 15 on lighthouse alone.

the big thing is here: 
- bundler 'metro'.
- we wanted to de-risk using One
- now you can just use Metro, with 0 setup
- we recommend it as it's stable
- and lets us experiment with Rolldown mode for the future

You see defaultRenderMode is SPA here,
 
BUT of course our homepage and docs are SSG

This is One's per-page render modes feature,
unique to One. In version one it's much more optimized and stable.

Ok, lets go briefly to the docs:

here we're using loaders which landed tons of features
they can be parallel, nested, refetched, and auto-typed.

the docs use some new One image features like auto optimization, blurs, and dimensions

plus nice new hot reload hooks so our MDX plugin automatically hot reloads the loaders on file changes

Now, to the good stuff, we'll go to login 

See if you notice anything as we do,
besides this beautiful design our developer, Quan.

If you didn't, that's a good thing.

We just routed across our static => dynamic parts of the app.
We loaded Zero, and our Motion driver

See how the tooltips are now bouncy

One v1 speeds up heavy loads with intent prefetching
smarly fetching css, js, and loader data by predicting links
your mouse is moving towards

this group layout is interesting to look at:

- new Redirect and Protected components
- you can see how we lazy loaded the motion driver here
- and improved performance by disablng SSR 
- typed VITE_PLATFORM
- to switch between Stack and Slot per-platform
- and loading Zero, Toasts, etc

So, looking at login again

Takeout uses better-auth and we've open sourced a library to make better-auth and Zero integration simpler

we have nice shared animations, native with Reanimated and web with Motion, plus AnimatePresence for easy shared enter/exit animations.

Tamagui got HUGE upgrades all round - three new off-thread
features so the entire pipline from press events to animation changes to the drivers themselves all now are off-thread on native.

This is thanks to a new @tamagui/native that lets you
optionally plug in react-native-gesture-handler and other native libraries for gracefully improved performance.

Ok, we'll login here.

We can see now the new Tamagui Menu here
It's a composable component, with nested menus

On native it uses the excellent Zeego,
on web it's really refined

Beside some fun UI, the really interesting thing I want to show
here is just Zero and our over-zero setup.

First, we can just open a post here on both and show how it instantly updates on both.

And this is with such concise and sensible code,

We can see the mutation here [FeedDetailPage:41], simple as can be, and this will update anywhere in our app we query for this data, on the very next frame.

We can take a look at the Comment model, over-zero has
an optional and opinionated system for permissions and CRUD mutations that are secure.

The Post model goes a bit deeper showing how easy it is to add side effects on server or client to your mutations.

No more clunky API routes, now you can just react to your mutations with side effects easily.

Queries are just as easy [queries/comment]

Defined using a simple typed query builder.

For queries we made it so over-zero make this super simple.
It auto-generates server validation and all the glue code and types so you just add queries and import them.

There's a lot more to our Zero setup from migrations to deployment, but we have more info on that in docs.

Ok, so really this demo was 3x the length, but it's already enough work launching all these things, and we've documented all these much better than before.

This demo covers just some of the cool pieces, and shows
how we deeply thought about solving for framework, UI and data, the three biggest pain points we felt in building real-world apps.

There's so much more in this repo from the nearly 30 agentic skills we've added and MCP integrations, a whole custom organized scripting and docs system, bun, multiple deployment options with an automated and optimized CI/CD pipeline, and so on.

The coolest part is Takeout now has a free version, which gives you all the cool setup of this repo, just without some of the deeper features.

So you can try it today with `npx one`, or `npx create-takeout`

Now, I need to go sleep for a few days :)
