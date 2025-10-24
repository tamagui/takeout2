import { Socket } from 'node:net'

export function checkPort(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = new Socket()

    tester.once('connect', () => {
      tester.destroy()
      resolve(true)
    })

    tester.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ECONNREFUSED') {
        resolve(false)
      } else {
        resolve(true)
      }
    })

    tester.connect(port, host)
  })
}
