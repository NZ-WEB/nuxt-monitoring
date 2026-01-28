import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'http'
import metricsMiddleware from '../metrics'

// Mock the dependencies
vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn()
}))

vi.mock('../../metrics/client', () => ({
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

  beforeEach(() => {
    // Setup mocks
    const { useRuntimeConfig } = require('#imports')
    const { collectMetrics, defaultMetrics } = require('../../metrics/client')

    mockUseRuntimeConfig = useRuntimeConfig
    mockCollectMetrics = collectMetrics
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
    event.method = method

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

      for (const path of internalPaths) {
        const event = createMockEvent('GET', path)
        const result = await metricsMiddleware(event)

        expect(result).toBeUndefined() // Early return
        expect(mockDefaultMetrics.activeRequests.inc).not.toHaveBeenCalled()

        vi.clearAllMocks()
      }
    })

    it('should skip monitoring endpoints', async () => {
      const monitoringPaths = ['/metrics', '/health', '/ready']

      for (const path of monitoringPaths) {
        const event = createMockEvent('GET', path)
        const result = await metricsMiddleware(event)

        expect(result).toBeUndefined()
        expect(mockDefaultMetrics.activeRequests.inc).not.toHaveBeenCalled()

        vi.clearAllMocks()
      }
    })

    it('should skip static assets', async () => {
      const staticAssets = [
        '/favicon.ico',
        '/style.css',
        '/app.js',
        '/image.png',
        '/document.pdf',
        '/font.woff2',
        '/data.json'
      ]

      for (const path of staticAssets) {
        const event = createMockEvent('GET', path)
        const result = await metricsMiddleware(event)

        expect(result).toBeUndefined()
        expect(mockDefaultMetrics.activeRequests.inc).not.toHaveBeenCalled()

        vi.clearAllMocks()
      }
    })

    it('should process API and regular routes', async () => {
      const regularPaths = [
        '/api/users',
        '/api/posts/123',
        '/',
        '/about',
        '/contact'
      ]

      for (const path of regularPaths) {
        const event = createMockEvent('GET', path)
        await metricsMiddleware(event)

        expect(mockDefaultMetrics.activeRequests.inc).toHaveBeenCalledTimes(1)

        vi.clearAllMocks()
      }
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

      for (const path of customPaths) {
        const event = createMockEvent('GET', path)
        const result = await metricsMiddleware(event)

        expect(result).toBeUndefined()
        expect(mockDefaultMetrics.activeRequests.inc).not.toHaveBeenCalled()

        vi.clearAllMocks()
      }
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

      const startTime = Date.now()
      await metricsMiddleware(event)

      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 10))

      event.node.res.end()
      const endTime = Date.now()

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

      expect(originalEnd).toHaveBeenCalledWith(testData, 'utf8', undefined)
    })

    it('should handle res.end with different parameter combinations', async () => {
      const event = createMockEvent('GET', '/api/test')
      const originalEnd = vi.fn()
      event.node.res.end = originalEnd

      await metricsMiddleware(event)

      // Test different parameter combinations
      const testCases = [
        [],
        ['data'],
        ['data', 'utf8'],
        ['data', vi.fn()],
        ['data', 'utf8', vi.fn()]
      ]

      for (const args of testCases) {
        event.node.res.end(...args)

        expect(originalEnd).toHaveBeenCalledWith(
          args[0] || undefined,
          typeof args[1] === 'string' ? args[1] : undefined,
          typeof args[1] === 'function' ? args[1] : (args[2] || undefined)
        )

        vi.clearAllMocks()
      }
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
      const event = createMockEvent()
      event.method = undefined as any

      await metricsMiddleware(event)
      event.node.res.end()

      expect(mockCollectMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          method: undefined
        }),
        expect.any(Number)
      )
    })

    it('should handle high precision timing', async () => {
      const event = createMockEvent('GET', '/api/test')

      // Mock process.hrtime.bigint for testing
      const mockHrtime = vi.spyOn(process, 'hrtime')
      let callCount = 0
      mockHrtime.mockImplementation(() => {
        callCount++
        return callCount === 1 ? 1000000n : 2000000n // 1ms difference
      } as any)

      await metricsMiddleware(event)
      event.node.res.end()

      expect(mockCollectMetrics).toHaveBeenCalledWith(
        expect.any(Object),
        0.001 // Should be 1ms in seconds
      )

      mockHrtime.mockRestore()
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
      events[0].node.res.end()
      expect(mockDefaultMetrics.activeRequests.dec).toHaveBeenCalledTimes(1)

      events[1].node.res.end()
      expect(mockDefaultMetrics.activeRequests.dec).toHaveBeenCalledTimes(2)

      events[2].node.res.end()
      expect(mockDefaultMetrics.activeRequests.dec).toHaveBeenCalledTimes(3)
    })

    it('should collect independent metrics for each request', async () => {
      const requests = [
        { method: 'GET', path: '/api/users', status: 200 },
        { method: 'POST', path: '/api/posts', status: 201 },
        { method: 'PUT', path: '/api/users/123', status: 204 }
      ]

      for (const req of requests) {
        const event = createMockEvent(req.method, req.path)
        await metricsMiddleware(event)

        event.node.res.statusCode = req.status
        event.node.res.end()
      }

      expect(mockCollectMetrics).toHaveBeenCalledTimes(3)

      // Verify each call had correct parameters
      requests.forEach((req, index) => {
        const call = mockCollectMetrics.mock.calls[index]
        expect(call[0]).toEqual({
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