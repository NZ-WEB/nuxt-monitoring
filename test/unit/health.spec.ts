import { describe, it, expect, beforeEach } from 'vitest'

describe('health endpoint', () => {
  beforeEach(async () => {
    // Очищаем состояние перед каждым тестом
    const { clearHealthError }
      = await import('../../src/runtime/server/routes/health')
    clearHealthError()
  })

  it('должен возвращать status ok', async () => {
    const { default: handler }
      = await import('../../src/runtime/server/routes/health')

    const result = handler({} as Parameters<typeof handler>[0])

    expect(result).toEqual({ status: 'ok' })
  })

  it('должен быть синхронным', async () => {
    const { default: handler }
      = await import('../../src/runtime/server/routes/health')

    const result = handler({} as Parameters<typeof handler>[0])

    // Проверяем что результат не Promise
    expect(result).not.toBeInstanceOf(Promise)
  })

  describe('setHealthError', () => {
    it('должен возвращать ошибку 503 после вызова setHealthError', async () => {
      const { default: handler, setHealthError }
        = await import('../../src/runtime/server/routes/health')

      setHealthError()

      expect(() => handler({} as Parameters<typeof handler>[0])).toThrow()
    })

    it('должен включать причину ошибки в ответ', async () => {
      const { default: handler, setHealthError }
        = await import('../../src/runtime/server/routes/health')

      setHealthError('Database connection lost')

      try {
        handler({} as Parameters<typeof handler>[0])
        expect.fail('Должен был выбросить ошибку')
      }
      catch (error: unknown) {
        const err = error as { statusCode: number, data: { reason: string } }
        expect(err.statusCode).toBe(503)
        expect(err.data.reason).toBe('Database connection lost')
      }
    })
  })

  describe('clearHealthError', () => {
    it('должен восстанавливать нормальную работу после clearHealthError', async () => {
      const {
        default: handler,
        setHealthError,
        clearHealthError,
      } = await import('../../src/runtime/server/routes/health')

      setHealthError('Some error')
      clearHealthError()

      const result = handler({} as Parameters<typeof handler>[0])

      expect(result).toEqual({ status: 'ok' })
    })
  })

  describe('getHealthState', () => {
    it('должен возвращать текущее состояние', async () => {
      const { setHealthError, getHealthState }
        = await import('../../src/runtime/server/routes/health')

      expect(getHealthState().isError).toBe(false)

      setHealthError('Test reason')

      expect(getHealthState().isError).toBe(true)
      expect(getHealthState().reason).toBe('Test reason')
    })
  })
})
