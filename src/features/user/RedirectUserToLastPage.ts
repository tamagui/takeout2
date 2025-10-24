import { ensure, useAsyncEffect } from '@vxrn/helpers'
import { redirect, usePathname } from 'one'
import { updateUserState, useUserState } from './userState'
import { useUser } from './useUser'

let hasSavedLastPage = false

export const getHasSavedLastPage = () => hasSavedLastPage

export const useSaveUserLastPage = () => {
  const pathname = usePathname()
  const { user } = useUser()
  const hasUser = !!user // dont use logged-in state we need to ensure user is synced down to updateUserState

  useAsyncEffect(() => {
    ensure(hasUser)
    ensure(pathname !== '/')
    // all our non-chat pages go here;
    ensure(!pathname.startsWith('/_/'))
    // this happens due to one router bug, loading /tamagui/app/data
    // it does a weird intermediate redirect to /?serverId=tamagui which shows pathname as /tamagui/undefined
    ensure(!pathname.endsWith('/undefined'))
    hasSavedLastPage = true
    updateUserState({
      lastPathname: pathname,
    })
  }, [hasUser])
}

const initialPathname = typeof window !== 'undefined' ? window.location?.pathname : '/'

export const RedirectToLastPage = () => {
  const lastPathname = useUserState('lastPathname')

  useAsyncEffect(() => {
    ensure(lastPathname, 'lastPathname')
    ensure(lastPathname !== '/', 'not home')
    ensure(!lastPathname.startsWith('/_/'), 'non-chat-page')
    ensure(initialPathname === '/', 'is home')
    const hasSavedAlready = getHasSavedLastPage()
    ensure(!hasSavedAlready, 'hasSavedAlready')
    redirect(lastPathname)
  }, [])

  return null
}
