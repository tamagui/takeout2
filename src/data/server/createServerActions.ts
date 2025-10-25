import { analyticsActions } from './actions/analyticsActions'
import { userActions } from './actions/userActions'

export const createServerActions = () => {
  return {
    analyticsActions,
    userActions,
  }
}

export type ServerActions = ReturnType<typeof createServerActions>
