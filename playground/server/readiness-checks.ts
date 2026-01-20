import type { ReadinessCheck } from '../../src/module'

export default [
  {
    name: 'database',
    check: async () => {
      // Пример: проверка подключения к БД с причиной ошибки
      throw new Error('Connection timeout after 5000ms')
    },
  },
  {
    name: 'cache',
    check: () => {
      // Пример: проверка кеша
      return true
    },
  },
] satisfies ReadinessCheck[]
