export default defineEventHandler(async (event) => {
  try {
    // Proxy request to debug server
    const response = await fetch('http://localhost:3001/ready')
    const data = await response.text()

    // Set the same status code
    setResponseStatus(event, response.status)

    // Try to parse JSON, return as text if parsing fails
    try {
      const jsonData = JSON.parse(data)
      return jsonData
    } catch {
      return data
    }
  } catch (error: any) {
    throw createError({
      statusCode: 503,
      statusMessage: `Debug server unavailable: ${error.message}`,
    })
  }
})