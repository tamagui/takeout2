import { context } from 'over-zero'
import type { App, MessageUpdate } from '~/data/types'
import { insertAppThread, type AppUpdate } from '../app'

const appSourceStart = `\`\`\`tsx app`
const appSourceEnd = `\`\`\``

const complicationSourceStart = `\`\`\`tsx complication`
const complicationSourceEnd = `\`\`\``

export async function updateMessageApp(message: MessageUpdate) {
  const { tx, server } = context()

  if (!server) {
    return
  }

  const hasAppCodeBlock = message.content?.includes(appSourceStart)

  console.info('hasAppCodeBlock?', hasAppCodeBlock)

  if (!hasAppCodeBlock) {
    return
  }

  try {
    const startIndex = message.content.indexOf(appSourceStart)
    if (startIndex < 0) {
      console.error(`Error finding app source`)
      return
    }

    const appSource = getCodeInsideBlock(message.content, appSourceStart, appSourceEnd)

    const complicationSource = getCodeInsideBlock(
      message.content,
      complicationSourceStart,
      complicationSourceEnd
    )

    if (!appSource && !complicationSource) {
      return
    }

    const appUpdate = {
      id: message.id,
      type: 'generated',
      creatorId: message.creatorId,
      serverId: message.serverId,
      source: appSource,
      ...(complicationSource && {
        complicationSource: complicationSource,
      }),
      meta: {
        hasFrontend: true,
      },
    } satisfies AppUpdate

    const existing = await tx.query.app.where('id', appUpdate.id).one().run()

    console.info('updating message app', {
      existing: !!existing,
      appSource,
      complicationSource,
      messageId: message.id,
      creatorId: message.creatorId,
      threadId: message.threadId,
    })

    if (!existing) {
      const app: App = {
        ...appUpdate,
        createdAt: message.createdAt,
      }

      // TODO this is awkward - tx.insert inside another mutator doesnt call that mutators custom insert
      // we need to figure out a better setup - some options:
      //   - we *do* run our own mutators always even in other mutators
      //   - we move away from CRUD external mutators entirely in some form
      //   - we have a way to "insert with custom mutator" optionally
      const threadId = message.threadId?.endsWith('-app')
        ? message.threadId
        : await insertAppThread(tx, app)

      await tx.mutate.app.insert({
        ...app,
        threadId,
      })

      await tx.mutate.appInstall.insert({
        id: message.id,
        appId: message.id,
        createdAt: message.createdAt,
        creatorId: message.creatorId,
        serverId: message.serverId,
        channelId: message.channelId,
        messageId: message.id,
        threadId,
      })
    } else {
      await tx.mutate.app.update(appUpdate)
    }
  } catch (err) {
    console.error(
      `[zero.mutate.message] error updating app for message ${message.id}: ${err}`
    )
  }
}

function getCodeInsideBlock(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start)
  if (startIndex < 0) {
    return ''
  }

  let code = source.slice(startIndex + start.length)

  const endIndex = code.indexOf(end)
  if (endIndex <= 0) {
    console.warn(`App source unfinished`)
    return ''
  }

  code = code.slice(0, endIndex).trim()

  return code
}
