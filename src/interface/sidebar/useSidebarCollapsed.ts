import { useMedia } from 'tamagui'
// import { useCurrentThreadId } from '~/context/CurrentThreadContext'

export const useSidebarCollapsed = () => {
  // const isThreadOpen = !!useCurrentThreadId()
  const { maxMD } = useMedia()

  if (maxMD) {
    return true
  }

  // nice in theory but weird to have sidebar opening and closing as you move between rooms
  // if (isThreadOpen && maxLG) {
  //   return true
  // }

  return false
}
