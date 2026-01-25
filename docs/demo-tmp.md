
Today we're releasing three major versions of opens source software

One, Tamagui, and Takeout

In front of you here is Takeout

which is the result of many years of effort trying to
bring Rails-like simplicity to modern cross-platform React

Takeout brings together some really exciting new tech
in frontend, as well as a lot of AI integration to try and make
something both beautiful inside and out, and extremely
fast to iterate on.

Takeout solves for the three biggest pain points we with cross-platform React:

Framework, UI, and Data

One solves for framework, version 1 RC is out today.
It's an universal framework that lives in a single Vite plugin,
v1 has so many features we won't get to half in the video
but major highlights are Metro mode,  Middleware, Vercel/Cloudflare deploy, Lighthouse optimizations, dev tools, and tons of new route features and hooks.


Tamagui 2 RC is also out today, and is a big jump forward.
Every fundamnetal is leaps better - ease of install and configuration, docs and tests, web alignment, and compiler optimization. Some feature highlights are the new motion driver, hugely native performance and animation upgrades, and a new Sheet and Menu that are as high end as any other library.

The final piece Takeout focuses on is data, 
we continued playing with Zero sync over the last year
and built a new `over-zero` library that lets you bring a 
Rails-like structure to your zero apps.

Ok, lets fucking look at this thing and stop yapping.

The homage itself the first interesting part. This is our takeout app deployed to production. It get's a 96 Lighthouse score without cheating - it's a fully hydrated React app, 100% shared UI with native, and loads a lot of UI like popovers, sheets, tooltips, and drawer.

You can see a small example of Tamagui 2's imrovements just in the tooltip:

- An all new onLayout engine that avoids repaints and reflows
- A new scope prop to mount only a single tooltip instance
- animatePositionChange forthis nice effect
- Swappable animation drivers - light CSS driver here
- But later we swap to Motion

We can see the vite.config, it's plain vite but we have a bunch of optimizations going on.

On the tamagui side we have tamaguiAlias here.  Rnw-lite is light TS fork of rnw, it can tree-shake to half the size, and it shares onLayout optimizations which made our large apps feel way better. Our svg shim saves 15Kb on web. Of course we also have the tamagui optimizing compiler.

There's a bunchf One optimizations, too: experimentalMinChunkSize support, react compiler, and new  experimental_scriptLoading and
inlineLayoutCSS options.

Another big thing here is the bundler: 'metro'. We've de-risked using One as it can now easily hand off to Metro with a single line of config. We recommend Metro mode as it's stable, and we'll keep experimenting with Rolldown support in the meantime.

You also will see defaultRenderMode being SPA - but in fact our homepage and docs are SSG. This is One's per-page render modes feature, something unique to One. In v1 it's way more optimized and stable.

Ok, briefly on the docs:

loaders work everywhere, typed, even in layouts now, and you have parallel nested loaders and refetching. useMatches lets you access loader data easily on native or web anywhere in the tree.

One now has imageData imports with auto optimization, blurs, and dimensions, plus smart hot reloading features for loaders for mdx pages like this.

Onto login - see if notice anything as we go to the login page besides this beautiful design by one of our developers, Quan.

Hopefully you didn't!

We just routed across our static => dynamic parts of the app.
We loaded Zero, our Motion driver - See how the tooltips are
bouncy now - One v1 has intent based prefetching now based on your mouse movements.

In the layout note this (app) group, we can see a lot going on:

- a new Redirect component
- Tamagui Configuration which:
  - disables SSR for better SPA performance
  - switches our animation driver
- Adding in Zero
- Some PlatformSpecificProviders
  - using platform specific extensions so on web its empty, but native gets some
    nice features
- our typed VITE_PLATFORM env, switching between Stack and Slot per-platform
  easily
- new Protected component that can guard any route declaratively

Ok, back to login. Takeout uses better-auth with a nice library to integrate
with Zero. On web, the new Tamagui Input aligns with web standards so it's easy
to use, these animations use AnimatePresence which now can adjust transitions
specifically for enter/exit.

Our native our login screen is animated using a re-written Reanimated driver
that now has worklets support combined with a new avoidReRenders pipeline in
Tamagui 2 which completely avoids rendering for many internal style changes.

On top of that, we have a new @tamagui/native package that lets you optionally
plug in react-native-gesture-handler. When you do, even your Tamagui press
events move off-thread!

Next we can show a few things: first, the beautiful new Tamagui Menu composable
component, with support for nested menus. On native it uses the excellent Zeego,
on web it's first-class Tamagui so you can theme it, animate with motion, new
for v2 all popovers automate transform origin so your animation comes from where
it starts, and inside it uses safe polygons, has great keyboard controls and
accessibility, and smart positioning.

