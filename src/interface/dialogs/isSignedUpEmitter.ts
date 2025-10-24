import { getUser } from '~/features/user/getUser'
import { createEmitter } from '@vxrn/helpers'
import { dialogEmit } from './shared'

export const isSignedUpEmitter = createEmitter<boolean>('isSignedUp', false)

export const dialogSignup = async () => {
  dialogEmit({
    type: 'signup',
  })
  return isSignedUpEmitter.nextValue()
}

export const ensureSignedUp = async () => {
  let user = getUser()
  if (user) {
    return user
  }
  await dialogSignup()
  user = getUser()
  if (!user) {
    throw new Error(`Didn't finish sign up`)
  }
  return user
}
