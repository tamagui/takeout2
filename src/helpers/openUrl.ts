import { isTauri } from '@tamatko/helpers'

/**
 * Opens a URL in the default browser
 * - In Tauri: Uses shell API to open in system's default browser
 * - In browser: Uses window.open with target
 * @param url The URL to open
 * @param target The target (only used in browser environment)
 */
export async function openUrl(url: string, target: '_blank' | '_self' = '_blank') {
  if (isTauri) {
    // In Tauri, use the shell API to open in default browser
    try {
      const { open } = await import('@tauri-apps/plugin-shell')
      await open(url)
    } catch (error) {
      console.error('Failed to open URL in Tauri:', error)
    }
  } else {
    // In browser, use standard window.open
    window.open(url, target)
  }
}
