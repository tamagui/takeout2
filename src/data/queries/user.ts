import { where, zql } from 'over-zero'

const permission = where('userPublic', () => {
  return true
})

export const userById = (props: { userId: string }) => {
  return zql.userPublic.where(permission).where('id', props.userId).one()
}

export const userWithProfile = (props: { userId: string }) => {
  return zql.userPublic
    .where(permission)
    .where('id', props.userId)
    .one()
    .related('profile', (q) => q.where('id', props.userId).one())
}

export const userWithState = (props: { userId: string }) => {
  return zql.userPublic
    .where(permission)
    .where('id', props.userId)
    .one()
    .related('state', (q) => q.where('userId', props.userId).one())
}

export const userByUsername = (props: { username: string }) => {
  return zql.userPublic.where(permission).where('username', props.username).one()
}
