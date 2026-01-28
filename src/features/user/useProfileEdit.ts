import { useState } from 'react'
import { useDebounceValue } from 'tamagui'

import { userByUsername } from '~/data/queries/user'
import { useUser } from '~/features/user/useUser'
import { showToast } from '~/interface/toast/helpers'
import { useQuery } from '~/zero/client'

function checkUsernameValid(username: string) {
  if (username.length < 3) return false
  if (!username.match(/^[a-z][a-z0-9_]+$/)) return false
  return true
}

export const useProfileEdit = () => {
  const { user, update } = useUser()
  const [isSaving, setIsSaving] = useState(false)
  const [username, setUsername] = useState(user?.username || '')
  const [name, setName] = useState(user?.name || '')
  const [isTouched, setIsTouched] = useState(false)
  const [isUsernameBlocked, setIsUsernameBlocked] = useState(false)

  const lowernameUsername = username.trim().toLowerCase()
  const debouncedUsername = useDebounceValue(lowernameUsername, 500)
  const isUsernameValid = checkUsernameValid(debouncedUsername)
  const isUsernameInvalid = (debouncedUsername && !isUsernameValid) || isUsernameBlocked

  const [existingUser, availabilityStatus] = useQuery(
    userByUsername,
    { username: debouncedUsername },
    {
      enabled: isUsernameValid && debouncedUsername !== user?.username,
    }
  )

  const trimmedUsername = username.trim().toLowerCase()
  const isCheckingAvailability =
    (isUsernameValid && trimmedUsername !== debouncedUsername) ||
    (isUsernameValid &&
      debouncedUsername !== user?.username &&
      availabilityStatus.type !== 'complete')

  const isAvailable =
    debouncedUsername === user?.username ||
    (isUsernameValid && availabilityStatus.type === 'complete' && !existingUser)

  const isUnavailable =
    isUsernameValid &&
    debouncedUsername !== user?.username &&
    availabilityStatus.type === 'complete' &&
    !!existingUser

  const hasUnsavedChanges =
    isTouched && (trimmedUsername !== user?.username || name.trim() !== user?.name)

  const canSave =
    isUsernameValid && !isCheckingAvailability && !isUnavailable && hasUnsavedChanges

  const handleAvatarUpload = async (url: string) => {
    if (!user?.id) return
    try {
      await update({ image: url }).server
      showToast('Avatar updated', { type: 'success' })
    } catch (err) {
      showToast('Failed to update avatar', { type: 'error' })
    }
  }

  const handleSave = async () => {
    if (isSaving || !canSave) return

    setIsSaving(true)

    try {
      await update({
        username: username.trim(),
        name: name.trim(),
      }).server

      setIsTouched(false)
      showToast('Profile updated', { type: 'success' })
      return true
    } catch (err: any) {
      if (err.details === 'Blocked username') {
        setIsUsernameBlocked(true)
      } else {
        showToast('Failed to update profile', { type: 'error' })
      }
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleNameChange = (text: string) => {
    if (text.length <= 40) {
      setName(text)
      setIsTouched(true)
    }
  }

  const handleUsernameChange = (text: string) => {
    if (text.length <= 30) {
      setUsername(text)
      setIsTouched(true)
      if (isUsernameBlocked) {
        setIsUsernameBlocked(false)
      }
    }
  }

  return {
    user,
    username,
    name,
    isSaving,
    isCheckingAvailability,
    isAvailable,
    isUnavailable,
    isUsernameInvalid,
    hasUnsavedChanges,
    canSave,
    debouncedUsername,
    handleAvatarUpload,
    handleSave,
    handleNameChange,
    handleUsernameChange,
  }
}
