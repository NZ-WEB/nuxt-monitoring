export default defineEventHandler(async (event) => {
  try {
    // Proxy request to debug server
    const response = await fetch('http://localhost:3001/metrics')
    const data = await response.text()

    // Set the same status code and proper Content-Type for metrics
    setResponseStatus(event, response.status)
    setResponseHeader(event, 'Content-Type', 'text/plain; version=0.0.4; charset=utf-8')

    return data
  } catch (error: any) {
    throw createError({
      statusCode: 503,
      statusMessage: `Debug server unavailable: ${error.message}`,
    })
  }
})