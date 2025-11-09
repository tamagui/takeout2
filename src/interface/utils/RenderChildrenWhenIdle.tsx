import { useLazyMount } from '@take-out/helpers'

export const RenderChildrenWhenIdle = ({ children }: { children: any }) => {
  const mounted = useLazyMount({ fully: true })

  if (!mounted) {
    return null
  }

  return children
}
