import { setHealthError, clearHealthError, getHealthState } from '../../../src/runtime/health/state'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { action, key, message, code } = body

  switch (action) {
    case 'setError':
      if (!key || !message) {
        throw createError({
          statusCode: 400,
          statusMessage: 'key and message are required for setError action',
        })
      }
      setHealthError(key, message, code)
      return { success: true, action: 'error set' }

    case 'clearError':
      if (!key) {
        throw createError({
          statusCode: 400,
          statusMessage: 'key is required for clearError action',
        })
      }
      clearHealthError(key)
      return { success: true, action: 'error cleared' }

    case 'getState':
      return getHealthState()

    default:
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid action. Use: setError, clearError, or getState',
      })
  }
})