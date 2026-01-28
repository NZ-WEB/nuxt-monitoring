import { defineEventHandler, setResponseStatus } from 'h3'
import { getHealthState } from '../../health/state'

export default defineEventHandler((event) => {
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
