import { ensure, randomId } from '@vxrn/helpers'
import { context } from 'over-zero'
import type { MessageUpdate } from '~/data/types'
import {
  getMessageInlineTaskDefinition,
  parseTaskSteps,
} from '~/features/message/taskParser'
import { TASK_REGEX } from '~/features/task/constants'

export async function runAppActionsFromMessage(message: MessageUpdate) {
  const { authData, server, tx } = context()
  ensure(authData, 'authData')

  const content = message.content

  if (!content) return

  // these failing shouldn't revert the mutation:

  try {
    // Whether the message contains app action shortcuts, such as `/github subscribe tamagui/tamagui`
    const isAction = content[0] === '/'
    const inlineTask = getMessageInlineTaskDefinition(content)
    if (!isAction && !inlineTask) return

    // TASKS

    const isTask = inlineTask || TASK_REGEX.test(content)

    if (isTask) {
      const taskContent = inlineTask || content
      const taskSteps = parseTaskSteps(taskContent)

      console.info(`Create task`, taskSteps)

      await tx.mutate.task.insert({
        id: randomId(),
        name: '',
        createdAt: Date.now(),
        creatorId: authData.id,
        serverId: message.serverId,
        messageId: message.id,
        steps: taskSteps,
        trigger: 'manual',
        channelId: message.channelId,
        threadId: message.threadId,
      })
      return
    }

    // ACTION

    const [slashApp, actionName, ...messageParts] = content.split(' ')

    console.info(`Run action`, message.serverId, slashApp)

    if (slashApp && actionName) {
      const appName = slashApp.slice(1)

      console.warn(
        `‼️ next zero query was wrapped in serverTransaction due to hang, unwrapped in migration, if hang happens here again`
      )
      const appInstalls = await await tx.query.appInstall
        .where('serverId', message.serverId)
        .related('app')
        .run()

      if (!appInstalls) {
        console.warn(`no app installs?`)
        return
      }

      console.info(` ...action`, appName, actionName, appInstalls.length)

      let success = false

      for (const install of appInstalls) {
        if (!install.app?.meta?.actions) continue
        for (const action of install.app.meta.actions) {
          if (!install.app.name) continue

          const matches =
            // TODO use id
            install.app.name.toLowerCase() === appName &&
            action.name.toLowerCase() === actionName

          if (!matches) continue

          console.warn(`🚨 runApp({ actionId })`)
          await server?.actions.app.runApp({
            insertResponseAsMessage: true,
            userId: authData.id,
            appId: install.app.id,
            serverId: message.serverId,
            messageOrder: message.order,
            messageId: message.id,
            action: {
              name: action.name,
              threadId: message.threadId || undefined,
              channelId: message.channelId,
              message: messageParts.join(' '),
            },
          })

          success = true
          break
        }
      }

      if (!success) {
        console.error(`Can't insert message??`)
        // TODO insert a hud reply saying action couldn't run
      }
    }
  } catch (err) {
    console.error(
      `[zero.mutate.message] error running action from message ${message.id}: ${err}`
    )
  }
}
