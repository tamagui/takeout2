import { useState, useEffect, useRef } from 'react'

export const useTimer = () => {
  const [timerCount, setTimer] = useState<number>(30)
  const intervalRef = useRef<any>(null)

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }
  const resetTimer = (time: number, start: boolean) => {
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
  }

  const pauseTimer = () => {
    clearTimer()
  }

  const resumeTimer = () => {
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
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return [timerCount, resetTimer, pauseTimer, resumeTimer] as const
}
