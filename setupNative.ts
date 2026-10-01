import 'contrast-native'
import '~/features/storage/setupStorage'
import '~/features/feedback/setupFeedback'
import { withFeedback } from 'contrast-native/feedback/overlay'
import { AppRegistry } from 'react-native'

// the feedback overlay draws above every screen, so it mounts at the one point
// above one's root. an app that already registers a wrapper passes it to
// the feedback wrapper rather than replacing this call.
AppRegistry.setWrapperComponentProvider(() => withFeedback())
