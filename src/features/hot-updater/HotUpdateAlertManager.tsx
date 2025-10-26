import { useHotUpdateAlert } from './useHotUpdateAlert'

/**
 * Component that manages hot update alerts
 * Simply include this component in your app to enable update notifications
 */
export function HotUpdateAlertManager() {
  useHotUpdateAlert()
  return null
}
