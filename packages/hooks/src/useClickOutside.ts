import { useEffect } from 'react'
import { isWeb, type TamaguiElement } from 'tamagui'

type UseClickOutsideProps = {
  ref: React.RefObject<TamaguiElement | null>
  active: boolean
  onClickOutside?: () => void
}

export const useClickOutside = ({
  ref,
  active,
  onClickOutside,
}: UseClickOutsideProps) => {
  useEffect(() => {
    if (!isWeb) return
    if (!active) return
    if (!onClickOutside) return

    const handleClickOutside = (e: MouseEvent) => {
      const node = ref.current as HTMLElement
      if (!node) return
      if (!(e.target instanceof HTMLElement)) return
      if (!node.contains(e.target)) {
        onClickOutside()
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [ref, active, onClickOutside])
}
