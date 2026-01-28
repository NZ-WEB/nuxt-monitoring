interface HealthError {
  message: string
  code?: string
  timestamp: number
}

interface HealthState {
  isHealthy: boolean
  errors: Map<string, HealthError>
}

// Global health check state
const healthState: HealthState = {
  isHealthy: true,
  errors: new Map(),
}

/**
 * Sets a health check error
 */
export const setHealthError = (key: string, message: string, code?: string): void => {
  healthState.errors.set(key, {
    message,
    code,
    timestamp: Date.now(),
  })
  healthState.isHealthy = false
}

/**
 * Clears a health check error by key
 */
export const clearHealthError = (key: string): void => {
  healthState.errors.delete(key)
  healthState.isHealthy = healthState.errors.size === 0
}

/**
 * Clears all health check errors
 */
export const clearAllHealthErrors = (): void => {
  healthState.errors.clear()
  healthState.isHealthy = true
}

/**
 * Gets the current health check state
 */
export const getHealthState = () => {
  return {
    isHealthy: healthState.isHealthy,
    errors: Object.fromEntries(healthState.errors),
  }
}