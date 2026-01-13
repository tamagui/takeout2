import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

type UseTimerReturn = {
  count: number
  start: (time: number, start: boolean) => void
  pause: () => void
  resume: () => void
  clear: () => void
}

export const useTimer = (): UseTimerReturn => {
  const [timerCount, setTimer] = useState<number>(30)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const resetTimer = useCallback(
    (time: number, start: boolean) => {
      setTimer(time)
      clearTimer()
      if (start) {
        intervalRef.current = setInterval(() => {
          setTimer((lastTimerCount) => {
            if (lastTimerCount <= 1) {
              clearInterval(intervalRef.current!)
              intervalRef.current = null
              return 0
            }
            return lastTimerCount - 1
          })
        }, 1000)
      }
    },
    [clearTimer]
  )

  const pauseTimer = useCallback(() => {
    clearTimer()
  }, [clearTimer])

  const resumeTimer = useCallback(() => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setTimer((lastTimerCount) => {
          if (lastTimerCount <= 1) {
            clearInterval(intervalRef.current!)
            intervalRef.current = null
            return 0
          }
          return lastTimerCount - 1
        })
      }, 1000)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return useMemo(
    () => ({
      count: timerCount,
      start: resetTimer,
      pause: pauseTimer,
      resume: resumeTimer,
      clear: clearTimer,
    }),
    [timerCount, clearTimer, pauseTimer, resetTimer, resumeTimer]
  )
}
