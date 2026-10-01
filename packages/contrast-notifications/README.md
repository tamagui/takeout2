# contrast-notifications

Remote push registration and notification routing for Contrast apps. The native
entry uses `One.Notifications` from `one`. The web entry has the
same API and does no notification work, so browser previews continue to build.

The package never requests permission at import or provider mount. Call
`register()` from a user action when the app is ready to ask for notification
permission.

```tsx
import {
  NotificationsProvider,
  useDevicePushToken,
  useNotificationForegroundPolicy,
  usePushRegistration,
} from 'contrast-notifications'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <NotificationsProvider
      foregroundPolicy="inApp"
      register={async (token, { platform }) => {
        await api.devices.registerPushToken({ token, platform })
      }}
      onNotificationResponse={(result) => {
        if (result.status === 'ok') openNotification(result.notificationId)
      }}
    >
      {children}
    </NotificationsProvider>
  )
}

export function EnablePushButton() {
  const { register, status, error } = usePushRegistration()
  const token = useDevicePushToken()

  // call register() from the button's onPress handler.
  // status reports permission, registration, and failure states.
}
```

`register(token, meta)` is the only server boundary. The app supplies it and
decides which endpoint or mutation stores the token. The package does not assume
a Contrast Push endpoint.

## foreground policy

`foregroundPolicy` chooses the one presentation an event gets while the app is
in the foreground. The three values are mutually exclusive, so a user never sees
both an operating-system banner and a product toast for the same event.

| policy | operating system | product |
| --- | --- | --- |
| `system` (default) | banner, list entry, and sound | silent |
| `inApp` | suppressed | the app presents the event itself |
| `none` | suppressed | silent |

The provider installs the presentation policy, so the app's choice is the one
the operating system sees. `useNotificationForegroundPolicy()` reports the same
value to the product surface that decides whether to present the event itself,
and `presentsInAppNotification(policy)` is the pure form of that decision for
code outside React.

Under `inApp` and `none` the operating system shows nothing while the app is
active. The durable record of the event is the app's own inbox, not the
notification presentation, so the app must persist inbox events independently
of notification presentation.

## permission

`useNotificationPermission()` reports the operating system's notification
authorization and requests it. Authorization gates every operating-system
presentation, so an app that only schedules its own local notifications needs it
too and never has to call `register()`.

```tsx
const permission = useNotificationPermission()
// permission.status, permission.canAskAgain, permission.error
// await permission.request()
```

iOS grants more than one kind of authorization, and they are kept apart because
an app that treats them alike promises alerts it will not get to show:

| status | delivers | banner and sound |
| --- | --- | --- |
| `granted` | yes | yes |
| `provisional` | yes, quietly to the notification center | no |
| `ephemeral` | yes, until the session ends | yes |
| `undetermined` | no, not asked yet | no |
| `denied` | no | no |
| `unsupported` | no, the web build | no |

`notificationPermissionDelivers(status)` and
`notificationPermissionAlerts(status)` are the two questions product copy
actually asks. `readNotificationPermission(response)` is the pure mapper, so the
mapping is testable without a notification module present.

The platform's own summary is not enough on its own: it reports provisional and
ephemeral authorization as neither granted nor denied, so an app reading only
that summary shows "notifications are off" while notifications are arriving.

`canAskAgain` is false once the platform will not show its prompt again; send
the user to system settings instead of asking.

The provider refreshes authorization when the app returns to the foreground, so
a Settings change is reflected without restarting. A platform read or request
failure is exposed as `permission.error`; `request()` resolves to the last known
status instead of rejecting from an event handler.

## responses

`onNotificationResponse` receives one result per user interaction:

```ts
type NotificationResponseResult =
  | {
      status: 'ok'
      notificationId: string
      actionIdentifier: string
      data: Record<string, unknown>
    }
  | {
      status: 'invalid-payload'
      reason: 'missing-notification-id'
      actionIdentifier: string
      data: Record<string, unknown>
    }
```

`notificationId` is read from a `notificationId` string in the notification
payload, which the sending product assigns. The platform request identifier is
assigned by the operating system or the push service and is never used as the
product's identity, so a payload without an event id is reported as
`invalid-payload` instead of resolving to something arbitrary.

The app resolves `notificationId` against its own records and decides where to
navigate; this package never navigates and never reads a URL out of the payload.
The provider clears a saved cold-start response before handing it to the app, so
the platform does not select that response again. A later genuine tap on the
same event is delivered normally.

On native, the provider:

- applies the configured foreground presentation policy;
- reads the current authorization on mount, which never prompts;
- refreshes authorization after the app returns from system settings;
- prompts only from `permission.request()` or `register()`;
- reads the raw APNs or FCM token with `getDevicePushToken()`;
- re-runs the app's callback when the operating system refreshes the token;
- reports notification responses by event id, once each;
- removes token and notification-response listeners on unmount.

Apps using remote push must also declare
`contrast.capabilities.pushNotifications: true` in their own `package.json`.
This package has no native code or config plugin of its own: a native build
turns One's notifications module on with the `vxrn/expo-plugin` `notifications`
option, which the Contrast shell sets for every app and gives `push` to apps
that declare the capability.
