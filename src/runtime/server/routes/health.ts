import { defineEventHandler, createError } from 'h3'

export interface HealthState {
  isError: boolean
  reason?: string
}

const healthState: HealthState = {
  isError: false,
}

export const setHealthError = (reason?: string) => {
  healthState.isError = true
  healthState.reason = reason
}

export const clearHealthError = () => {
  healthState.isError = false
  healthState.reason = undefined
}

export const getHealthState = (): Readonly<HealthState> => healthState

export default defineEventHandler(() => {
  if (healthState.isError) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      data: { reason: healthState.reason },
    })
  }

  return { status: 'ok' }
})
