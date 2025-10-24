import type { Endpoint } from 'one'
import { ensureAuth } from '~/auth/server/ensureAuth'
import { runTask } from '~/features/task/runTask'
import { assertString } from '@vxrn/helpers'

export const POST: Endpoint = async (req) => {
  // TODO validate permissions
  const { user } = await ensureAuth(req)
  const { searchParams } = new URL(req.url)

  const taskId = assertString(searchParams.get('taskId'), 'taskId')

  try {
    const result = await runTask({
      userId: user.id,
      taskId,
    })

    return Response.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Error executing task:', error)
    return Response.json(
      {
        error: true,
        message: `Error executing task: ${(error as any).message}`,
      },
      {
        status: 500,
      }
    )
  }
}
