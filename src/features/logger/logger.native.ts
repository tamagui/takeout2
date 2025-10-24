import { analytics } from '../analytics/analytics.native'
import { handleError } from '../errors/handleError'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: number
}

class Logger {
  private isInitialized = false

  initialize() {
    this.isInitialized = true
  }

  private log(level: LogLevel, message: string, ...data: any[]) {
    const entry: LogEntry = {
      level,
      message,
      data: data.length > 0 ? data : undefined,
      timestamp: Date.now(),
    }

    if (!this.isInitialized) {
      return
    }

    switch (level) {
      case 'info':
        analytics.track('log_info', {
          message,
          data: entry.data,
          timestamp: entry.timestamp,
          platform: 'react-native',
        })
        break

      case 'warn':
        analytics.track('log_warn', {
          message,
          data: entry.data,
          timestamp: entry.timestamp,
          platform: 'react-native',
        })
        break

      case 'error': {
        const error = data.find((d) => d instanceof Error) || new Error(message)
        handleError(
          error,
          {
            timestamp: entry.timestamp,
            additional: {
              originalData: entry.data,
              logLevel: level,
              platform: 'react-native',
            },
          },
          'medium'
        )
        break
      }
    }
  }

  debug(message: string, ...data: any[]) {
    this.log('debug', message, ...data)
  }

  info(message: string, ...data: any[]) {
    this.log('info', message, ...data)
  }

  warn(message: string, ...data: any[]) {
    this.log('warn', message, ...data)
  }

  error(message: string, ...data: any[]) {
    this.log('error', message, ...data)
  }
}

export const logger = new Logger()

export const initializeLogger = () => {
  logger.initialize()
}
