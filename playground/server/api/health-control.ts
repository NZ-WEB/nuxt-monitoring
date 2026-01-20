import { defineEventHandler, getQuery } from 'h3'
import {
  setHealthError,
  clearHealthError,
  getHealthState,
} from '../../../src/module'

/**
 * Пример API для управления состоянием /health endpoint'а
 *
 * GET /api/health-control - получить текущее состояние
 * GET /api/health-control?error=true&reason=Some+error - установить ошибку
 * GET /api/health-control?error=false - очистить ошибку
 */
export default defineEventHandler((event) => {
  const query = getQuery(event)

  if (query.error === 'true') {
    const reason = typeof query.reason === 'string' ? query.reason : undefined
    setHealthError(reason)
    return { action: 'setHealthError', reason }
  }

  if (query.error === 'false') {
    clearHealthError()
    return { action: 'clearHealthError' }
  }

  return {
    state: getHealthState(),
    usage: {
      setError: '/api/health-control?error=true&reason=Some+error',
      clearError: '/api/health-control?error=false',
    },
  }
})
