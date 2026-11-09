# Generated Apple SDK bindings

Use [Calling iOS APIs](https://onestack.dev/docs/guides-ios-apis) and the generated [iOS API reference](https://onestack.dev/ios-reference). These bindings are separate from the curated `One.iOS` SwiftUI components and services on `One`.

Import a framework's generated types and facades from `one/ios/<Framework>`, such as `one/ios/Contacts`. Check the generated declaration's TypeScript call shape, availability, and skipped-member reason. API name coverage does not imply every overload, generic specialization, or callback shape can cross the bridge. The app still needs usage descriptions, permissions, and entitlements.

Output parameters are omitted from arguments; the result contains `$ret` and `$out` for the return and named output values. Do not copy a Swift signature literally into TypeScript when the generated call shape differs.

`callSDKMethodAsync(object, methodName, ...args)` from `one/ios-runtime` awaits an instance method's blocking work. Synchronous methods without a main-actor requirement run on a background queue; main-actor and native async methods keep their declared rules. Methods requiring synchronous JavaScript callbacks are rejected before execution.

`useSDKProperty(object, property)` observes a supported KVO/Observable property; `useSDKSequence(handle)` follows an AsyncSequence or Combine publisher. Both come from `one/ios-runtime` and return `{ status, value, error }`. Create sequence handles in module scope or `useMemo`, not on every render. The hooks handle mounted subscription cleanup. KVO updates depend on the framework actually emitting them.

Native failures preserve `code: 'E_SDK'`, NSError `domain`, and numeric `nativeCode`; classify a failure from those fields rather than localized message text. For app-owned Swift/Kotlin modules use the [native source](https://onestack.dev/docs/native-source) workflow instead of inventing generated SDK entries.
