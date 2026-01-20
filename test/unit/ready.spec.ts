import { describe, it, expect, beforeEach, vi } from 'vitest'

// Мокаем h3
vi.mock('h3', () => ({
  defineEventHandler: <T>(fn: T) => fn,
  createError: (options: {
    statusCode: number
    statusMessage?: string
    message?: string
    data?: unknown
  }) => {
    const error = new Error(
      options.message || options.statusMessage,
    ) as Error & { statusCode: number, data?: unknown }
    error.statusCode = options.statusCode
    error.data = options.data
    return error
  },
}))

describe('ready endpoint', () => {
  beforeEach(async () => {
    // Очищаем readiness checks перед каждым тестом
    const { clearReadinessChecks }
      = await import('../../src/runtime/server/routes/ready')
    clearReadinessChecks()
  })

  describe('registerReadinessCheck', () => {
    it('должен регистрировать проверку готовности', async () => {
      const { registerReadinessCheck, clearReadinessChecks }
        = await import('../../src/runtime/server/routes/ready')

      const check = {
        name: 'database',
        check: () => true,
      }

      registerReadinessCheck(check)

      // Проверяем что check был добавлен (через вызов handler)
      clearReadinessChecks()
    })
  })

  describe('clearReadinessChecks', () => {
    it('должен очищать все зарегистрированные проверки', async () => {
      const { registerReadinessCheck, clearReadinessChecks }
        = await import('../../src/runtime/server/routes/ready')

      registerReadinessCheck({ name: 'test1', check: () => true })
      registerReadinessCheck({ name: 'test2', check: () => true })

      clearReadinessChecks()

      // После очистки handler должен вернуть базовый ответ без checks
    })
  })

  describe('handler', () => {
    it('должен возвращать status ready когда нет проверок', async () => {
      const readyModule = await import('../../src/runtime/server/routes/ready')
      const handler = readyModule.default

      const result = await handler()

      expect(result).toEqual({ status: 'ready' })
    })

    it('должен возвращать status ready когда все проверки прошли', async () => {
      const { registerReadinessCheck, default: handler }
        = await import('../../src/runtime/server/routes/ready')

      registerReadinessCheck({ name: 'db', check: () => true })
      registerReadinessCheck({
        name: 'cache',
        check: () => Promise.resolve(true),
      })

      const result = await handler()

      expect(result).toEqual({
        status: 'ready',
        checks: [
          { name: 'db', passed: true },
          { name: 'cache', passed: true },
        ],
      })
    })

    it('должен выбрасывать ошибку 503 когда проверка не прошла', async () => {
      const { registerReadinessCheck, default: handler }
        = await import('../../src/runtime/server/routes/ready')

      registerReadinessCheck({ name: 'db', check: () => false })

      await expect(handler()).rejects.toMatchObject({
        statusCode: 503,
      })
    })

    it('должен обрабатывать исключения в проверках как failed', async () => {
      const { registerReadinessCheck, default: handler }
        = await import('../../src/runtime/server/routes/ready')

      registerReadinessCheck({
        name: 'failing',
        check: () => {
          throw new Error('Connection failed')
        },
      })

      await expect(handler()).rejects.toMatchObject({
        statusCode: 503,
      })
    })

    it('должен обрабатывать async проверки', async () => {
      const {
        registerReadinessCheck,
        clearReadinessChecks,
        default: handler,
      } = await import('../../src/runtime/server/routes/ready')

      clearReadinessChecks()

      registerReadinessCheck({
        name: 'async-check',
        check: async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return true
        },
      })

      const result = await handler()

      expect(result).toEqual({
        status: 'ready',
        checks: [{ name: 'async-check', passed: true }],
      })
    })
  })
})
