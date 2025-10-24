import { useCurrentServerPage } from '~/context/CurrentServerPageContext'

export const useChannelMeta = () => {
  const serverPage = useCurrentServerPage()

  return {
    bannerHeight: serverPage ? -50 : 0,
  }
}
