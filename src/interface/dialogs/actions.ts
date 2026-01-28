import { AbortError, createEmitter, isAppError, isEqualNever } from '@take-out/helpers'

import { dialogEmit } from './shared'

import type { DialogConfirmType, DialogErrorType } from './types'

export const confirmEmitter = createEmitter<boolean>('confirm', false, {
  comparator: isEqualNever,
})

export type DialogConfirmProps = Partial<Omit<DialogConfirmType, 'type'>>

export const dialogConfirm = async (props: DialogConfirmProps) => {
  dialogEmit({
    type: 'confirm',
    title: `Are you sure?`,
    description: '',
    ...props,
  })
  return confirmEmitter.nextValue()
}

export const ensureConfirmed = async (props: DialogConfirmProps = {}) => {
  const confirmed = await dialogConfirm(props)
  if (!confirmed) {
    throw new AbortError()
  }
}

// Error dialog actions
export type DialogErrorProps = Partial<Omit<DialogErrorType, 'type'>>

export const dialogError = (props: DialogErrorProps) => {
  dialogEmit({
    type: 'error',
    title: 'Error',
    description: 'An error occurred',
    ...props,
  })
}

export const showError = (error: unknown, title?: string) => {
  let description = 'An unexpected error occurred'

  if (error instanceof Error) {
    description = error.message
  } else if (typeof error === 'string') {
    description = error
  } else if (error && typeof error === 'object' && 'message' in error) {
    description = String(error.message)
  }

  // derive title from error code if not provided
  let finalTitle = title || 'Error'
  if (!title && isAppError(error)) {
    switch (error.code) {
      case 'PROFANITY_DETECTED':
      case 'CONTENT_POLICY_VIOLATION':
        finalTitle = 'Content Not Allowed'
        break
      case 'NOT_AUTHENTICATED':
        finalTitle = 'Please Sign In'
        break
      case 'NOT_AUTHORIZED':
        finalTitle = 'Not Authorized'
        break
      case 'RATE_LIMITED':
        finalTitle = 'Too Many Requests'
        break
      case 'NOT_FOUND':
        finalTitle = 'Not Found'
        break
    }
  }

  dialogError({
    title: finalTitle,
    description,
  })
}

export const showCreatePostDialog = () => {
  dialogEmit({ type: 'create-post' })
}
