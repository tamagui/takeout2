import { json, number, string, table } from '@rocicorp/zero'
import { ensure } from '@vxrn/helpers'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'
import type { TaskRunStatus, TaskRunStepsStatus } from 'start/types'

export type TaskRun = TableInsertRow<typeof schema>

export const schema = table('taskRun')
  .columns({
    id: string(),
    taskId: string(),
    creatorId: string(),
    logs: string().optional(),
    status: string<TaskRunStatus>(),
    stepsStatus: json<TaskRunStepsStatus>(),
    serverId: string(),
    output: string().optional(), // final output
    error: string().optional(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

export const permissions = where('taskRun', (_, auth) => {
  return {
    read: true, // anyone can read tasks for now
    write: _.cmp('creatorId', auth?.id || ''), // only creator can edit
  }
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, server, authData }, taskRun: TaskRun) => {
    await tx.mutate.taskRun.insert(taskRun)

    if (server) {
      const [task] = await Promise.all([
        tx.query.task
          .where('id', taskRun.taskId)
          .one(),
        // tx.query.server.where('id', taskRun.serverId).one(),
      ])
      // ensure(server?.serverBotId, 'server')
      ensure(task, 'task')
      ensure(authData, 'authData')

      // TODO runTask inserts a message after done
      // instead we should just insert this message, then run task, then update this message with that

      // if (task.threadId) {
      //   const channelId = task.channelId || `${task.serverId}-task`
      //   const threadId = task.threadId
      //   const lastMessage = await tx.query.message
      //     .where('channelId', channelId)
      //     .where('threadId', threadId ? '=' : 'IS', threadId || null)
      //     .where('type', '!=', 'draft')
      //     .orderBy('order', 'desc')
      //     .one()

      //   if (lastMessage) {
      //     await tx.mutate.message.insert({
      //       id: `${taskRun.id}-taskRun`,
      //       channelId,
      //       content: `Running task =>task-${taskRun.id}`,
      //       createdAt: taskRun.createdAt,
      //       creatorId: server.serverBotId,
      //       deleted: false,
      //       isThreadReply: true,
      //       serverId: task.serverId,
      //       order: createMessageOrder({ order: lastMessage.order }),
      //       type: 'bot',
      //       threadId,
      //     })
      //   }
      // }

      server.asyncTasks.push(async () => {
        await server.actions.task.runTask({
          taskId: taskRun.taskId,
          userId: authData.id,
          taskRunId: taskRun.id,
        })
      })
    }
  },
})
