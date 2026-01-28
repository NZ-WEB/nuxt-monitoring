import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'http'
import metricsHandler from '../metrics.get'

// Mock the metrics client
vi.mock('../../metrics/client', () => ({
  register: {
    metrics: vi.fn(),
    contentType: 'text/plain; version=0.0.4; charset=utf-8'
  }
}))

describe('Metrics Route Handler', () => {
  let mockRegister: any

  beforeEach(() => {
    // Get fresh mock for each test
    const { register } = require('../../metrics/client')
    mockRegister = register
    vi.clearAllMocks()
  })

  const createMockEvent = () => {
    const req = new IncomingMessage({} as any)
    const res = new ServerResponse(req)
    res.setHeader = vi.fn()
    res.getHeaders = vi.fn().mockReturnValue({})
    return createEvent(req, res)
  }

  describe('Basic functionality', () => {
    it('should return metrics data from register', async () => {
      const mockMetricsData = `# HELP http_request_total Total number of HTTP requests
# TYPE http_request_total counter
http_request_total{method="GET",route="/api",status_code="200"} 5
`
      mockRegister.metrics.mockResolvedValue(mockMetricsData)

      const event = createMockEvent()
      const result = await metricsHandler(event)

      expect(result).toBe(mockMetricsData)
      expect(mockRegister.metrics).toHaveBeenCalledTimes(1)
    })

    it('should set correct Content-Type header', async () => {
      mockRegister.metrics.mockResolvedValue('mock metrics data')

      const event = createMockEvent()
      await metricsHandler(event)

      expect(event.node.res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain; version=0.0.4; charset=utf-8'
      )
    })

    it('should call register.metrics() to get metrics data', async () => {
      mockRegister.metrics.mockResolvedValue('test metrics')

      const event = createMockEvent()
      await metricsHandler(event)

      expect(mockRegister.metrics).toHaveBeenCalledTimes(1)
      expect(mockRegister.metrics).toHaveBeenCalledWith()
    })
  })

  describe('Prometheus format validation', () => {
    it('should return properly formatted Prometheus metrics', async () => {
      const prometheusMetrics = `# HELP http_request_total Total HTTP requests
# TYPE http_request_total counter
http_request_total{method="GET"} 10
# HELP memory_usage_bytes Memory usage in bytes
# TYPE memory_usage_bytes gauge
memory_usage_bytes 1234567
`
      mockRegister.metrics.mockResolvedValue(prometheusMetrics)

      const event = createMockEvent()
      const result = await metricsHandler(event)

      expect(result).toBe(prometheusMetrics)
      expect(result).toContain('# HELP')
      expect(result).toContain('# TYPE')
      expect(result).toContain('http_request_total')
    })

    it('should handle empty metrics correctly', async () => {
      mockRegister.metrics.mockResolvedValue('')

      const event = createMockEvent()
      const result = await metricsHandler(event)

      expect(result).toBe('')
      expect(typeof result).toBe('string')
    })

    it('should handle metrics with various data types', async () => {
      const complexMetrics = `# HELP requests_total Total requests
# TYPE requests_total counter
requests_total{method="GET",code="200"} 1234
requests_total{method="POST",code="201"} 567

# HELP response_time_seconds Response time
# TYPE response_time_seconds histogram
response_time_seconds_bucket{le="0.1"} 100
response_time_seconds_bucket{le="+Inf"} 200
response_time_seconds_sum 123.45
response_time_seconds_count 200
`
      mockRegister.metrics.mockResolvedValue(complexMetrics)

      const event = createMockEvent()
      const result = await metricsHandler(event)

      expect(result).toContain('counter')
      expect(result).toContain('histogram')
      expect(result).toContain('response_time_seconds_bucket')
      expect(result).toContain('+Inf')
    })
  })

  describe('Content-Type header handling', () => {
    it('should use contentType from register', async () => {
      mockRegister.contentType = 'custom/content-type'
      mockRegister.metrics.mockResolvedValue('test data')

      const event = createMockEvent()
      await metricsHandler(event)

      expect(event.node.res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'custom/content-type'
      )
    })

    it('should set header before getting metrics', async () => {
      const calls: string[] = []

      mockRegister.metrics.mockImplementation(() => {
        calls.push('metrics')
        return Promise.resolve('data')
      })

      const originalSetHeader = createMockEvent().node.res.setHeader
      const event = createMockEvent()
      event.node.res.setHeader = vi.fn().mockImplementation(() => {
        calls.push('setHeader')
      })

      await metricsHandler(event)

      expect(calls).toEqual(['setHeader', 'metrics'])
    })

    it('should handle standard Prometheus content type', async () => {
      mockRegister.contentType = 'text/plain; version=0.0.4; charset=utf-8'
      mockRegister.metrics.mockResolvedValue('metrics data')

      const event = createMockEvent()
      await metricsHandler(event)

      expect(event.node.res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain; version=0.0.4; charset=utf-8'
      )
    })
  })

  describe('Async behavior and error handling', () => {
    it('should handle async metrics generation', async () => {
      // Simulate slow metrics generation
      mockRegister.metrics.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('slow metrics'), 10))
      )

      const event = createMockEvent()
      const startTime = Date.now()
      const result = await metricsHandler(event)
      const endTime = Date.now()

      expect(result).toBe('slow metrics')
      expect(endTime - startTime).toBeGreaterThanOrEqual(10)
    })

    it('should propagate errors from register.metrics()', async () => {
      const testError = new Error('Metrics collection failed')
      mockRegister.metrics.mockRejectedValue(testError)

      const event = createMockEvent()

      await expect(metricsHandler(event)).rejects.toThrow('Metrics collection failed')
    })

    it('should handle register.metrics() returning null/undefined', async () => {
      mockRegister.metrics.mockResolvedValue(null)

      const event = createMockEvent()
      const result = await metricsHandler(event)

      expect(result).toBe(null)
    })

    it('should handle register.metrics() returning non-string values', async () => {
      mockRegister.metrics.mockResolvedValue({ invalid: 'object' })

      const event = createMockEvent()
      const result = await metricsHandler(event)

      expect(result).toEqual({ invalid: 'object' })
    })
  })

  describe('Performance and concurrency', () => {
    it('should handle multiple concurrent requests', async () => {
      let callCount = 0
      mockRegister.metrics.mockImplementation(() => {
        callCount++
        return Promise.resolve(`metrics data ${callCount}`)
      })

      const events = Array.from({ length: 5 }, () => createMockEvent())
      const promises = events.map(event => metricsHandler(event))

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      expect(mockRegister.metrics).toHaveBeenCalledTimes(5)

      // Each call should have unique result if register generates fresh data
      results.forEach((result, index) => {
        expect(result).toContain('metrics data')
      })
    })

    it('should maintain performance under load', async () => {
      mockRegister.metrics.mockResolvedValue('performance test metrics')

      const startTime = Date.now()
      const events = Array.from({ length: 50 }, () => createMockEvent())
      const promises = events.map(event => metricsHandler(event))

      await Promise.all(promises)
      const endTime = Date.now()

      // Should complete within reasonable time (2 seconds)
      expect(endTime - startTime).toBeLessThan(2000)
      expect(mockRegister.metrics).toHaveBeenCalledTimes(50)
    })

    it('should not interfere between concurrent requests', async () => {
      let currentCall = 0
      mockRegister.metrics.mockImplementation(() => {
        const call = ++currentCall
        return Promise.resolve(`metrics-${call}`)
      })

      // Launch requests with slight delays
      const promises = Array.from({ length: 3 }, (_, i) =>
        new Promise(resolve => {
          setTimeout(async () => {
            const event = createMockEvent()
            const result = await metricsHandler(event)
            resolve(result)
          }, i * 10)
        })
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result).toMatch(/^metrics-\d+$/)
      })
    })
  })

  describe('Integration scenarios', () => {
    it('should work with realistic Prometheus metrics data', async () => {
      const realisticMetrics = `# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 0.123456

# HELP nodejs_heap_size_total_bytes Process heap size from Node.js in bytes.
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes 1234567890

# HELP http_request_duration_seconds Duration of HTTP requests in seconds.
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.005",method="GET",route="/api"} 1
http_request_duration_seconds_bucket{le="0.01",method="GET",route="/api"} 3
http_request_duration_seconds_bucket{le="+Inf",method="GET",route="/api"} 10
`
      mockRegister.metrics.mockResolvedValue(realisticMetrics)

      const event = createMockEvent()
      const result = await metricsHandler(event)

      expect(result).toBe(realisticMetrics)
      expect(result).toContain('process_cpu_user_seconds_total')
      expect(result).toContain('nodejs_heap_size_total_bytes')
      expect(result).toContain('http_request_duration_seconds_bucket')
    })

    it('should maintain header consistency across requests', async () => {
      mockRegister.metrics.mockResolvedValue('test metrics')

      const events = Array.from({ length: 3 }, () => createMockEvent())

      for (const event of events) {
        await metricsHandler(event)

        expect(event.node.res.setHeader).toHaveBeenCalledWith(
          'Content-Type',
          mockRegister.contentType
        )
      }
    })

    it('should work correctly with register state changes', async () => {
      // First request
      mockRegister.metrics.mockResolvedValueOnce('initial metrics')
      const event1 = createMockEvent()
      const result1 = await metricsHandler(event1)
      expect(result1).toBe('initial metrics')

      // Simulate register state change
      mockRegister.metrics.mockResolvedValueOnce('updated metrics')
      const event2 = createMockEvent()
      const result2 = await metricsHandler(event2)
      expect(result2).toBe('updated metrics')
    })
  })
})