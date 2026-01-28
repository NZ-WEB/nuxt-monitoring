import { describe, it, expect, beforeEach, vi } from 'vitest'
import { collectMetrics, defaultMetrics, register } from '../client'

describe('Metrics Client', () => {
  beforeEach(() => {
    // Reset all metrics before each test to ensure clean state
    register.clear()

    // Re-register default metrics after clearing
    register.registerMetric(defaultMetrics.httpRequestTotal)
    register.registerMetric(defaultMetrics.httpRequestDuration)
    register.registerMetric(defaultMetrics.activeRequests)
  })

  describe('defaultMetrics object', () => {
    it('should export httpRequestTotal counter metric', () => {
      expect(defaultMetrics.httpRequestTotal).toBeDefined()
      expect(defaultMetrics.httpRequestTotal.name).toBe('http_request_total')
      expect(defaultMetrics.httpRequestTotal.help).toBe('Total number of HTTP requests')
      expect(defaultMetrics.httpRequestTotal.labelNames).toEqual(['method', 'route', 'status_code'])
    })

    it('should export httpRequestDuration gauge metric', () => {
      expect(defaultMetrics.httpRequestDuration).toBeDefined()
      expect(defaultMetrics.httpRequestDuration.name).toBe('http_request_duration_seconds')
      expect(defaultMetrics.httpRequestDuration.help).toBe('Duration of HTTP requests in seconds')
      expect(defaultMetrics.httpRequestDuration.labelNames).toEqual(['method', 'route', 'status_code'])
    })

    it('should export activeRequests gauge metric', () => {
      expect(defaultMetrics.activeRequests).toBeDefined()
      expect(defaultMetrics.activeRequests.name).toBe('http_active_requests')
      expect(defaultMetrics.activeRequests.help).toBe('Number of active HTTP requests')
      expect(defaultMetrics.activeRequests.labelNames).toEqual([])
    })

    it('should have all metrics properly typed', () => {
      // Test that metrics have expected methods
      expect(typeof defaultMetrics.httpRequestTotal.inc).toBe('function')
      expect(typeof defaultMetrics.httpRequestDuration.set).toBe('function')
      expect(typeof defaultMetrics.activeRequests.inc).toBe('function')
      expect(typeof defaultMetrics.activeRequests.dec).toBe('function')
    })
  })

  describe('register object', () => {
    it('should be a prometheus register instance', () => {
      expect(register).toBeDefined()
      expect(typeof register.metrics).toBe('function')
      expect(typeof register.registerMetric).toBe('function')
      expect(typeof register.clear).toBe('function')
    })

    it('should contain default metrics after initialization', async () => {
      const metrics = await register.metrics()

      expect(metrics).toContain('http_request_total')
      expect(metrics).toContain('http_request_duration_seconds')
      expect(metrics).toContain('http_active_requests')
    })
  })

  describe('collectMetrics function', () => {
    it('should increment request counter with correct labels', () => {
      const labels = {
        method: 'GET',
        route: '/api/test',
        statusCode: 200
      }

      // Mock the inc method to track calls
      const incSpy = vi.spyOn(defaultMetrics.httpRequestTotal, 'inc')

      collectMetrics(labels, 150)

      expect(incSpy).toHaveBeenCalledWith({
        method: 'GET',
        route: '/api/test',
        status_code: '200'
      })
    })

    it('should set request duration with correct labels and value', () => {
      const labels = {
        method: 'POST',
        route: '/api/users',
        statusCode: 201
      }

      // Mock the set method to track calls
      const setSpy = vi.spyOn(defaultMetrics.httpRequestDuration, 'set')

      collectMetrics(labels, 250)

      expect(setSpy).toHaveBeenCalledWith(
        {
          method: 'POST',
          route: '/api/users',
          status_code: '201'
        },
        0.25 // 250ms converted to seconds
      )
    })

    it('should convert duration from milliseconds to seconds correctly', () => {
      const setSpy = vi.spyOn(defaultMetrics.httpRequestDuration, 'set')

      // Test various durations
      const testCases = [
        { durationMs: 100, expectedSeconds: 0.1 },
        { durationMs: 1000, expectedSeconds: 1 },
        { durationMs: 1500, expectedSeconds: 1.5 },
        { durationMs: 50, expectedSeconds: 0.05 },
        { durationMs: 0, expectedSeconds: 0 },
      ]

      testCases.forEach(({ durationMs, expectedSeconds }, index) => {
        collectMetrics({
          method: 'GET',
          route: `/test${index}`,
          statusCode: 200
        }, durationMs)

        expect(setSpy).toHaveBeenCalledWith(
          expect.any(Object),
          expectedSeconds
        )
      })
    })

    it('should handle different HTTP methods correctly', () => {
      const incSpy = vi.spyOn(defaultMetrics.httpRequestTotal, 'inc')

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

      methods.forEach(method => {
        collectMetrics({
          method,
          route: '/api/test',
          statusCode: 200
        }, 100)

        expect(incSpy).toHaveBeenCalledWith(
          expect.objectContaining({ method })
        )
      })
    })

    it('should handle different status codes correctly', () => {
      const incSpy = vi.spyOn(defaultMetrics.httpRequestTotal, 'inc')

      const statusCodes = [200, 201, 400, 401, 404, 500, 503]

      statusCodes.forEach(statusCode => {
        collectMetrics({
          method: 'GET',
          route: '/api/test',
          statusCode
        }, 100)

        expect(incSpy).toHaveBeenCalledWith(
          expect.objectContaining({ status_code: statusCode.toString() })
        )
      })
    })

    it('should handle different route patterns correctly', () => {
      const incSpy = vi.spyOn(defaultMetrics.httpRequestTotal, 'inc')

      const routes = [
        '/api/users',
        '/api/users/123',
        '/api/posts/456/comments',
        '/',
        '/health',
        '/metrics'
      ]

      routes.forEach(route => {
        collectMetrics({
          method: 'GET',
          route,
          statusCode: 200
        }, 100)

        expect(incSpy).toHaveBeenCalledWith(
          expect.objectContaining({ route })
        )
      })
    })

    it('should work with edge case duration values', () => {
      const setSpy = vi.spyOn(defaultMetrics.httpRequestDuration, 'set')

      const edgeCases = [
        { duration: 0, expected: 0 },
        { duration: 0.5, expected: 0.0005 },
        { duration: 1, expected: 0.001 },
        { duration: 10000, expected: 10 },
        { duration: 999999, expected: 999.999 }
      ]

      edgeCases.forEach(({ duration, expected }) => {
        collectMetrics({
          method: 'GET',
          route: '/test',
          statusCode: 200
        }, duration)

        expect(setSpy).toHaveBeenCalledWith(
          expect.any(Object),
          expected
        )
      })
    })

    it('should handle concurrent metric collection calls', async () => {
      const incSpy = vi.spyOn(defaultMetrics.httpRequestTotal, 'inc')
      const setSpy = vi.spyOn(defaultMetrics.httpRequestDuration, 'set')

      // Simulate concurrent requests
      const promises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve().then(() => {
          collectMetrics({
            method: 'GET',
            route: `/api/test/${i}`,
            statusCode: 200
          }, 100 + i * 10)
        })
      )

      await Promise.all(promises)

      expect(incSpy).toHaveBeenCalledTimes(10)
      expect(setSpy).toHaveBeenCalledTimes(10)
    })
  })

  describe('Integration with prometheus register', () => {
    it('should update metrics that are queryable from register', async () => {
      // Collect some metrics
      collectMetrics({ method: 'GET', route: '/test', statusCode: 200 }, 150)
      collectMetrics({ method: 'POST', route: '/test', statusCode: 201 }, 200)

      // Get metrics from register
      const metricsOutput = await register.metrics()

      // Check that our metrics are present
      expect(metricsOutput).toContain('http_request_total')
      expect(metricsOutput).toContain('method="GET"')
      expect(metricsOutput).toContain('method="POST"')
      expect(metricsOutput).toContain('status_code="200"')
      expect(metricsOutput).toContain('status_code="201"')
    })

    it('should accumulate counter values correctly', async () => {
      // Make multiple requests to same endpoint
      const labels = { method: 'GET', route: '/api/test', statusCode: 200 }

      collectMetrics(labels, 100)
      collectMetrics(labels, 150)
      collectMetrics(labels, 200)

      const metricsOutput = await register.metrics()

      // Counter should have accumulated (value should be 3)
      expect(metricsOutput).toMatch(/http_request_total\{[^}]*\} 3/)
    })

    it('should update gauge values correctly', async () => {
      const labels = { method: 'GET', route: '/api/test', statusCode: 200 }

      // Set duration - gauge should show last value
      collectMetrics(labels, 500) // 0.5 seconds

      const metricsOutput = await register.metrics()

      // Gauge should show the last set value (0.5)
      expect(metricsOutput).toMatch(/http_request_duration_seconds\{[^}]*\} 0\.5/)
    })
  })
})