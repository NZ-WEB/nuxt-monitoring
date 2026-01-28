import { defineEventHandler, setResponseStatus, setResponseHeader } from 'h3'
import { getHealthState } from '../../health/state'
import type { HealthResponse } from '../../health/types'

export default defineEventHandler((event): HealthResponse => {
  // Добавляем CORS заголовки
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
  setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')

  const healthState = getHealthState()

  if (!healthState.isHealthy) {
    setResponseStatus(event, 503)
    return {
      status: 'error',
      errors: healthState.errors,
    }
  }

  setResponseStatus(event, 200)
  return {
    status: 'ok',
  }
})
