export default defineEventHandler(async (event) => {
  try {
    // Проксируем запрос к debug server
    const response = await fetch('http://localhost:3001/metrics')
    const data = await response.text()

    // Устанавливаем тот же статус код и правильный Content-Type для метрик
    setResponseStatus(event, response.status)
    setResponseHeader(event, 'Content-Type', 'text/plain; version=0.0.4; charset=utf-8')

    return data
  } catch (error: any) {
    throw createError({
      statusCode: 503,
      statusMessage: `Debug server недоступен: ${error.message}`,
    })
  }
})