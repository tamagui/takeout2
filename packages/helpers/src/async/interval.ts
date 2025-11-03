import { sleep } from './sleep'

export const interval = async (
  callback: () => void,
  ms: number,
  signal?: AbortSignal
): Promise<never> => {
  while (true) {
    callback()
    await sleep(ms, signal)
  }
}
