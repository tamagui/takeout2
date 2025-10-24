// TODO better bugfix for One not setting 0.0.0.0
export const ONE_SERVER_URL = `${process.env.ONE_SERVER_URL}`.replace(
  `0.0.0.0`,
  'localhost'
)
