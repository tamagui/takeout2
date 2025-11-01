import { useEffect, useState } from 'react'
import { useRouter } from 'one'

const TAPS_NEEDED = 20

export function RepeatedTapToShowDevTools({
  children,
}: {
  children: (props: { handleTap: () => void; tapsRemaining: number }) => React.ReactNode
}) {
  const [tapsRemaining, setTapsRemaining] = useState(TAPS_NEEDED)
  const router = useRouter()

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined
    if (tapsRemaining < TAPS_NEEDED) {
      timeout = setTimeout(() => setTapsRemaining(TAPS_NEEDED), 5000)
    }
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [tapsRemaining])

  useEffect(() => {
    if (tapsRemaining === 0) {
      setTapsRemaining(TAPS_NEEDED)
      // router.push('/version-manager')
    }
  }, [tapsRemaining])

  const handleTap = () => {
    setTapsRemaining((prev) => prev - 1)
  }

  return children({ handleTap, tapsRemaining })
}
