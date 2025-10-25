import { useState, useEffect, useRef } from 'react'
import BackgroundTimer from 'react-native-background-timer'

export const useTimer = () => {
  const [timerCount, setTimer] = useState<number>(30)
  const intervalRef = useRef<any>(null)

  const clearTimer = () => {
    if (intervalRef.current) {
      BackgroundTimer.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }
  const resetTimer = (time: number, start: boolean) => {
    setTimer(time)
    clearTimer()
    if (start) {
      intervalRef.current = BackgroundTimer.setInterval(() => {
        setTimer((lastTimerCount) => {
          if (lastTimerCount <= 1) {
            BackgroundTimer.clearInterval(intervalRef.current)
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
      intervalRef.current = BackgroundTimer.setInterval(() => {
        setTimer((lastTimerCount) => {
          if (lastTimerCount <= 1) {
            BackgroundTimer.clearInterval(intervalRef.current)
            intervalRef.current = null
            return 0
          }
          return lastTimerCount - 1
        })
      }, 1000)
    }
  }

  useEffect(() => {
    // resetTimer();
    return () => {
      if (intervalRef.current) {
        BackgroundTimer.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return [timerCount, resetTimer, pauseTimer, resumeTimer] as const
}
