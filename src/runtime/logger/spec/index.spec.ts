import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from '../index'

describe('Logger', () => {
  let consoleSpy: any

  beforeEach(() => {
    // Mock console methods to avoid actual console output during tests
    consoleSpy = {
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {})
    }
  })

  afterEach(() => {
    // Restore console methods after each test
    vi.restoreAllMocks()
  })

  describe('logger object', () => {
    it('should be defined and have expected methods', () => {
      expect(logger).toBeDefined()
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.success).toBe('function')
    })

    it('should have withTag method for creating tagged loggers', () => {
      expect(typeof logger.withTag).toBe('function')
    })

    it('should be a consola instance with nuxt-monitoring tag', () => {
      // The logger should have the tag property set
      expect(logger.options?.tag).toBe('nuxt-monitoring')
    })
  })

  describe('logging methods', () => {
    it('should call info method correctly', () => {
      const testMessage = 'Test info message'
      const testData = { key: 'value' }

      logger.info(testMessage, testData)

      // Since we're using consola with a tag, we can't easily mock the exact output
      // But we can test that the logger methods exist and are callable
      expect(() => logger.info(testMessage)).not.toThrow()
    })

    it('should call warn method correctly', () => {
      const testMessage = 'Test warning message'

      expect(() => logger.warn(testMessage)).not.toThrow()
    })

    it('should call error method correctly', () => {
      const testMessage = 'Test error message'
      const errorData = new Error('Test error')

      expect(() => logger.error(testMessage, errorData)).not.toThrow()
    })

    it('should call debug method correctly', () => {
      const testMessage = 'Test debug message'

      expect(() => logger.debug(testMessage)).not.toThrow()
    })

    it('should call success method correctly', () => {
      const testMessage = 'Test success message'

      expect(() => logger.success(testMessage)).not.toThrow()
    })

    it('should handle multiple arguments', () => {
      const message = 'Test message'
      const data1 = { id: 1 }
      const data2 = 'additional data'

      expect(() => logger.info(message, data1, data2)).not.toThrow()
    })

    it('should handle empty calls', () => {
      expect(() => logger.info()).not.toThrow()
      expect(() => logger.warn()).not.toThrow()
      expect(() => logger.error()).not.toThrow()
    })
  })

  describe('withTag method', () => {
    it('should create a new logger instance with additional tag', () => {
      const taggedLogger = logger.withTag('custom-tag')

      expect(taggedLogger).toBeDefined()
      expect(typeof taggedLogger.info).toBe('function')
      expect(typeof taggedLogger.warn).toBe('function')
      expect(typeof taggedLogger.error).toBe('function')
    })

    it('should allow chaining with additional tags', () => {
      const doubleTaggedLogger = logger.withTag('tag1').withTag('tag2')

      expect(doubleTaggedLogger).toBeDefined()
      expect(typeof doubleTaggedLogger.info).toBe('function')
    })

    it('should work with logging methods', () => {
      const taggedLogger = logger.withTag('test-tag')

      expect(() => taggedLogger.info('Tagged message')).not.toThrow()
      expect(() => taggedLogger.error('Tagged error')).not.toThrow()
    })
  })

  describe('logger integration scenarios', () => {
    it('should handle complex logging scenarios', () => {
      const scenarios = [
        () => logger.info('Application starting'),
        () => logger.debug('Debug information', { config: { port: 3000 } }),
        () => logger.warn('Deprecation warning'),
        () => logger.error('Something went wrong', new Error('Test error')),
        () => logger.success('Operation completed successfully'),
      ]

      scenarios.forEach(scenario => {
        expect(scenario).not.toThrow()
      })
    })

    it('should handle rapid consecutive logging calls', () => {
      const rapidCalls = Array.from({ length: 100 }, (_, i) =>
        () => logger.info(`Rapid log message ${i}`)
      )

      rapidCalls.forEach(call => {
        expect(call).not.toThrow()
      })
    })

    it('should handle various data types as arguments', () => {
      const testData = [
        'string',
        123,
        true,
        { object: 'value' },
        ['array', 'values'],
        null,
        undefined,
        new Date(),
        new Error('test error')
      ]

      testData.forEach(data => {
        expect(() => logger.info('Test with data:', data)).not.toThrow()
      })
    })

    it('should work with logger from different contexts', () => {
      // Test that logger can be imported and used in different contexts
      const contextualLogger = logger.withTag('context-specific')

      expect(() => {
        contextualLogger.info('Context message')
        contextualLogger.warn('Context warning')
        contextualLogger.error('Context error')
      }).not.toThrow()
    })
  })

  describe('logger properties and configuration', () => {
    it('should have proper configuration options', () => {
      expect(logger.options).toBeDefined()
      expect(logger.options.tag).toBe('nuxt-monitoring')
    })

    it('should maintain logger identity across imports', () => {
      // Re-import logger to test singleton behavior
      const { logger: reimportedLogger } = require('../index')

      // Should reference the same instance
      expect(reimportedLogger.options.tag).toBe(logger.options.tag)
    })

    it('should be extensible with additional functionality', () => {
      // Test that logger can be extended or wrapped
      const wrappedLogger = {
        ...logger,
        logWithTimestamp: (message: string) => {
          logger.info(`[${new Date().toISOString()}] ${message}`)
        }
      }

      expect(typeof wrappedLogger.logWithTimestamp).toBe('function')
      expect(() => wrappedLogger.logWithTimestamp('Timestamped message')).not.toThrow()
    })
  })
})