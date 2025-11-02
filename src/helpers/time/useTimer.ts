import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

export const useTimer = () => {
  const [timerCount, setTimer] = useState<number>(30)
  const intervalRef = useRef<any>(null)

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
              clearInterval(intervalRef.current)
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
            clearInterval(intervalRef.current)
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
