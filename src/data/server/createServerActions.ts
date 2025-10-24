import { dataActions } from '~/features/data/dataActions'
import { emailActions } from '~/features/email/emailActions'
import { notificationActions } from '~/features/push-notifications/notificationActions'
import { searchActions } from '~/features/search/searchActions'
import { threadActions } from '~/features/thread/threadActions'
import { aiActions } from './actions/aiActions'
import { appActions } from './actions/appActions'
import { dbActions } from './actions/dbActions'
import { messageReactionActions } from './actions/messageReactionActions'
import { realtimeActions } from './actions/realtimeActions'
import { serverActions } from './actions/serverActions'
import { taskActions } from './actions/taskActions'
import { userActions } from './actions/userActions'

export const createServerActions = () => {
  return {
    db: dbActions,
    search: searchActions,
    thread: threadActions,
    data: dataActions,
    task: taskActions,
    email: emailActions,
    notification: notificationActions,
    realtime: realtimeActions,
    ai: aiActions,
    user: userActions,
    app: appActions,
    messageReaction: messageReactionActions,
    server: serverActions,
  }
}

export type ServerActions = ReturnType<typeof createServerActions>
