import { useEmitterSelector } from '@vxrn/helpers'
import { useSearchableListContext } from './Context'

export const useSearchableListItem = (index: number) => {
  const context = useSearchableListContext()
  const active = useEmitterSelector(context.indexEmitter, (cur) => {
    return cur === context.getRealIndex(index)
  })

  const { key, ...rest } = context.getItemProps(index) || {}

  return {
    active,
    itemProps: {
      ...rest,
      'aria-selected': active,
    },
    key,
  }
}