On the native side we can just take a quick peek some fun UI like this tab bar,
and the top navbar.

But of course the real interesting thing to see here of is Zero, our over-zero
library and setup, and the overall data system. Lets take a look at the post
model, models are a great entrypoint to Zero. In Takeout we've taken a bimodal
approach to structuring code outside of the routes.

In ./src directly we have high level things - anything that doesn't fit into a
feature, goes into here. Infrastructure, global utilities, etc.

Then all feature-level code goes in ./src/features. In ./src/data lives the data
schemas, queries, and mutations. We've tried to get this to be a nice mix of
idiomatic Zero, but with a bit more co-location and a bit less glue code
necessary.

You can see models here - let's open post. Models co-locate schema and
mutations. This video is already going to be far too long so I'm going to dive
deeply into Zero, or over-zero, but I think the strong part of Zero is how easy
this is to grok up front.

You can actually BYO permissions system, but we wanted a quick way to generate
secure CRUD mutations, so the `mutations` helper from over-zero does just that,
ensuring your permissions query is the default permission.

This lets us write things like this [FeedDetailPage:41]

Again, keep in mind this is a beta release so we haven't ported in any of our
nicer from validators, or error handling.

The main point here is to show queries and mutations.

Our query for comments is over here: commentsByPostId. Simple as can be. We
could structure this as a join, but since posts are fetched without comments for
the feed we've separated them. The nice thing about Zero is no matter if you use
a join or separate query, you don't have to think about or change your mutation:

if I press here - it just works, optimistic mutations come for free. It's the
key to building great feeling apps.

I'll just show this really quickly - the over-zero library and other libraries
we've made free are the result of using this stack for over a year building
multiple production apps in the app stores. It took us a really long time to get
these things working well! In part because Zero was in alpha and changing, but
also in part because deploying a sync engine takes time, gluing together a great
web experience and app experience that seamlessly transition also does, and we
wanted our data model to look great like this, not to mention a really nice
migration system, etc.

For example, over-zero generates a variety of files for you so you can just
avoid doing a lot of procedure gluing together files and types. This also helps
avoid circular dependencies, and server dependencies from finding their way into
your client, which we found to be a concern in early setups we had.

It even watches and auto-generates validations for you directly from your
TypeScript types in your queries!

Ok, so there's so much more to this repo. I'll just run through a few things
quickly.

We have nice settings screens that are responsive and fully shared, with light,
dark, and system themes.

We have a whole Bun scripting system through a new package "tko" that makes it
really easy for AI agents to list out every script + description of it in your
repo, including our built-in scripts.

That includes for example a nice env management system with scripts to
auto-generating new env variables in to the four places they are needed. It also
has scripts to push env to Github, pull env from SST if you use it, and so on.
Scripts are nicely grouped and you can automatically call them easily - it's
sort of like file-based scripts, akin to file-based routing.

Another worthy mention is the deployment system, we have an onboarding script
that guides you through setting up either Uncloud or AWS (wip) via SST. Both
give you great Infrastructure as Code, Uncloud is earlier but simpler and able
to self-host, it's extremely promising. While we've used SST for our two
production deploys, if you optimize it you can get it to about $200/mo for a
basic Aurora DB, load balanced and scalable system that feels fast.

And of course a bunch of AI agent harnesses. (show skills list). These have
taken a LOT of time to refine and ensure they pop up at the right time. We're
iterating on these constantly.

script:We're launching three new major versions of three different OSS projects
today.In front of me is Takeout 2, a new stack that achieves some amazing stuff
for the first time. It's bring a more Rails-like simplicity to cross-platform
apps, but keeps platform-native feel, and super performance.

In order to do that we had to solve for the 3 biggest problems in React Native &
web, aka "universal" apps: framework, UI, and data.

For framework, we're releasing One v1 RC today. And for UI, we're releasing
Tamagui v2 RC.

Both of these majors are huge releases, I'm hoping I can get through just a
fraction of the interesting changes today.

The final hard problem was data. Native apps want client-side databases,
realtime sync, optimistic mutations. Websites have many limitations make all of
those thing hard.

Thankfully, the Zero sync engine has been crushing those problems one by one.
Sync engines are the future of frontend development. We spent over a year
building Takeout 2, launching two apps into the app stores for ourselves and
clients. It's beta still but incredible fun, and comes in a free and paid
versions which supports our . OK. Let's take a look.This takeout landing is
actually the live Takeout stack running at takeout.tamagui.dev.

What I want to show first is the Lighthouse score it gets. Mind you this is with
100% shared code on a fully hydrated react app with sheets, tooltips, buttons
and more.

