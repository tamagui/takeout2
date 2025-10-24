import { useState, useEffect, useCallback } from 'react'
import { Button, Stack, Text, XStack, YStack, ScrollView } from 'tamagui'
import { sidecarManager } from './sidecarManager'
import { isTauri } from '@vxrn/helpers'

type LogEntry = {
  timestamp: Date
  type: 'sent' | 'received' | 'error'
  message: any
}

export function SidecarDebugPanel() {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [testInput, setTestInput] = useState('')

  const addLog = useCallback((type: LogEntry['type'], message: any) => {
    setLogs((prev) =>
      [
        ...prev,
        {
          timestamp: new Date(),
          type,
          message,
        },
      ].slice(-50)
    ) // Keep last 50 entries
  }, [])

  useEffect(() => {
    if (!isTauri) return

    setIsRunning(sidecarManager.isRunning())

    // Monitor all messages
    const unsubInit = sidecarManager.onMessage('init', (data) => {
      addLog('received', { type: 'init', data })
      setIsRunning(true)
    })

    const unsubHeartbeat = sidecarManager.onMessage('heartbeat', (data) => {
      addLog('received', { type: 'heartbeat', data })
    })

    const unsubShutdown = sidecarManager.onMessage('shutdown', (data) => {
      addLog('received', { type: 'shutdown', data })
      setIsRunning(false)
    })

    return () => {
      unsubInit()
      unsubHeartbeat()
      unsubShutdown()
    }
  }, [addLog])

  const sendEcho = async () => {
    try {
      const message = { echo: testInput || 'Test message', timestamp: Date.now() }
      addLog('sent', { type: 'echo', data: message })
      const response = await sidecarManager.sendRequest('echo', message)
      addLog('received', response)
    } catch (error) {
      addLog('error', error)
    }
  }

  const sendProcess = async () => {
    try {
      const message = {
        data: [1, 2, 3, 4, 5],
        operation: 'test',
      }
      addLog('sent', { type: 'process', data: message })
      const response = await sidecarManager.sendRequest('process', message)
      addLog('received', response)
    } catch (error) {
      addLog('error', error)
    }
  }

  const toggleSidecar = async () => {
    try {
      if (isRunning) {
        await sidecarManager.stop()
        setIsRunning(false)
      } else {
        await sidecarManager.start()
        setIsRunning(true)
      }
    } catch (error) {
      addLog('error', error)
    }
  }

  if (!isTauri) {
    return null
  }

  return (
    <YStack
      p="$4"
      gap="$4"
      bg="$background"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <XStack justify="space-between" items="center">
        <Text fontSize="$6" fontWeight="bold">
          Sidecar Debug Panel
        </Text>
        <Text color={isRunning ? '$green10' : '$red10'}>
          {isRunning ? '● Running' : '● Stopped'}
        </Text>
      </XStack>

      <XStack gap="$2">
        <Button size="$3" onPress={toggleSidecar}>
          {isRunning ? 'Stop' : 'Start'} Sidecar
        </Button>
        <Button size="$3" onPress={sendEcho} disabled={!isRunning}>
          Send Echo
        </Button>
        <Button size="$3" onPress={sendProcess} disabled={!isRunning}>
          Send Process
        </Button>
      </XStack>

      <ScrollView height={300} borderWidth={1} borderColor="$borderColor" rounded="$2">
        <YStack p="$2">
          {logs.map((log, index) => (
            <XStack key={index} gap="$2" p="$1">
              <Text fontSize="$1" color="$color9">
                {log.timestamp.toLocaleTimeString()}
              </Text>
              <Text
                fontSize="$1"
                color={
                  log.type === 'sent'
                    ? '$blue10'
                    : log.type === 'received'
                      ? '$green10'
                      : '$red10'
                }
              >
                [{log.type}]
              </Text>
              <Text fontSize="$1" flex={1}>
                {JSON.stringify(log.message, null, 2)}
              </Text>
            </XStack>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  )
}
