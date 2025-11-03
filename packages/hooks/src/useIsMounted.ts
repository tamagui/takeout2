import { useEffect, useState } from 'react'

export const useIsMounted = () => {
  const [state, setState] = useState(false)

  useEffect(() => {
    setState(true)
  }, [])

  return state
}
