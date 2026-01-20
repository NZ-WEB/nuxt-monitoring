import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
} from 'vitest'
import { register } from 'prom-client'

// Очищаем реестр перед каждым тестом
beforeEach(() => {
  register.clear()
})

describe('metrics/client', () => {
  describe('defaultMetrics', () => {
    it('должен экспортировать defaultMetrics с правильными метриками', async () => {
      const { defaultMetrics } = await import('../../src/runtime/metrics/client')

      expect(defaultMetrics).toBeDefined()
      expect(defaultMetrics.httpRequestTotal).toBeDefined()
      expect(defaultMetrics.httpRequestDuration).toBeDefined()
      expect(defaultMetrics.activeRequests).toBeDefined()
    })

    it('httpRequestTotal должен быть Counter', async () => {
      const { defaultMetrics } = await import('../../src/runtime/metrics/client')

      // Проверяем что это Counter через наличие метода inc
      expect(typeof defaultMetrics.httpRequestTotal.inc).toBe('function')
    })

    it('httpRequestDuration должен быть Summary', async () => {
      const { defaultMetrics } = await import('../../src/runtime/metrics/client')

      // Проверяем что это Summary через наличие метода observe
      expect(typeof defaultMetrics.httpRequestDuration.observe).toBe('function')
    })

    it('activeRequests должен быть Gauge', async () => {
      const { defaultMetrics } = await import('../../src/runtime/metrics/client')

      // Проверяем что это Gauge через наличие методов inc и dec
      expect(typeof defaultMetrics.activeRequests.inc).toBe('function')
      expect(typeof defaultMetrics.activeRequests.dec).toBe('function')
    })
  })

  describe('collectMetrics', () => {
    it('должен собирать метрики запроса', async () => {
      const { collectMetrics, defaultMetrics } = await import('../../src/runtime/metrics/client')

      const labels = {
        method: 'GET',
        route: '/api/test',
        statusCode: 200,
      }
      const duration = 0.5

      collectMetrics(labels, duration)

      // Проверяем что Counter был увеличен
      const counterMetric = await defaultMetrics.httpRequestTotal.get()
      expect(counterMetric.values.length).toBeGreaterThan(0)

      const counterValue = counterMetric.values.find(
        v => v.labels.method === 'GET'
          && v.labels.route === '/api/test'
          && v.labels.status_code === 200,
      )
      expect(counterValue?.value).toBe(1)
    })

    it('должен увеличивать счётчик при множественных вызовах', async () => {
      const { collectMetrics, defaultMetrics } = await import('../../src/runtime/metrics/client')

      const labels = {
        method: 'POST',
        route: '/api/data',
        statusCode: 201,
      }

      collectMetrics(labels, 0.1)
      collectMetrics(labels, 0.2)
      collectMetrics(labels, 0.3)

      const counterMetric = await defaultMetrics.httpRequestTotal.get()
      const counterValue = counterMetric.values.find(
        v => v.labels.method === 'POST'
          && v.labels.route === '/api/data'
          && v.labels.status_code === 201,
      )
      expect(counterValue?.value).toBe(3)
    })
  })

  describe('register', () => {
    it('должен экспортировать register из prom-client', async () => {
      const { register: exportedRegister } = await import('../../src/runtime/metrics/client')

      expect(exportedRegister).toBeDefined()
      expect(typeof exportedRegister.metrics).toBe('function')
      expect(typeof exportedRegister.contentType).toBe('string')
    })

    it('должен возвращать метрики в формате Prometheus', async () => {
      // Реимпортируем модуль чтобы метрики были зарегистрированы заново
      vi.resetModules()
      const { register: exportedRegister, collectMetrics } = await import('../../src/runtime/metrics/client')

      collectMetrics({ method: 'GET', route: '/', statusCode: 200 }, 0.1)

      const metrics = await exportedRegister.metrics()

      expect(metrics).toContain('http_request_total')
      expect(metrics).toContain('http_request_duration_seconds')
      expect(metrics).toContain('http_active_requests')
    })
  })
})
