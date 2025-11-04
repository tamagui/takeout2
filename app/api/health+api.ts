export default () =>
  Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
