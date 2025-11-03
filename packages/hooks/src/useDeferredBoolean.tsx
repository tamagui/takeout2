import { useState, startTransition, useEffect } from 'react'

export const useDeferredBoolean = (inVal: boolean): boolean => {
  const [val, setVal] = useState(inVal)

  useEffect(() => {
    if (val !== inVal) {
      startTransition(() => {
        setVal(inVal)
      })
    }
  }, [inVal, val])

  return val
}
