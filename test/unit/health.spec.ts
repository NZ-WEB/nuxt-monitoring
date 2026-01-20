import {
  describe,
  it,
  expect,
} from 'vitest'

describe('health endpoint', () => {
  it('должен возвращать status ok', async () => {
    const { default: handler } = await import('../../src/runtime/server/routes/health')

    const result = handler({} as Parameters<typeof handler>[0])

    expect(result).toEqual({ status: 'ok' })
  })

  it('должен быть синхронным', async () => {
    const { default: handler } = await import('../../src/runtime/server/routes/health')

    const result = handler({} as Parameters<typeof handler>[0])

    // Проверяем что результат не Promise
    expect(result).not.toBeInstanceOf(Promise)
  })
})