See for example the beautiful Tamagui 2 Tooltips. Achieving this effect is the
result of three new features:

- The new scope prop works on most components, making i dead simple to re-use a
  single Tooltip, Popover, Drawer, or Sheet instance at the root with
  lightweight triggers anywhere below.
- Tooltip.animatePositionChange for this nice move-between animation
- And swappable animation drivers. On the homepage we're using the lightweight
  CSS driver for performance, but inside the app it automatically swaps out for
  our new Motion driver, for off-thread spring animations

To achieve near perfect lighthouse scores we had to do a ton more work, both in
Tamagui and One. Sharing code with React Native can be treacherous because even
react-native-web itself is large, doesn't tree shake, and isn't SSR friendly. If
we check out the vite.config, we can see some of the ways we've improved
this.First, see the tamaguiAlias here. We've quietly had a fork of
react-native-web we've been maintaining that had a few aims: Split out the core
so it can be used externally, convert to tree-shakeable typescript, and simplify
it a bit for bundle size. This actually was a huge project - the Tamagui
onLayout system evolved throughout v1 to become extraordinarily performant, and
far more accurate than react-native-web. So with rnw-lite, you get a layout
system that almost never causes repaints and reflows. You also share the core
tamagui style system that's lighter weight, and again, it tree-shakes what you
don't use.Coming to our next optimization, we found the experimentalMinChunkSize
setting in Vite to help boost a good amount, but this isn't trivial for a
framework to support. One landed some internal upgrades to handle this in every
case.Of course the tamagui optimizing compiler still uses full-on partial
evaluation to flatten and extract even logic-filled inline styles.And in the One
section it's filled with new optimizations. One-line React setting,
experimental_scriptLoading, and inlineLayoutCSS. These are all documented in the
v1 blog post for One.While were here we may as well also look beyond web
performance at some other nice new things - namely this bundler 'metro' setting.
This is the biggest feature of One v1, which is Metro mode. We realized pretty
early on that people just didn't want to risk their startup on some experimental
React Native bundler built by a tiny team, and honestly it makes sense even to
us - the RN ecosystem is highly, eccentric, lets call it, and supporting a lot
of the weird configurations we saw in Vite took ages. We recommend Metro mode
now as the stable option, it works fantastically, it's safe and simple, and
Metro has gotten much faster in the last year. It's also nice for us to have the
pressure lifted - Rolldown is landing full-bundled dev mode soon, and that
should actually solve the three biggest difficulties with our experiment making
Vite support RN.Ok, next, let's quickly check out the docs, but peep this
setting here - defaultRenderMode SPA. Our app here is mostly a SPA, but we can
have a few highly performant pages. One is great here, with SSR, SSG and SPA
per-route.

See the +ssg on index and docs routes here.

The nice thing is loaders work everywhere, typed, even in layouts, and across
render modes as your navigate. One also can now deploy to Node, Vercel, or
Cloudflare with all these modes working. We made loaders way better to -
parallel loading, refetching with useLoaderState, preloads static loaders on
hover, and other features like useMatches to access loaders state from anywhere
in the tree.In the layout here:

since we set inlineLayoutCSS in One, this syntax highlight css in our layout
inlines into the HTML for faster loads. You'll note Tamagui's flexibility, we
set a setting to allow this type, so it's not a pain in the ass to use with web,
and it still gets optimized at compile-time.And in the docs page, One enables:-
sitemaps- createRoute, auto-generated and auto-updated- OG images with satori
via a new api route

We have that are generated at build-time right in our loader. Not only that, One
now has two new features for optimizing images automatically with Sharp, and
getting their blur image and typed image sizes automatically, whether via import
or via the ... helper.

The OSS MDX library we built for ourselves has another nice integration with
another new One feature - hot reloading loaders. We have a new global and export
you can use to automatically track files in your loaders to watch and hot
reload.OK - lets check auth here, I'll move to the production takeout site just
for a moment here, I want you to see if you notice anything as we go to our
login page.

(optionally could throttle cpu and network here?)Did you see it?

Well, besides this beautiful design by Quan, on the Tamagui team, hopefully it's
that you didn't notice anything at all. That's because we just routed across a
pretty significant boundary seamlessly -

We went from a static page to a SPA page, we also went from CSS animation driver
to our springy new Motion driver. And we loaded Zero. See how the tooltips are
bouncy now? One v1 has smart preloading as well, with a smart CDN cacheable
method that avoids any need for pre-computation.

Let's take a look at the layout to see what all changed, note it's in this (app)
group.

Some highlights here are:

- the Redirect component
- Re-configuring tamagui to both:
  - disableSSR which avoids double-renders
  - and switch to our motion animation driver
    - Tamagui also lets us swap animation drivers - so we use a hybrid of CSS
      and Motion on web. On native, we use the new Reanimated driver
