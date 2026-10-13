import 'takeout-native'
import '~/features/storage/setupStorage'
import '~/features/feedback/setupFeedback'
import * as nativeRegistry from '@tamagui/native-registry'
import { withFeedback } from 'takeout-native/feedback/overlay'
import { AppRegistry } from 'react-native'
import { setNativeStyleEngine } from 'tamagui'

// tamagui's native fast path: compiled views (experimental.nativeFastPath in
// tamagui.build.ts) take theme changes through one native commit instead of a
// react re-render. a binary built without the module keeps the react path.
if (nativeRegistry.isAvailable()) {
  setNativeStyleEngine(nativeRegistry)
}

// the feedback overlay draws above every screen, so it mounts at the one point
// above one's root. an app that already registers a wrapper passes it to
// the feedback wrapper rather than replacing this call.
AppRegistry.setWrapperComponentProvider(() => withFeedback())
