import * as Application from 'expo-application'

export function getHumanReadableVersionString(): string {
  return `v${Application.nativeApplicationVersion}`
}
