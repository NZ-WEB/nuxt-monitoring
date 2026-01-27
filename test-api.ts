// Простой тест для проверки типизации и импортов
import {
  setHealthError,
  clearHealthError,
  clearAllHealthErrors,
  getHealthState,
} from './src/runtime/health/state'

// Тестируем API
const testHealthCheckApi = () => {
  // Устанавливаем ошибку
  setHealthError('database', 'Database connection failed', 'DB_ERROR')
  setHealthError('external-api', 'External API timeout')

  // Проверяем состояние
  let state = getHealthState()
  console.log('State with errors:', state)

  // Очищаем одну ошибку
  clearHealthError('database')
  state = getHealthState()
  console.log('State after clearing database error:', state)

  // Очищаем все ошибки
  clearAllHealthErrors()
  state = getHealthState()
  console.log('State after clearing all errors:', state)
}

export { testHealthCheckApi }