import { Slot } from 'one'

export function SiteLayout() {
  // NOTE: do not use redirect here for native because (app) is not in the same layout
  return <Slot />
}
