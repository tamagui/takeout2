import { json, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow, Transaction } from 'over-zero'
import { mutations, where } from 'over-zero'
import type { TaskSchedule, TaskSteps, TaskTrigger } from 'start/types'
import { createMessageOrder } from '~/features/message/createMessageOrder'

export type Task = TableInsertRow<typeof schema>

export const schema = table('task')
  .columns({
    id: string(),
    appInstallId: string().optional(),
    channelId: string().optional(),
    creatorId: string(),
    description: string().optional(),
    messageId: string().optional(),
    name: string(),
    schedule: json<TaskSchedule>().optional(),
    serverId: string(),
    steps: json<TaskSteps>(),
    numSteps: number().optional(),
    threadId: string().optional(),
    trigger: string<TaskTrigger>(),
    triggerEvent: string().optional(),
    triggerEventAppId: string().optional(),
    version: number().optional(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

export const permissions = where('task', (_, auth) => {
  return {
    read: true, // anyone can read tasks for now
    write: _.cmp('creatorId', auth?.id || ''), // only creator can edit
  }
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, server }, task: Task) => {
    let taskToInsert = { ...task }

    taskToInsert.threadId = await insertTaskThread(tx, task)

    if (server) {
      if (!task.name && task.steps.length) {
        // generate a name automatically
        const name = await server.actions.ai.llm({
          prompt: `Generate a name, <4 words, <20 characters.

It's for a workflow we are defining that processes data between apps. Here's the steps of the workflow:

${task.steps.map((step) => `/${step.app} ${step.action} ${step.message}`)}
`,
          model: 'gemini-2.5-flash',
        })

        if (name) {
          taskToInsert.name = name
        }
      }
    }

    await tx.mutate.task.insert(taskToInsert)
  },
})

export async function insertTaskThread(tx: Transaction, task: Task) {
  if (task.threadId) return task.threadId

  // ensure we always have a thread for every task to show in tasks channel
  const channelId = `${task.serverId}-tasks`
  const messageId = `${task.id}-task`
  const threadId = `${task.id}-task`

  await tx.mutate.message.upsert({
    id: messageId,
    channelId,
    serverId: task.serverId,
    content: '',
    createdAt: task.createdAt,
    creatorId: task.creatorId,
    deleted: false,
    isThreadReply: false,
    order: createMessageOrder(),
    type: 'hidden',
  })

  await tx.mutate.thread.upsert({
    id: threadId,
    createdAt: task.createdAt,
    creatorId: task.creatorId,
    deleted: false,
    messageId,
    channelId,
    replyCount: 0,
    serverId: task.serverId,
    title: task.name || 'Task',
  })

  return threadId
}
