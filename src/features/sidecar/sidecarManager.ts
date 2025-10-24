import { Command, type Child } from '@tauri-apps/plugin-shell'
import { isTauri } from '@vxrn/helpers'

type MessageHandler = (data: any) => void
type SidecarMessage = {
  id: string
  type: string
  data?: any
}

export class SidecarManager {
  private static instance: SidecarManager | null = null
  private child: Child | null = null
  private messageHandlers: Map<string, MessageHandler> = new Map()
  private responseHandlers: Map<string, (data: any) => void> = new Map()
  messageId = 0

  private constructor() {}

  static getInstance(): SidecarManager {
    if (!SidecarManager.instance) {
      SidecarManager.instance = new SidecarManager()
    }
    return SidecarManager.instance
  }

  async start() {
    if (!isTauri || this.child) {
      return
    }

    const command = Command.sidecar('binaries/sidecar')

    command.on('close', (data) => {
      console.info(`Sidecar closed with code ${data.code}`)
      this.child = null
    })

    command.on('error', (error) => {
      console.error(`Sidecar error: ${error}`)
    })

    command.stdout.on('data', (line) => {
      try {
        const message = JSON.parse(line) as SidecarMessage

        if (message.id && this.responseHandlers.has(message.id)) {
          const handler = this.responseHandlers.get(message.id)!
          handler(message.data)
          this.responseHandlers.delete(message.id)
          return
        }

        const handler = this.messageHandlers.get(message.type)
        if (handler) {
          handler(message)
        }
      } catch (e) {
        console.warn('Failed to parse sidecar message:', line)
      }
    })

    command.stderr.on('data', (line) => {
      if (line.includes('failed to parse')) {
        console.warn(`Sidecar stderr: ${line}`)
      }
    })

    try {
      this.child = await command.spawn()
      console.info('Sidecar started with PID:', this.child.pid)
    } catch (err) {
      console.error('Failed to spawn sidecar:', err)
      throw err
    }
  }

  async stop() {
    if (this.child) {
      await this.child.kill()
      this.child = null
    }
  }

  onMessage(type: string, handler: MessageHandler) {
    this.messageHandlers.set(type, handler)
    return () => {
      this.messageHandlers.delete(type)
    }
  }

  async sendMessage(type: string, data: any): Promise<void> {
    if (!this.child) {
      throw new Error('Sidecar not started')
    }

    const message: SidecarMessage = {
      id: String(this.messageId++),
      type,
      data,
    }

    const messageStr = JSON.stringify(message) + '\n'
    await this.child.write(new TextEncoder().encode(messageStr))
  }

  async sendRequest<T = any>(type: string, data: any): Promise<T> {
    if (!this.child) {
      throw new Error('Sidecar not started')
    }

    return new Promise((resolve, reject) => {
      const id = String(this.messageId++)
      const timeout = setTimeout(() => {
        this.responseHandlers.delete(id)
        reject(new Error('Sidecar request timeout'))
      }, 10000)

      this.responseHandlers.set(id, (responseData) => {
        clearTimeout(timeout)
        resolve(responseData)
      })

      const message: SidecarMessage = {
        id,
        type,
        data,
      }

      const messageStr = JSON.stringify(message) + '\n'
      this.child!.write(new TextEncoder().encode(messageStr)).catch((err) => {
        clearTimeout(timeout)
        this.responseHandlers.delete(id)
        reject(err)
      })
    })
  }

  isRunning(): boolean {
    return this.child !== null
  }
}

export const sidecarManager = SidecarManager.getInstance()
