export default defineEventHandler(async (event) => {
  try {
    // Проксируем запрос к debug server
    const response = await fetch('http://localhost:3001/ready')
    const data = await response.text()

    // Устанавливаем тот же статус код
    setResponseStatus(event, response.status)

    // Пытаемся распарсить JSON, если не получается - возвращаем как текст
    try {
      const jsonData = JSON.parse(data)
      return jsonData
    } catch {
      return data
    }
  } catch (error: any) {
    throw createError({
      statusCode: 503,
      statusMessage: `Debug server недоступен: ${error.message}`,
    })
  }
})