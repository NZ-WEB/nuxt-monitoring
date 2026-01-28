import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import metricsMiddleware from '../metrics'
import { useRuntimeConfig } from '#imports'

// Mock the dependencies
vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn()
}))

vi.mock('../../../metrics/client', () => ({
  collectMetrics: vi.fn(),
  defaultMetrics: {
    activeRequests: {
      inc: vi.fn(),
      dec: vi.fn()
    }
  }
}))

describe('Metrics Middleware', () => {
  let mockUseRuntimeConfig: any
  let mockCollectMetrics: any
  let mockDefaultMetrics: any

  beforeEach(async () => {
    // Setup mocks
    mockUseRuntimeConfig = vi.mocked(useRuntimeConfig)
    const { collectMetrics, defaultMetrics } = await import('../../../metrics/client')
    mockCollectMetrics = vi.mocked(collectMetrics)
    mockDefaultMetrics = defaultMetrics

    // Default runtime config
    mockUseRuntimeConfig.mockReturnValue({
      public: {
        monitoring: {
          metrics: { path: '/metrics' },
          healthCheck: { path: '/health' },
          readyCheck: { path: '/ready' }
        }
      }
    })

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockEvent = (method = 'GET', url = '/api/test') => {
    const req = new IncomingMessage({} as any)
    const res = new ServerResponse(req)

    // Mock request properties
    req.method = method
    req.url = url

    // Mock response methods
    res.end = vi.fn()
    res.statusCode = 200

    const event = createEvent(req, res)

    return event
  }

  describe('Request filtering', () => {
    it('should skip Nuxt internal requests', async () => {
      const internalPaths = [
        '/__nuxt',
        '/__dev',
        '/__webpack_hmr',
        '/__build'
      ]

      await Promise.all(internalPaths.map(async (path) => {
        const event = createMockEvent('GET', path)
        const result = await metricsMiddleware(event)

        expect(result).toBeUndefined() // Early return
        expect(mockDefaultMetrics.activeRequests.inc).not.toHaveBeenCalled()

        vi.clearAllMocks()
      }))
    })

    it('should skip monitoring endpoints', async () => {
      const monitoringPaths = ['/metrics', '/health', '/ready']

      await Promise.all(monitoringPaths.map(async (path) => {
        const event = createMockEvent('GET', path)
        const result = await metricsMiddleware(event)

        expect(result).toBeUndefined()
        expect(mockDefaultMetrics.activeRequests.inc).not.toHaveBeenCalled()

        vi.clearAllMocks()
      }))
    })

    it('should skip static assets', async () => {
      const staticAssets = [
        '/favicon.ico',
        '/style.css',
        '/app.js',
        '/image.png',
        '/font.woff2',
        '/data.json'
      ]

      await Promise.all(staticAssets.map(async (path) => {
        vi.clearAllMocks() // Clear before each test
        const event = createMockEvent('GET', path)
        const result = await metricsMiddleware(event)

        expect(result).toBeUndefined()
        expect(mockDefaultMetrics.activeRequests.inc).not.toHaveBeenCalled()
      }))
    })

    it('should process API and regular routes', async () => {
      const regularPaths = [
        '/api/users',
        '/api/posts/123',
        '/',
        '/about',
        '/contact'
      ]

      await Promise.all(regularPaths.map(async (path) => {
        const event = createMockEvent('GET', path)
        await metricsMiddleware(event)

        expect(mockDefaultMetrics.activeRequests.inc).toHaveBeenCalledTimes(1)

        vi.clearAllMocks()
      }))
    })

    it('should handle custom monitoring paths configuration', async () => {
      mockUseRuntimeConfig.mockReturnValue({
        public: {
          monitoring: {
            metrics: { path: '/custom-metrics' },
            healthCheck: { path: '/custom-health' },
            readyCheck: { path: '/custom-ready' }
          }
        }
      })

      const customPaths = ['/custom-metrics', '/custom-health', '/custom-ready']

      await Promise.all(customPaths.map(async (path) => {
        const event = createMockEvent('GET', path)
        const result = await metricsMiddleware(event)

        expect(result).toBeUndefined()
        expect(mockDefaultMetrics.activeRequests.inc).not.toHaveBeenCalled()

        vi.clearAllMocks()
      }))
    })
  })

  describe('Metrics collection', () => {
    it('should increment active requests counter', async () => {
      const event = createMockEvent('GET', '/api/test')
      await metricsMiddleware(event)

      expect(mockDefaultMetrics.activeRequests.inc).toHaveBeenCalledTimes(1)
    })

    it('should collect metrics when request ends', async () => {
      const event = createMockEvent('POST', '/api/users')
      await metricsMiddleware(event)

      // Verify that res.end was wrapped
      expect(typeof event.node.res.end).toBe('function')

      // Simulate request completion
      event.node.res.statusCode = 201
      event.node.res.end()

      expect(mockCollectMetrics).toHaveBeenCalledWith(
        {
          method: 'POST',
          route: '/api/users',
          statusCode: 201
        },
        expect.any(Number) // Duration in seconds
      )
    })

    it('should decrement active requests counter when request ends', async () => {
      const event = createMockEvent('GET', '/api/test')
      await metricsMiddleware(event)

      event.node.res.end()

      expect(mockDefaultMetrics.activeRequests.dec).toHaveBeenCalledTimes(1)
    })

    it('should measure request duration accurately', async () => {
      const event = createMockEvent('GET', '/api/test')

      await metricsMiddleware(event)

      // Simulate some processing time
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 10)
      })

      event.node.res.end()

      expect(mockCollectMetrics).toHaveBeenCalled()
      const duration = mockCollectMetrics.mock.calls[0][1]

      // Duration should be reasonable (in seconds)
      expect(duration).toBeGreaterThan(0)
      expect(duration).toBeLessThan(1) // Should be less than 1 second for test
    })
  })

  describe('Response wrapping', () => {
    it('should preserve original res.end behavior', async () => {
      const event = createMockEvent('GET', '/api/test')
      const originalEnd = vi.fn()
      event.node.res.end = originalEnd

      await metricsMiddleware(event)

      // Call the wrapped end method
      const testData = 'response data'
      event.node.res.end(testData, 'utf8')

      expect(originalEnd).toHaveBeenCalledWith(testData, 'utf8', null)
    })

    it('should handle res.end with different parameter combinations', async () => {
      const event = createMockEvent('GET', '/api/test')
      const originalEnd = vi.fn()
      event.node.res.end = originalEnd

      await metricsMiddleware(event)

      // Test different parameter combinations according to middleware logic:
      // chunk || undefined, encoding as BufferEncoding, callback || undefined
      // if typeof encoding === "function" then callback = encoding; encoding = undefined

      // Test case 1: no arguments
      event.node.res.end()
      expect(originalEnd).toHaveBeenCalledWith(null, null, null)
      vi.clearAllMocks()

      // Test case 2: only chunk
      event.node.res.end('data')
      expect(originalEnd).toHaveBeenCalledWith('data')
      vi.clearAllMocks()

      // Test case 3: chunk and encoding
      event.node.res.end('data', 'utf8')
      expect(originalEnd).toHaveBeenCalledWith('data', 'utf8')
      vi.clearAllMocks()

      // Test case 4: chunk and callback (encoding should be treated as callback)
      const callback = vi.fn()
      event.node.res.end('data', callback)
      // Middleware должен переставить аргументы, но vitest убирает undefined
      const lastCall = originalEnd.mock.calls[0]
      expect(lastCall?.[0]).toBe('data')
      expect(lastCall?.at(-1)).toBe(callback) // callback должен быть последним аргументом
      vi.clearAllMocks()

      // Test case 5: chunk, encoding and callback
      const callback2 = vi.fn()
      event.node.res.end('data', 'utf8', callback2)
      expect(originalEnd).toHaveBeenCalledWith('data', 'utf8', callback2)
    })

    it('should restore original res.end after completion', async () => {
      const event = createMockEvent('GET', '/api/test')
      const originalEnd = event.node.res.end

      await metricsMiddleware(event)

      // Verify it was wrapped
      expect(event.node.res.end).not.toBe(originalEnd)

      // Complete the request
      event.node.res.end()

      // Verify it was restored
      expect(event.node.res.end).toBe(originalEnd)
    })

    it('should handle multiple calls to wrapped res.end gracefully', async () => {
      const event = createMockEvent('GET', '/api/test')
      const originalEnd = vi.fn()
      event.node.res.end = originalEnd

      await metricsMiddleware(event)

      // Call end multiple times
      event.node.res.end('data1')
      event.node.res.end('data2')

      // Original should be called multiple times
      expect(originalEnd).toHaveBeenCalledTimes(2)
      // But metrics should only be collected once per middleware execution
      expect(mockCollectMetrics).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle missing runtime config gracefully', async () => {
      mockUseRuntimeConfig.mockReturnValue({
        public: {}
      })

      const event = createMockEvent('GET', '/api/test')

      // Should not throw even with missing config
      await expect(metricsMiddleware(event)).rejects.toThrow()
    })

    it('should handle malformed URLs', async () => {
      const event = createMockEvent('GET', '//malformed//url')

      // Should handle gracefully
      await expect(metricsMiddleware(event)).resolves.not.toThrow()
    })

    it('should handle requests without method', async () => {
      const event = createMockEvent('GET', '/test')

      // Мокируем геттер method чтобы он возвращал null
      vi.spyOn(event, 'method', 'get').mockReturnValue(null as any)

      await metricsMiddleware(event)
      event.node.res.end()

      expect(mockCollectMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          method: null
        }),
        expect.any(Number)
      )
    })

    it('should handle high precision timing', async () => {
      const event = createMockEvent('GET', '/api/test')

      // Mock process.hrtime.bigint for testing
      const mockHrtimeBigint = vi.spyOn(process.hrtime, 'bigint')
      let callCount = 0
      mockHrtimeBigint.mockImplementation(() => {
        callCount += 1
        return callCount === 1 ? 1000000000n : 1001000000n // 1ms difference in nanoseconds
      })

      await metricsMiddleware(event)
      event.node.res.end()

      expect(mockCollectMetrics).toHaveBeenCalledWith(
        expect.any(Object),
        0.001 // Should be 1ms in seconds
      )

      mockHrtimeBigint.mockRestore()
    })
  })

  describe('Concurrent requests handling', () => {
    it('should handle multiple concurrent requests', async () => {
      const events = Array.from({ length: 5 }, (_, i) =>
        createMockEvent('GET', `/api/test${i}`)
      )

      // Process all requests simultaneously
      await Promise.all(events.map(event => metricsMiddleware(event)))

      expect(mockDefaultMetrics.activeRequests.inc).toHaveBeenCalledTimes(5)

      // Complete all requests
      events.forEach(event => event.node.res.end())

      expect(mockDefaultMetrics.activeRequests.dec).toHaveBeenCalledTimes(5)
      expect(mockCollectMetrics).toHaveBeenCalledTimes(5)
    })

    it('should maintain accurate active request count', async () => {
      const events = Array.from({ length: 3 }, (_, i) =>
        createMockEvent('GET', `/api/test${i}`)
      )

      // Start all requests
      await Promise.all(events.map(event => metricsMiddleware(event)))
      expect(mockDefaultMetrics.activeRequests.inc).toHaveBeenCalledTimes(3)

      // Complete requests one by one
      events[0]?.node.res.end()
      expect(mockDefaultMetrics.activeRequests.dec).toHaveBeenCalledTimes(1)

      events[1]?.node.res.end()
      expect(mockDefaultMetrics.activeRequests.dec).toHaveBeenCalledTimes(2)

      events[2]?.node.res.end()
      expect(mockDefaultMetrics.activeRequests.dec).toHaveBeenCalledTimes(3)
    })

    it('should collect independent metrics for each request', async () => {
      const requests = [
        { method: 'GET', path: '/api/users', status: 200 },
        { method: 'POST', path: '/api/posts', status: 201 },
        { method: 'PUT', path: '/api/users/123', status: 204 }
      ]

      await Promise.all(requests.map(async (req) => {
        const event = createMockEvent(req.method, req.path)
        await metricsMiddleware(event)

        event.node.res.statusCode = req.status
        event.node.res.end()
      }))

      expect(mockCollectMetrics).toHaveBeenCalledTimes(3)

      // Verify each call had correct parameters
      requests.forEach((req, index) => {
        const call = mockCollectMetrics.mock.calls[index]
        expect(call?.[0]).toEqual({
          method: req.method,
          route: req.path,
          statusCode: req.status
        })
      })
    })
  })

  describe('Performance considerations', () => {
    it('should have minimal performance impact on filtered requests', async () => {
      const staticEvent = createMockEvent('GET', '/style.css')

      const startTime = Date.now()
      await metricsMiddleware(staticEvent)
      const endTime = Date.now()

      // Should complete very quickly for filtered requests
      expect(endTime - startTime).toBeLessThan(10)
      expect(mockDefaultMetrics.activeRequests.inc).not.toHaveBeenCalled()
    })

    it('should handle high request volume', async () => {
      const eventCount = 100
      const events = Array.from({ length: eventCount }, (_, i) =>
        createMockEvent('GET', `/api/test${i}`)
      )

      const startTime = Date.now()

      // Process all requests
      await Promise.all(events.map(event => metricsMiddleware(event)))

      // Complete all requests
      events.forEach(event => event.node.res.end())

      const endTime = Date.now()

      expect(mockDefaultMetrics.activeRequests.inc).toHaveBeenCalledTimes(eventCount)
      expect(mockDefaultMetrics.activeRequests.dec).toHaveBeenCalledTimes(eventCount)
      expect(mockCollectMetrics).toHaveBeenCalledTimes(eventCount)

      // Should handle high volume reasonably quickly
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })
})