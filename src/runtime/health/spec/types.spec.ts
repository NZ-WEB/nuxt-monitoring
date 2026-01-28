import { describe, it, expect } from 'vitest'
import type { HealthError, HealthState, HealthResponse } from '../types'

describe('Health Check Types', () => {
  describe('HealthError interface', () => {
    it('should accept valid HealthError objects', () => {
      const validHealthError: HealthError = {
        message: 'Test error',
        code: 'TEST_ERROR',
        timestamp: Date.now()
      }

      expect(validHealthError.message).toBe('Test error')
      expect(validHealthError.code).toBe('TEST_ERROR')
      expect(typeof validHealthError.timestamp).toBe('number')
    })

    it('should accept HealthError without optional code', () => {
      const healthErrorWithoutCode: HealthError = {
        message: 'Error without code',
        timestamp: Date.now()
      }

      expect(healthErrorWithoutCode.message).toBe('Error without code')
      expect(healthErrorWithoutCode.code).toBeUndefined()
      expect(typeof healthErrorWithoutCode.timestamp).toBe('number')
    })

    it('should validate required properties at compile time', () => {
      // These tests verify TypeScript compilation
      // At runtime, we can only check that the objects conform to expected structure

      const testError: HealthError = {
        message: 'Required message',
        timestamp: 1643723400000
      }

      expect(testError).toHaveProperty('message')
      expect(testError).toHaveProperty('timestamp')
      expect(typeof testError.message).toBe('string')
      expect(typeof testError.timestamp).toBe('number')
    })

    it('should handle different message types', () => {
      const errors: HealthError[] = [
        {
          message: 'Simple string message',
          timestamp: Date.now()
        },
        {
          message: 'Message with special characters: @#$%^&*()',
          timestamp: Date.now()
        },
        {
          message: 'Multi-line\nmessage\nwith\nbreaks',
          timestamp: Date.now()
        },
        {
          message: '',
          timestamp: Date.now()
        }
      ]

      errors.forEach(error => {
        expect(typeof error.message).toBe('string')
        expect(typeof error.timestamp).toBe('number')
      })
    })

    it('should handle different code formats', () => {
      const errorCodes: (string | undefined)[] = [
        'SIMPLE_CODE',
        'COMPLEX_ERROR_CODE_123',
        'error.with.dots',
        'ERROR-WITH-DASHES',
        'MiXeD_cAsE_ErRoR',
        undefined
      ]

      errorCodes.forEach(code => {
        const error: HealthError = {
          message: 'Test message',
          code,
          timestamp: Date.now()
        }

        expect(error.code).toBe(code)
        if (code !== undefined) {
          expect(typeof error.code).toBe('string')
        }
      })
    })

    it('should handle timestamp edge cases', () => {
      const timestamps = [
        0,
        Date.now(),
        1643723400000,
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER
      ]

      timestamps.forEach(timestamp => {
        const error: HealthError = {
          message: 'Test message',
          timestamp
        }

        expect(error.timestamp).toBe(timestamp)
        expect(typeof error.timestamp).toBe('number')
      })
    })
  })

  describe('HealthState interface', () => {
    it('should accept valid healthy HealthState', () => {
      const healthyState: HealthState = {
        isHealthy: true,
        errors: {}
      }

      expect(healthyState.isHealthy).toBe(true)
      expect(healthyState.errors).toEqual({})
      expect(typeof healthyState.isHealthy).toBe('boolean')
      expect(typeof healthyState.errors).toBe('object')
    })

    it('should accept valid unhealthy HealthState', () => {
      const unhealthyState: HealthState = {
        isHealthy: false,
        errors: {
          'database': {
            message: 'DB connection failed',
            code: 'DB_ERROR',
            timestamp: Date.now()
          },
          'api': {
            message: 'API timeout',
            timestamp: Date.now()
          }
        }
      }

      expect(unhealthyState.isHealthy).toBe(false)
      expect(Object.keys(unhealthyState.errors)).toHaveLength(2)
      expect(unhealthyState.errors.database).toBeDefined()
      expect(unhealthyState.errors.api).toBeDefined()
    })

    it('should handle different error key formats', () => {
      const errorKeys = [
        'simple',
        'kebab-case',
        'snake_case',
        'camelCase',
        'PascalCase',
        'with.dots',
        'with/slashes',
        'with spaces',
        '123numeric',
        'special!@#$%'
      ]

      errorKeys.forEach(key => {
        const state: HealthState = {
          isHealthy: false,
          errors: {
            [key]: {
              message: `Error for key: ${key}`,
              timestamp: Date.now()
            }
          }
        }

        expect(state.errors[key]).toBeDefined()
        expect(state.errors[key].message).toBe(`Error for key: ${key}`)
      })
    })

    it('should handle state with many errors', () => {
      const manyErrors: Record<string, HealthError> = {}
      for (let i = 0; i < 100; i++) {
        manyErrors[`error${i}`] = {
          message: `Error number ${i}`,
          code: `ERROR_${i}`,
          timestamp: Date.now() + i
        }
      }

      const state: HealthState = {
        isHealthy: false,
        errors: manyErrors
      }

      expect(Object.keys(state.errors)).toHaveLength(100)
      expect(state.isHealthy).toBe(false)
    })

    it('should handle edge case combinations', () => {
      // Edge case: unhealthy with no errors
      const edgeCase1: HealthState = {
        isHealthy: false,
        errors: {}
      }

      expect(edgeCase1.isHealthy).toBe(false)
      expect(Object.keys(edgeCase1.errors)).toHaveLength(0)

      // Edge case: healthy with errors (should not happen in practice but type allows it)
      const edgeCase2: HealthState = {
        isHealthy: true,
        errors: {
          'old-error': {
            message: 'Old error',
            timestamp: Date.now()
          }
        }
      }

      expect(edgeCase2.isHealthy).toBe(true)
      expect(Object.keys(edgeCase2.errors)).toHaveLength(1)
    })
  })

  describe('HealthResponse interface', () => {
    it('should accept valid ok response', () => {
      const okResponse: HealthResponse = {
        status: 'ok'
      }

      expect(okResponse.status).toBe('ok')
      expect(okResponse.errors).toBeUndefined()
    })

    it('should accept valid error response', () => {
      const errorResponse: HealthResponse = {
        status: 'error',
        errors: {
          'test': {
            message: 'Test error',
            timestamp: Date.now()
          }
        }
      }

      expect(errorResponse.status).toBe('error')
      expect(errorResponse.errors).toBeDefined()
      expect(errorResponse.errors!.test).toBeDefined()
    })

    it('should handle different status values', () => {
      const validStatuses: ('ok' | 'error')[] = ['ok', 'error']

      validStatuses.forEach(status => {
        const response: HealthResponse = {
          status
        }

        expect(response.status).toBe(status)
        expect(['ok', 'error']).toContain(response.status)
      })
    })

    it('should handle response with empty errors', () => {
      const responseWithEmptyErrors: HealthResponse = {
        status: 'error',
        errors: {}
      }

      expect(responseWithEmptyErrors.status).toBe('error')
      expect(responseWithEmptyErrors.errors).toEqual({})
      expect(Object.keys(responseWithEmptyErrors.errors!)).toHaveLength(0)
    })

    it('should handle complex error responses', () => {
      const complexErrorResponse: HealthResponse = {
        status: 'error',
        errors: {
          'database': {
            message: 'Database connection timeout after 30 seconds',
            code: 'DB_TIMEOUT',
            timestamp: 1643723400000
          },
          'redis': {
            message: 'Redis server not responding',
            code: 'REDIS_DOWN',
            timestamp: 1643723450000
          },
          'external-api': {
            message: 'External service returned 503',
            timestamp: 1643723500000
          }
        }
      }

      expect(complexErrorResponse.status).toBe('error')
      expect(Object.keys(complexErrorResponse.errors!)).toHaveLength(3)

      // Verify each error has proper structure
      Object.values(complexErrorResponse.errors!).forEach(error => {
        expect(error).toHaveProperty('message')
        expect(error).toHaveProperty('timestamp')
        expect(typeof error.message).toBe('string')
        expect(typeof error.timestamp).toBe('number')
      })
    })
  })

  describe('Type compatibility and relationships', () => {
    it('should maintain compatibility between HealthState and HealthResponse', () => {
      // Test that HealthState.errors can be used in HealthResponse.errors
      const stateErrors: Record<string, HealthError> = {
        'test': {
          message: 'Test error',
          timestamp: Date.now()
        }
      }

      const state: HealthState = {
        isHealthy: false,
        errors: stateErrors
      }

      const response: HealthResponse = {
        status: 'error',
        errors: state.errors
      }

      expect(response.errors).toBe(state.errors)
    })

    it('should handle conversion from HealthState to HealthResponse', () => {
      const convertToResponse = (state: HealthState): HealthResponse => {
        if (state.isHealthy) {
          return { status: 'ok' }
        } else {
          return { status: 'error', errors: state.errors }
        }
      }

      // Test healthy conversion
      const healthyState: HealthState = { isHealthy: true, errors: {} }
      const healthyResponse = convertToResponse(healthyState)
      expect(healthyResponse.status).toBe('ok')
      expect(healthyResponse.errors).toBeUndefined()

      // Test unhealthy conversion
      const unhealthyState: HealthState = {
        isHealthy: false,
        errors: {
          'test': { message: 'Test', timestamp: Date.now() }
        }
      }
      const unhealthyResponse = convertToResponse(unhealthyState)
      expect(unhealthyResponse.status).toBe('error')
      expect(unhealthyResponse.errors).toBe(unhealthyState.errors)
    })

    it('should ensure type safety across different usage patterns', () => {
      // Test that all interfaces work together in realistic scenarios
      const createError = (message: string, code?: string): HealthError => ({
        message,
        code,
        timestamp: Date.now()
      })

      const errors = [
        createError('Database error', 'DB_ERROR'),
        createError('API error'),
        createError('Cache error', 'CACHE_ERROR')
      ]

      const errorMap: Record<string, HealthError> = {}
      errors.forEach((error, index) => {
        errorMap[`error${index}`] = error
      })

      const state: HealthState = {
        isHealthy: Object.keys(errorMap).length === 0,
        errors: errorMap
      }

      const response: HealthResponse = {
        status: state.isHealthy ? 'ok' : 'error',
        errors: state.isHealthy ? undefined : state.errors
      }

      expect(response.status).toBe('error')
      expect(response.errors).toBe(errorMap)
      expect(Object.keys(response.errors!)).toHaveLength(3)
    })
  })
})