import { useEffect } from 'react'

import { initCreatePostWidget } from './widgets.native'

export function useWidgets() {
  useEffect(() => {
    initCreatePostWidget()
  }, [])
}
