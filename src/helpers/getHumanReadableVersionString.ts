// TODO this shouldnt need expo-application, ideally we have a nicer setup
// in the repo and can set it via vite.config into env, 0-dep for web

import * as Application from 'expo-application'

export function getHumanReadableVersionString(): string {
  return `v${Application.nativeApplicationVersion}`
}
