process.stdin.setEncoding('utf8')

let buffer = ''
process.stdin.on('data', (chunk) => {
  buffer += chunk
  const lines = buffer.split('\n')
  buffer = lines.pop() || ''

  for (const line of lines) {
    if (line.trim()) {
      try {
        const message = JSON.parse(line)
        handleMessage(message)
      } catch (e) {
        console.error(`[sidecar] failed to parse:`, line, e)
      }
    }
  }
})

function handleMessage(message: any) {
  const { id, type, data } = message

  switch (type) {
    case 'echo':
      sendResponse(id, {
        original: data,
        echoed: `Echo: ${JSON.stringify(data)}`,
        timestamp: Date.now(),
      })
      break

    case 'process': {
      const result = processData(data)
      sendResponse(id, result)
      break
    }

    default:
      if (id) {
        sendResponse(id, { error: `Unknown message type: ${type}` })
      }
  }
}

function processData(data: any) {
  return {
    processed: true,
    inputLength: JSON.stringify(data).length,
    processedAt: new Date().toISOString(),
  }
}

function sendMessage(type: string, data?: any) {
  const message = { type, data }
  process.stdout.write(JSON.stringify(message) + '\n')
}

function sendResponse(id: string, data: any) {
  const message = { id, type: 'response', data }
  process.stdout.write(JSON.stringify(message) + '\n')
}

sendMessage('init', {
  pid: process.pid,
  nodeVersion: process.version,
  startTime: new Date().toISOString(),
})

setInterval(() => {
  sendMessage('heartbeat', {
    timestamp: Date.now(),
    memory: process.memoryUsage(),
  })
}, 30000)

process.on('SIGTERM', () => {
  sendMessage('shutdown', { reason: 'SIGTERM' })
  process.exit(0)
})

process.on('SIGINT', () => {
  sendMessage('shutdown', { reason: 'SIGINT' })
  process.exit(0)
})
