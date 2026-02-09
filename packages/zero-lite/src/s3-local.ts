/**
 * minimal local s3-compatible server.
 * handles GET/PUT/DELETE/HEAD for object storage, replacing minio.
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, statSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import type { ZeroLiteConfig } from './config'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.txt': 'text/plain',
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': 'ETag, Content-Length',
  }
}

export function startS3Server(config: ZeroLiteConfig): Promise<Server> {
  const storageDir = join(config.dataDir, 's3')
  mkdirSync(storageDir, { recursive: true })

  // pre-create the chat bucket
  mkdirSync(join(storageDir, 'chat'), { recursive: true })

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const headers = corsHeaders()

    if (req.method === 'OPTIONS') {
      res.writeHead(200, headers)
      res.end()
      return
    }

    const url = new URL(req.url || '/', `http://localhost:${config.s3Port}`)
    const filePath = join(storageDir, url.pathname)

    try {
      switch (req.method) {
        case 'GET': {
          if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
            res.writeHead(404, { ...headers, 'Content-Type': 'application/xml' })
            res.end('<Error><Code>NoSuchKey</Code></Error>')
            return
          }
          const data = readFileSync(filePath)
          const ext = extname(filePath)
          const contentType = MIME_TYPES[ext] || 'application/octet-stream'
          res.writeHead(200, {
            ...headers,
            'Content-Type': contentType,
            'Content-Length': data.length.toString(),
            ETag: `"${Buffer.from(data).length}"`,
          })
          res.end(data)
          break
        }

        case 'PUT': {
          const chunks: Buffer[] = []
          req.on('data', (chunk: Buffer) => chunks.push(chunk))
          req.on('end', () => {
            mkdirSync(dirname(filePath), { recursive: true })
            const body = Buffer.concat(chunks)
            writeFileSync(filePath, body)
            res.writeHead(200, {
              ...headers,
              ETag: `"${body.length}"`,
            })
            res.end()
          })
          break
        }

        case 'DELETE': {
          if (existsSync(filePath)) {
            unlinkSync(filePath)
          }
          res.writeHead(204, headers)
          res.end()
          break
        }

        case 'HEAD': {
          if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
            res.writeHead(404, headers)
            res.end()
            return
          }
          const stat = statSync(filePath)
          const ext = extname(filePath)
          res.writeHead(200, {
            ...headers,
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Content-Length': stat.size.toString(),
          })
          res.end()
          break
        }

        default:
          res.writeHead(405, headers)
          res.end()
      }
    } catch (err) {
      res.writeHead(500, { ...headers, 'Content-Type': 'application/xml' })
      res.end('<Error><Code>InternalError</Code></Error>')
    }
  })

  return new Promise((resolve, reject) => {
    server.listen(config.s3Port, '127.0.0.1', () => {
      console.info(`[zero-lite] local s3 listening on port ${config.s3Port}`)
      resolve(server)
    })
    server.on('error', reject)
  })
}
