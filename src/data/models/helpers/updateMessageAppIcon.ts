import { context } from 'over-zero'
import type { MessageUpdate } from '~/data/types'

export async function updateMessageAppIcon(message: MessageUpdate) {
  const { tx, server } = context()

  if (!server) {
    return
  }

  try {
    // check if app exists for this message
    const app = await tx.query.app.where('id', message.id).one()

    if (!app) {
      return
    }

    // skip if icon already exists
    if (app.image) {
      return
    }

    // skip if no content to generate from
    if (!message.content) {
      return
    }

    console.info('generating app icon for', message.id)

    // generate SVG icon using LLM
    const svgPrompt = `Generate a simple, clean SVG icon for an app based on this description:
${message.content}

Requirements:
- Return ONLY the SVG code, no markdown or explanation
- Use simple shapes and paths
- Size should be 24x24 with viewBox="0 0 24 24"
- Use currentColor for fill/stroke so it adapts to theme
- Keep it minimalistic and professional`

    const svgResponse = await server.actions.ai.llm({
      prompt: svgPrompt,
      maxOutputTokens: 1000,
    })

    if (!svgResponse) {
      console.warn('no svg content generated for app', message.id)
      return
    }

    // extract svg from response (in case it includes markdown or other text)
    let svgContent = svgResponse
    const svgMatch = svgContent.match(/<svg[^>]*>[\s\S]*?<\/svg>/i)
    if (svgMatch) {
      svgContent = svgMatch[0]
    }

    // validate it's actually SVG
    if (svgContent.includes('<svg') && svgContent.includes('</svg>')) {
      // update app with generated icon
      await tx.mutate.app.update({
        id: message.id,
        image: `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`,
      })

      console.info('successfully generated icon for app', message.id)
    } else {
      console.warn('invalid svg content for app', message.id)
    }
  } catch (err) {
    console.error(
      `[zero.mutate.message] error generating app icon for message ${message.id}: ${err}`
    )
  }
}
