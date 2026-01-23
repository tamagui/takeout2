import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'

import type { Endpoint } from 'one'

// cache font data
let interTightData: ArrayBuffer | null = null
let jetBrainsMonoData: ArrayBuffer | null = null

async function getInterTight(): Promise<ArrayBuffer> {
  if (interTightData) return interTightData
  const response = await fetch(
    'https://fonts.gstatic.com/s/intertight/v9/NGSnv5HMAFg6IuGlBNMjxJEL2VmU3NS7Z2mj6AiqXA.ttf'
  )
  interTightData = await response.arrayBuffer()
  return interTightData
}

async function getJetBrainsMono(): Promise<ArrayBuffer> {
  if (jetBrainsMonoData) return jetBrainsMonoData
  const response = await fetch(
    'https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8L6tjPQ.ttf'
  )
  jetBrainsMonoData = await response.arrayBuffer()
  return jetBrainsMonoData
}

// cache logo data
let logoData: string | null = null

async function getLogo(): Promise<string> {
  if (logoData) return logoData

  const logoPath = join(process.cwd(), 'public', 'icon-takeout.png')
  const buffer = await readFile(logoPath)
  logoData = `data:image/png;base64,${buffer.toString('base64')}`
  return logoData
}

type OGParams = {
  title?: string
  type?: 'index' | 'blog'
}

function parseParams(url: URL): OGParams {
  return {
    title: url.searchParams.get('title') || undefined,
    type: (url.searchParams.get('type') as OGParams['type']) || 'index',
  }
}

export const GET: Endpoint = async (request) => {
  try {
    const url = new URL(request.url)
    const params = parseParams(url)
    const [interTight, jetBrainsMono, logo] = await Promise.all([
      getInterTight(),
      getJetBrainsMono(),
      getLogo(),
    ])

    const isIndex = params.type === 'index'
    const isBlog = params.type === 'blog'

    // colors based on type
    const bgColor = isIndex ? '#000' : '#fff'
    const textColor = isIndex ? '#fff' : '#000'

    const svg = await satori(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: bgColor,
          padding: 60,
        }}
      >
        {/* top right - TAKEOUT + icon */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 42,
              fontWeight: 700,
              color: textColor,
              letterSpacing: '-0.02em',
            }}
          >
            TAKEOUT
          </span>
          <img src={logo} width={56} height={56} />
        </div>

        {/* bottom left - tagline or title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          {isBlog && params.title ? (
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: textColor,
                lineHeight: 1.2,
                maxWidth: '90%',
              }}
            >
              {params.title}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: 56,
                fontWeight: 700,
                color: textColor,
                lineHeight: 1.3,
              }}
            >
              <span>The startup starter</span>
              <span>that actually gives</span>
              <span>you an edge.</span>
            </div>
          )}
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter Tight',
            data: interTight,
            weight: 700,
            style: 'normal',
          },
          {
            name: 'JetBrains Mono',
            data: jetBrainsMono,
            weight: 700,
            style: 'normal',
          },
        ],
      }
    )

    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: 1200,
      },
    })

    const pngData = resvg.render()
    const pngBuffer = pngData.asPng()

    return new Response(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('[og] error generating image:', error)
    return new Response('Error generating OG image', { status: 500 })
  }
}
