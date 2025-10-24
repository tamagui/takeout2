import { uniqBy } from '@vxrn/helpers'
import { useQuery, zero } from '~/zero/client'
import { useUserState } from './userState'
import { isWeb } from 'tamagui'
import { isTauri } from '@vxrn/helpers'

// Return 5 reactions for native, 3 for web
const LIMIT = isWeb || isTauri ? 3 : 5

export const useUserTopReactions = () => {
  const [defaultTopReactions] = useQuery(
    zero.query.reaction.where('category', 'face-emotion').limit(6)
  )

  const topReactions = useUserState('topReactions')
  const topReactionsArray = JSON.parse(JSON.stringify(topReactions || []))

  const [userTopReactions] = useQuery(
    zero.query.reaction.where('id', 'IN', topReactionsArray),
    Boolean(topReactions?.length)
  )

  const reactions = uniqBy([...userTopReactions, ...defaultTopReactions], (x) => x.id)

  const next = reactions
    .sort((a, b) => {
      const indexA = topReactionsArray.indexOf(a.id)
      const indexB = topReactionsArray.indexOf(b.id)
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }
      if (indexA !== -1) {
        return -1
      }
      if (indexB !== -1) {
        return 1
      }
      return 0
    })
    .slice(0, LIMIT)

  return next
}