- Adding in Zero
- Some PlatformSpecificProviders
  - using platform specific extensions so on web its empty, but native gets some
    nice features
- our typed VITE_PLATFORM env, switching between Stack and Slot per-platform
  easily
- new Protected component that can guard any route declaratively

Ok, back to login. Takeout uses better-auth with a nice library to integrate
with Zero. On web, the new Tamagui Input aligns with web standards so it's easy
to use, these animations use AnimatePresence which now can adjust transitions
specifically for enter/exit.

Our native our login screen is animated using a re-written Reanimated driver
that now has worklets support combined with a new avoidReRenders pipeline in
Tamagui 2 which completely avoids rendering for many internal style changes.

On top of that, we have a new @tamagui/native package that lets you optionally
plug in react-native-gesture-handler. When you do, even your Tamagui press
events move off-thread!

Next we can show a few things: first, the beautiful new Tamagui Menu composable
component, with support for nested menus. On native it uses the excellent Zeego,
on web it's first-class Tamagui so you can theme it, animate with motion, new
for v2 all popovers automate transform origin so your animation comes from where
it starts, and inside it uses safe polygons, has great keyboard controls and
accessibility, and smart positioning.

On the native side we can just take a quick peek some fun UI like this tab bar,
and the top navbar.

But of course the real interesting thing to see here of is Zero, our over-zero
library and setup, and the overall data system. Lets take a look at the post
model, models are a great entrypoint to Zero. In Takeout we've taken a bimodal
approach to structuring code outside of the routes.

In ./src directly we have high level things - anything that doesn't fit into a
feature, goes into here. Infrastructure, global utilities, etc.

Then all feature-level code goes in ./src/features. In ./src/data lives the data
schemas, queries, and mutations. We've tried to get this to be a nice mix of
idiomatic Zero, but with a bit more co-location and a bit less glue code
necessary.

You can see models here - let's open post. Models co-locate schema and
mutations. This video is already going to be far too long so I'm going to dive
deeply into Zero, or over-zero, but I think the strong part of Zero is how easy
this is to grok up front.

You can actually BYO permissions system, but we wanted a quick way to generate
secure CRUD mutations, so the `mutations` helper from over-zero does just that,
ensuring your permissions query is the default permission.

This lets us write things like this [FeedDetailPage:41]

Again, keep in mind this is a beta release so we haven't ported in any of our
nicer from validators, or error handling.

The main point here is to show queries and mutations.

Our query for comments is over here: commentsByPostId. Simple as can be. We
could structure this as a join, but since posts are fetched without comments for
the feed we've separated them. The nice thing about Zero is no matter if you use
a join or separate query, you don't have to think about or change your mutation:

if I press here - it just works, optimistic mutations come for free. It's the
key to building great feeling apps.

I'll just show this really quickly - the over-zero library and other libraries
we've made free are the result of using this stack for over a year building
multiple production apps in the app stores. It took us a really long time to get
these things working well! In part because Zero was in alpha and changing, but
also in part because deploying a sync engine takes time, gluing together a great
web experience and app experience that seamlessly transition also does, and we
wanted our data model to look great like this, not to mention a really nice
migration system, etc.

For example, over-zero generates a variety of files for you so you can just
avoid doing a lot of procedure gluing together files and types. This also helps
avoid circular dependencies, and server dependencies from finding their way into
your client, which we found to be a concern in early setups we had.

It even watches and auto-generates validations for you directly from your
TypeScript types in your queries!

Ok, so there's so much more to this repo. I'll just run through a few things
quickly.

We have nice settings screens that are responsive and fully shared, with light,
dark, and system themes.

We have a whole Bun scripting system through a new package "tko" that makes it
really easy for AI agents to list out every script + description of it in your
repo, including our built-in scripts.

That includes for example a nice env management system with scripts to
auto-generating new env variables in to the four places they are needed. It also
has scripts to push env to Github, pull env from SST if you use it, and so on.
Scripts are nicely grouped and you can automatically call them easily - it's
sort of like file-based scripts, akin to file-based routing.

Another worthy mention is the deployment system, we have an onboarding script
that guides you through setting up either Uncloud or AWS (wip) via SST. Both
give you great Infrastructure as Code, Uncloud is earlier but simpler and able
to self-host, it's extremely promising. While we've used SST for our two
production deploys, if you optimize it you can get it to about $200/mo for a
basic Aurora DB, load balanced and scalable system that feels fast.

And of course a bunch of AI agent harnesses. (show skills list). These have
taken a LOT of time to refine and ensure they pop up at the right time. We're
iterating on these constantly.
