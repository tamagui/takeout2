if (process.env.VITE_ENVIRONMENT !== 'ssr') {
  throw new Error(`This file should only be imported on the server!`)
}
