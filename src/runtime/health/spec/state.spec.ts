import { describe, it, expect, beforeEach } from 'vitest'
import {
  setHealthError,
  clearHealthError,
  clearAllHealthErrors,
  getHealthState,
} from '../state'

describe('Health Check State Management', () => {
  // Reset health state before each test to ensure clean state
  beforeEach(() => {
    clearAllHealthErrors()
  })

  describe('getHealthState', () => {
    it('should return healthy state by default', () => {
      const state = getHealthState()

      expect(state.isHealthy).toBe(true)
      expect(state.errors).toEqual({})
    })

    it('should return current health state with proper structure', () => {
      const state = getHealthState()

      expect(state).toHaveProperty('isHealthy')
      expect(state).toHaveProperty('errors')
      expect(typeof state.isHealthy).toBe('boolean')
      expect(typeof state.errors).toBe('object')
    })
  })

  describe('setHealthError', () => {
    it('should set a health error with message only', () => {
      setHealthError('test-key', 'Test error message')
      const state = getHealthState()

      expect(state.isHealthy).toBe(false)
      expect(state.errors['test-key']).toBeDefined()
      expect(state.errors['test-key']?.message).toBe('Test error message')
      expect(state.errors['test-key']?.code).toBeUndefined()
      expect(typeof state.errors['test-key']?.timestamp).toBe('number')
    })

    it('should set a health error with message and code', () => {
      setHealthError('db-error', 'Database connection failed', 'DB_CONNECTION_ERROR')
      const state = getHealthState()

      expect(state.isHealthy).toBe(false)
      expect(state.errors['db-error']).toBeDefined()
      expect(state.errors['db-error']?.message).toBe('Database connection failed')
      expect(state.errors['db-error']?.code).toBe('DB_CONNECTION_ERROR')
      expect(typeof state.errors['db-error']?.timestamp).toBe('number')
    })

    it('should set multiple errors and keep all of them', () => {
      setHealthError('db', 'DB error')
      setHealthError('api', 'API error', 'API_DOWN')
      const state = getHealthState()

      expect(state.isHealthy).toBe(false)
      expect(Object.keys(state.errors)).toHaveLength(2)
      expect(state.errors.db?.message).toBe('DB error')
      expect(state.errors.api?.message).toBe('API error')
      expect(state.errors.api?.code).toBe('API_DOWN')
    })

    it('should overwrite existing error with same key', () => {
      setHealthError('test', 'First error')
      const firstTimestamp = getHealthState().errors.test?.timestamp

      // Wait a tiny bit to ensure timestamp difference
      setTimeout(() => {
        setHealthError('test', 'Second error', 'NEW_CODE')
        const state = getHealthState()

        expect(state.errors.test?.message).toBe('Second error')
        expect(state.errors.test?.code).toBe('NEW_CODE')
        expect(state.errors.test?.timestamp).toBeGreaterThanOrEqual(firstTimestamp || 0)
      }, 1)
    })

    it('should set timestamp to current time', () => {
      const beforeTime = Date.now()
      setHealthError('timing-test', 'Test message')
      const afterTime = Date.now()
      const state = getHealthState()

      expect(state.errors['timing-test']?.timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(state.errors['timing-test']?.timestamp).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('clearHealthError', () => {
    it('should clear specific error by key', () => {
      setHealthError('error1', 'First error')
      setHealthError('error2', 'Second error')

      clearHealthError('error1')
      const state = getHealthState()

      expect(state.errors.error1).toBeUndefined()
      expect(state.errors.error2).toBeDefined()
      expect(state.isHealthy).toBe(false) // Still unhealthy due to error2
    })

    it('should not throw when clearing non-existent error', () => {
      expect(() => clearHealthError('non-existent')).not.toThrow()

      const state = getHealthState()
      expect(state.isHealthy).toBe(true)
    })

    it('should set healthy state when last error is cleared', () => {
      setHealthError('last-error', 'Last error')
      expect(getHealthState().isHealthy).toBe(false)

      clearHealthError('last-error')
      const state = getHealthState()

      expect(state.isHealthy).toBe(true)
      expect(state.errors).toEqual({})
    })

    it('should remain unhealthy when other errors exist', () => {
      setHealthError('error1', 'Error 1')
      setHealthError('error2', 'Error 2')

      clearHealthError('error1')
      const state = getHealthState()

      expect(state.isHealthy).toBe(false)
      expect(state.errors.error2).toBeDefined()
    })
  })

  describe('clearAllHealthErrors', () => {
    it('should clear all errors and set healthy state', () => {
      setHealthError('error1', 'Error 1')
      setHealthError('error2', 'Error 2', 'CODE_2')
      setHealthError('error3', 'Error 3')

      expect(getHealthState().isHealthy).toBe(false)
      expect(Object.keys(getHealthState().errors)).toHaveLength(3)

      clearAllHealthErrors()
      const state = getHealthState()

      expect(state.isHealthy).toBe(true)
      expect(state.errors).toEqual({})
    })

    it('should work correctly when no errors exist', () => {
      expect(() => clearAllHealthErrors()).not.toThrow()

      const state = getHealthState()
      expect(state.isHealthy).toBe(true)
      expect(state.errors).toEqual({})
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complex error management scenario', () => {
      // Start healthy
      expect(getHealthState().isHealthy).toBe(true)

      // Add database error
      setHealthError('database', 'DB connection failed', 'DB_ERROR')
      expect(getHealthState().isHealthy).toBe(false)

      // Add API error
      setHealthError('external-api', 'API timeout')
      const state1 = getHealthState()
      expect(state1.isHealthy).toBe(false)
      expect(Object.keys(state1.errors)).toHaveLength(2)

      // Fix database but API still down
      clearHealthError('database')
      const state2 = getHealthState()
      expect(state2.isHealthy).toBe(false)
      expect(state2.errors.database).toBeUndefined()
      expect(state2.errors['external-api']).toBeDefined()

      // Fix API - should be healthy again
      clearHealthError('external-api')
      const state3 = getHealthState()
      expect(state3.isHealthy).toBe(true)
      expect(state3.errors).toEqual({})
    })

    it('should handle rapid error changes correctly', () => {
      // Set multiple errors quickly
      setHealthError('rapid1', 'Error 1')
      setHealthError('rapid2', 'Error 2')
      setHealthError('rapid3', 'Error 3')

      // Clear all at once
      clearAllHealthErrors()

      // Set new error immediately
      setHealthError('new-error', 'New error after clear')

      const state = getHealthState()
      expect(state.isHealthy).toBe(false)
      expect(Object.keys(state.errors)).toHaveLength(1)
      expect(state.errors['new-error']).toBeDefined()
      expect(state.errors.rapid1).toBeUndefined()
    })

    it('should maintain state consistency across multiple operations', () => {
      const operations = [
        () => setHealthError('op1', 'Operation 1'),
        () => setHealthError('op2', 'Operation 2'),
        () => clearHealthError('op1'),
        () => setHealthError('op3', 'Operation 3'),
        () => clearHealthError('op2'),
        () => clearHealthError('op3'),
      ]

      operations.forEach(op => op())

      const finalState = getHealthState()
      expect(finalState.isHealthy).toBe(true)
      expect(finalState.errors).toEqual({})
    })
  })
})