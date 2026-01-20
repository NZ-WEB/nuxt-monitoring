import type { ReadinessCheck } from '../../src/module'

export default [
  {
    name: 'database',
    check: async () => {
      // Пример: проверка подключения к БД
      return false
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
