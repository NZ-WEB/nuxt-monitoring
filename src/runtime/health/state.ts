interface HealthError {
  message: string
  code?: string
  timestamp: number
}

interface HealthState {
  isHealthy: boolean
  errors: Map<string, HealthError>
}

// Глобальное состояние health check
const healthState: HealthState = {
  isHealthy: true,
  errors: new Map(),
}

/**
 * Устанавливает ошибку health check
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
 * Очищает ошибку health check по ключу
 */
export const clearHealthError = (key: string): void => {
  healthState.errors.delete(key)
  healthState.isHealthy = healthState.errors.size === 0
}

/**
 * Очищает все ошибки health check
 */
export const clearAllHealthErrors = (): void => {
  healthState.errors.clear()
  healthState.isHealthy = true
}

/**
 * Получает текущее состояние health check
 */
export const getHealthState = () => {
  return {
    isHealthy: healthState.isHealthy,
    errors: Object.fromEntries(healthState.errors),
  }
}