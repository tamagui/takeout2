import { ensure, useAsyncEffect } from '@vxrn/helpers'
import { redirect, usePathname } from 'one'
import { useAuth } from '~/auth/client/authClient'
import { useAppInitContext } from '~/context/AppInitContext'
import { updateUserState, useUserState } from './userState'

let hasSavedLastPage = false
let hasAttemptedRedirect = false

export const getHasSavedLastPage = () => hasSavedLastPage

export const useSaveUserLastPage = () => {
  const pathname = usePathname()
  const { state } = useAuth()

  useAsyncEffect(() => {
    ensure(state === 'logged-in')
    ensure(pathname !== '/')
    hasSavedLastPage = true
    updateUserState({
      lastPathname: pathname,
    })
  }, [pathname])
}

export const RedirectToLastPage = () => {
  const { state } = useAuth()
  const lastPathname = useUserState('lastPathname')
  const { setNavigationReady } = useAppInitContext()

  // handle redirect to last page (but not auth - that's handled by initial route)
  useAsyncEffect(() => {
    try {
      // only run on first app open
      ensure(!hasAttemptedRedirect, 'already attempted redirect this app session')
      hasAttemptedRedirect = true
      console.info('RedirectToLastPage', {
        state,
        lastPathname,
        hasAttemptedRedirect,
      })

      ensure(state !== 'loading', 'auth still loading')
      ensure(state === 'logged-in', 'not logged in')

      // ensure we have a valid last pathname for redirect
      ensure(lastPathname, 'no lastPathname')
      ensure(lastPathname !== '/', 'lastPathname is home')

      const hasSavedAlready = getHasSavedLastPage()
      ensure(!hasSavedAlready, 'already saved this session')

      // redirect to last page
      redirect(lastPathname)
      setNavigationReady(true)
    } catch {
      // if any ensure fails or no redirect needed, mark as complete
      setNavigationReady(true)
    }
  }, [state])

  return null
}
