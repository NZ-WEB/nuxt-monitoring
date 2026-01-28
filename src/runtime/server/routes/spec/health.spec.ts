import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createEvent, createApp } from 'h3'
import { IncomingMessage, ServerResponse } from 'http'
import healthHandler from '../health'
import { setHealthError, clearAllHealthErrors } from '../../../health/state'

// Mock the health state functions for isolated testing
vi.mock('../../../health/state', () => ({
  getHealthState: vi.fn(),
  setHealthError: vi.fn(),
  clearHealthError: vi.fn(),
  clearAllHealthErrors: vi.fn(),
}))

describe('Health Route Handler', () => {
  let mockGetHealthState: any

  beforeEach(() => {
    // Get a fresh mock for each test
    const { getHealthState } = await import('../../../health/state')
    mockGetHealthState = getHealthState as any
    vi.clearAllMocks()
  })

  const createMockEvent = () => {
    const req = new IncomingMessage({} as any)
    const res = new ServerResponse(req)
    return createEvent(req, res)
  }

  describe('Healthy state responses', () => {
    it('should return 200 status and ok response when healthy', async () => {
      // Mock healthy state
      mockGetHealthState.mockReturnValue({
        isHealthy: true,
        errors: {}
      })

      const event = createMockEvent()
      const result = await healthHandler(event)

      expect(result).toEqual({
        status: 'ok'
      })
      expect(event.node.res.statusCode).toBe(200)
    })

    it('should call getHealthState when handling request', async () => {
      mockGetHealthState.mockReturnValue({
        isHealthy: true,
        errors: {}
      })

      const event = createMockEvent()
      await healthHandler(event)

      expect(mockGetHealthState).toHaveBeenCalledTimes(1)
    })
  })

  describe('Unhealthy state responses', () => {
    it('should return 503 status and error response when unhealthy', async () => {
      const mockErrors = {
        'database': {
          message: 'Database connection failed',
          code: 'DB_ERROR',
          timestamp: Date.now()
        }
      }

      mockGetHealthState.mockReturnValue({
        isHealthy: false,
        errors: mockErrors
      })

      const event = createMockEvent()
      const result = await healthHandler(event)

      expect(result).toEqual({
        status: 'error',
        errors: mockErrors
      })
      expect(event.node.res.statusCode).toBe(503)
    })

    it('should return detailed error information in response', async () => {
      const mockErrors = {
        'api': {
          message: 'External API timeout',
          code: 'API_TIMEOUT',
          timestamp: 1643723400000
        },
        'cache': {
          message: 'Redis connection failed',
          timestamp: 1643723500000
        }
      }

      mockGetHealthState.mockReturnValue({
        isHealthy: false,
        errors: mockErrors
      })

      const event = createMockEvent()
      const result = await healthHandler(event)

      expect(result.status).toBe('error')
      expect(result.errors).toEqual(mockErrors)
      expect(result.errors['api'].message).toBe('External API timeout')
      expect(result.errors['api'].code).toBe('API_TIMEOUT')
      expect(result.errors['cache'].message).toBe('Redis connection failed')
      expect(result.errors['cache']).not.toHaveProperty('code')
    })

    it('should handle multiple errors correctly', async () => {
      const mockErrors = {
        'error1': { message: 'Error 1', timestamp: Date.now() },
        'error2': { message: 'Error 2', code: 'E2', timestamp: Date.now() },
        'error3': { message: 'Error 3', timestamp: Date.now() }
      }

      mockGetHealthState.mockReturnValue({
        isHealthy: false,
        errors: mockErrors
      })

      const event = createMockEvent()
      const result = await healthHandler(event)

      expect(result.status).toBe('error')
      expect(Object.keys(result.errors!)).toHaveLength(3)
      expect(result.errors).toEqual(mockErrors)
    })
  })

  describe('Response structure validation', () => {
    it('should always return an object with status property', async () => {
      mockGetHealthState.mockReturnValue({
        isHealthy: true,
        errors: {}
      })

      const event = createMockEvent()
      const result = await healthHandler(event)

      expect(result).toBeTypeOf('object')
      expect(result).toHaveProperty('status')
      expect(typeof result.status).toBe('string')
    })

    it('should include errors property only when unhealthy', async () => {
      // Test healthy state
      mockGetHealthState.mockReturnValue({
        isHealthy: true,
        errors: {}
      })

      const healthyEvent = createMockEvent()
      const healthyResult = await healthHandler(healthyEvent)

      expect(healthyResult).not.toHaveProperty('errors')

      // Test unhealthy state
      mockGetHealthState.mockReturnValue({
        isHealthy: false,
        errors: { test: { message: 'test', timestamp: Date.now() } }
      })

      const unhealthyEvent = createMockEvent()
      const unhealthyResult = await healthHandler(unhealthyEvent)

      expect(unhealthyResult).toHaveProperty('errors')
    })

    it('should return proper TypeScript types', async () => {
      mockGetHealthState.mockReturnValue({
        isHealthy: true,
        errors: {}
      })

      const event = createMockEvent()
      const result = await healthHandler(event)

      // TypeScript compile-time check - result should be HealthResponse type
      expect(['ok', 'error']).toContain(result.status)
    })
  })

  describe('HTTP status code handling', () => {
    it('should set HTTP 200 for healthy responses', async () => {
      mockGetHealthState.mockReturnValue({
        isHealthy: true,
        errors: {}
      })

      const event = createMockEvent()
      await healthHandler(event)

      expect(event.node.res.statusCode).toBe(200)
    })

    it('should set HTTP 503 for unhealthy responses', async () => {
      mockGetHealthState.mockReturnValue({
        isHealthy: false,
        errors: { test: { message: 'test', timestamp: Date.now() } }
      })

      const event = createMockEvent()
      await healthHandler(event)

      expect(event.node.res.statusCode).toBe(503)
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle empty errors object when unhealthy', async () => {
      // Edge case: isHealthy false but empty errors
      mockGetHealthState.mockReturnValue({
        isHealthy: false,
        errors: {}
      })

      const event = createMockEvent()
      const result = await healthHandler(event)

      expect(result.status).toBe('error')
      expect(result.errors).toEqual({})
      expect(event.node.res.statusCode).toBe(503)
    })

    it('should handle getHealthState throwing error', async () => {
      mockGetHealthState.mockImplementation(() => {
        throw new Error('Health state error')
      })

      const event = createMockEvent()

      // Handler should not throw, but we might need to handle this case
      await expect(healthHandler(event)).rejects.toThrow('Health state error')
    })

    it('should handle malformed health state', async () => {
      // Test with invalid health state structure
      mockGetHealthState.mockReturnValue(null)

      const event = createMockEvent()

      // This should throw or handle gracefully depending on implementation
      await expect(healthHandler(event)).rejects.toThrow()
    })
  })

  describe('Concurrent request handling', () => {
    it('should handle multiple concurrent health checks', async () => {
      let callCount = 0
      mockGetHealthState.mockImplementation(() => {
        callCount++
        return {
          isHealthy: callCount % 2 === 0, // Alternate between healthy/unhealthy
          errors: callCount % 2 === 0 ? {} : { test: { message: 'test', timestamp: Date.now() } }
        }
      })

      // Create multiple concurrent requests
      const events = Array.from({ length: 5 }, () => createMockEvent())
      const promises = events.map(event => healthHandler(event))

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      expect(mockGetHealthState).toHaveBeenCalledTimes(5)

      // Verify results alternate as expected
      results.forEach((result, index) => {
        const expectedStatus = (index + 1) % 2 === 0 ? 'ok' : 'error'
        expect(result.status).toBe(expectedStatus)
      })
    })

    it('should maintain consistent response format under load', async () => {
      mockGetHealthState.mockReturnValue({
        isHealthy: false,
        errors: { load: { message: 'Under load', timestamp: Date.now() } }
      })

      // Simulate high load
      const events = Array.from({ length: 50 }, () => createMockEvent())
      const promises = events.map(event => healthHandler(event))

      const results = await Promise.all(promises)

      // All results should be consistent
      results.forEach(result => {
        expect(result.status).toBe('error')
        expect(result.errors).toHaveProperty('load')
      })
    })
  })
})