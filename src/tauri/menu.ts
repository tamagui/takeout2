import { isTauri } from '@tamatko/helpers'

let listenersSetup = false

export async function setupTauriMenuListeners() {
  if (!isTauri) return
  if (listenersSetup) return
  listenersSetup = true

  const { listen } = await import('@tauri-apps/api/event')

  try {
    // listen for menu events from rust
    await listen('menu-settings', () => {
      console.info(`Insert menu settings action here!`)
      // router.navigate or similar
    })

    // add more menu event listeners here as needed
    // for example:
    // await listen('menu-new-chat', () => { ... })
    // await listen('menu-export', () => { ... })
  } catch (error) {
    console.error('Error setting up menu listeners:', error)
    listenersSetup = false
  }
}
