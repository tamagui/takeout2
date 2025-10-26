// We need to make this into a module not only for easy re-use, but also
// to workaround the issue of imports being hoisted above other code, so
// something like this can work:
//
// ```
// import '~/native/install-react-native-quick-crypto'
// import * as utils from '@better-auth/utils' // A module that is using crypto from global scope
// ```
//
// While this cannot:
//
// ```
// import { install } from 'react-native-quick-crypto'
// if (typeof crypto === 'undefined') {
//  install()
// }
// import * as utils from '@better-auth/utils' // A module that is using crypto from global scope
// ```
//
// Since the above code will be transformed to something equivalent to:
//
// ```
// import { install } from 'react-native-quick-crypto'
// import * as utils from '@better-auth/utils' // A module that is using crypto from global scope
// if (typeof crypto === 'undefined') {
//  install()
// }
// ```

import { install } from 'react-native-quick-crypto'
if (typeof crypto === 'undefined') {
  install()
}
