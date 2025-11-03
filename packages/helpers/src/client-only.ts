if (process.env.VITE_ENVIRONMENT !== 'client') {
  console.error(`This file should only be imported on the client!`)
}
