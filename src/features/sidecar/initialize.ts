import { sidecarManager } from './sidecarManager'

export async function initializeSidecar() {
  try {
    sidecarManager.onMessage('init', (data) => {
      console.info('Sidecar initialized')
    })

    sidecarManager.onMessage('heartbeat', (data) => {
      // silent heartbeat
    })

    sidecarManager.onMessage('shutdown', (data) => {
      console.info('Sidecar shutting down:', data)
    })

    await sidecarManager.start()
  } catch (error) {
    console.error('Failed to initialize sidecar:', error)
  }
}

export { sidecarManager }
