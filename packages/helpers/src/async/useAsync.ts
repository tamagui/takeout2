import { useState, useEffect } from 'react'

export function useAsync<T>(
  promiseFn: () => Promise<T>,
  args: any[]
): [T, 'loading' | 'idle' | 'error', Error | null] {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const result = await promiseFn()
        if (isMounted) {
          setData(result)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error)
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, args)

  return [data as T, error ? 'error' : loading ? 'loading' : 'idle', error]
}
