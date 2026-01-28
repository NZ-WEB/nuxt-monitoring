import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the dependencies before importing the module
vi.mock('@nuxt/kit', () => ({
  defineNuxtModule: vi.fn(),
  createResolver: vi.fn(),
  addServerHandler: vi.fn(),
  addServerPlugin: vi.fn()
}))

vi.mock('./runtime/logger', () => ({
  logger: {
    info: vi.fn()
  }
}))

vi.mock('./runtime/health/state', () => ({
  setHealthError: vi.fn(),
  clearHealthError: vi.fn(),
  clearAllHealthErrors: vi.fn(),
  getHealthState: vi.fn()
}))

describe('Main Module', () => {
  let moduleDefinition: any
  let mockDefineNuxtModule: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock for defineNuxtModule
    const { defineNuxtModule } = require('@nuxt/kit')
    mockDefineNuxtModule = defineNuxtModule

    // Mock defineNuxtModule to capture the module definition
    mockDefineNuxtModule.mockImplementation((definition) => {
      moduleDefinition = definition
      return definition
    })

    // Re-import module after mocks are set up
    delete require.cache[require.resolve('../module')]
    require('../module')
  })

  describe('Module metadata', () => {
    it('should have correct meta configuration', () => {
      expect(moduleDefinition.meta).toBeDefined()
      expect(moduleDefinition.meta.configKey).toBe('monitoring')
      expect(moduleDefinition.meta.name).toBeDefined()
      expect(moduleDefinition.meta.version).toBeDefined()
    })

    it('should have default configuration', () => {
      expect(moduleDefinition.defaults).toBeDefined()
      expect(moduleDefinition.defaults.metrics).toEqual({
        enabled: true,
        path: '/metrics'
      })
      expect(moduleDefinition.defaults.healthCheck).toEqual({
        enabled: true,
        path: '/health'
      })
      expect(moduleDefinition.defaults.readyCheck).toEqual({
        enabled: true,
        path: '/ready'
      })
      expect(moduleDefinition.defaults.debugServer).toEqual({
        enabled: false,
        port: 3001
      })
    })

    it('should have setup function', () => {
      expect(moduleDefinition.setup).toBeDefined()
      expect(typeof moduleDefinition.setup).toBe('function')
    })
  })

  describe('Type exports', () => {
    it('should export DefaultItemConfig type', async () => {
      // Import types to verify they exist
      const moduleTypes = await import('../module')

      // We can't directly test TypeScript types at runtime,
      // but we can verify the module exports are structured correctly
      expect(moduleTypes).toBeDefined()
    })

    it('should export configuration types', async () => {
      const moduleTypes = await import('../module')

      // These would be available as TypeScript types
      // Runtime verification that exports exist
      expect(moduleTypes.default).toBeDefined()
    })
  })

  describe('Health check function re-exports', () => {
    it('should re-export health check functions', async () => {
      const {
        setHealthError,
        clearHealthError,
        clearAllHealthErrors,
        getHealthState
      } = await import('../module')

      expect(setHealthError).toBeDefined()
      expect(clearHealthError).toBeDefined()
      expect(clearAllHealthErrors).toBeDefined()
      expect(getHealthState).toBeDefined()

      expect(typeof setHealthError).toBe('function')
      expect(typeof clearHealthError).toBe('function')
      expect(typeof clearAllHealthErrors).toBe('function')
      expect(typeof getHealthState).toBe('function')
    })

    it('should call underlying health state functions', async () => {
      const { setHealthError, clearHealthError, clearAllHealthErrors, getHealthState } = await import('../module')
      const healthStateMock = await import('./runtime/health/state')

      setHealthError('test', 'Test message', 'TEST_CODE')
      expect(healthStateMock.setHealthError).toHaveBeenCalledWith('test', 'Test message', 'TEST_CODE')

      clearHealthError('test')
      expect(healthStateMock.clearHealthError).toHaveBeenCalledWith('test')

      clearAllHealthErrors()
      expect(healthStateMock.clearAllHealthErrors).toHaveBeenCalled()

      getHealthState()
      expect(healthStateMock.getHealthState).toHaveBeenCalled()
    })
  })

  describe('Module setup function', () => {
    let mockOptions: any
    let mockNuxt: any
    let mockResolver: any

    beforeEach(() => {
      const { createResolver, addServerHandler, addServerPlugin } = require('@nuxt/kit')

      mockResolver = {
        resolve: vi.fn().mockImplementation((path) => `resolved-${path}`)
      }
      createResolver.mockReturnValue(mockResolver)

      mockOptions = {
        metrics: { enabled: true, path: '/metrics' },
        healthCheck: { enabled: true, path: '/health' },
        readyCheck: { enabled: true, path: '/ready' },
        debugServer: { enabled: false, port: 3001 }
      }

      mockNuxt = {
        options: {
          runtimeConfig: {
            public: {}
          }
        }
      }
    })

    it('should configure runtime config', async () => {
      await moduleDefinition.setup(mockOptions, mockNuxt)

      expect(mockNuxt.options.runtimeConfig.public.monitoring).toEqual(mockOptions)
    })

    it('should add metrics middleware when metrics enabled', async () => {
      const { addServerHandler } = require('@nuxt/kit')

      await moduleDefinition.setup(mockOptions, mockNuxt)

      expect(addServerHandler).toHaveBeenCalledWith({
        handler: 'resolved-./runtime/server/middleware/metrics'
      })
    })

    it('should add debug server plugin when debug server enabled', async () => {
      const { addServerPlugin } = require('@nuxt/kit')

      const optionsWithDebug = {
        ...mockOptions,
        debugServer: { enabled: true, port: 3001 }
      }

      await moduleDefinition.setup(optionsWithDebug, mockNuxt)

      expect(addServerPlugin).toHaveBeenCalledWith('resolved-./runtime/plugins/debugServer')
    })

    it('should add individual handlers when debug server disabled', async () => {
      const { addServerHandler } = require('@nuxt/kit')

      await moduleDefinition.setup(mockOptions, mockNuxt)

      // Should add metrics middleware
      expect(addServerHandler).toHaveBeenCalledWith({
        handler: 'resolved-./runtime/server/middleware/metrics'
      })

      // Should add metrics route
      expect(addServerHandler).toHaveBeenCalledWith({
        route: '/metrics',
        handler: 'resolved-./runtime/server/routes/metrics.get'
      })

      // Should add health route
      expect(addServerHandler).toHaveBeenCalledWith({
        route: '/health',
        handler: 'resolved-./runtime/server/routes/health'
      })

      // Should add ready route
      expect(addServerHandler).toHaveBeenCalledWith({
        route: '/ready',
        handler: 'resolved-./runtime/server/routes/ready'
      })
    })

    it('should respect disabled configurations', async () => {
      const { addServerHandler } = require('@nuxt/kit')

      const disabledOptions = {
        metrics: { enabled: false, path: '/metrics' },
        healthCheck: { enabled: false, path: '/health' },
        readyCheck: { enabled: false, path: '/ready' },
        debugServer: { enabled: false, port: 3001 }
      }

      await moduleDefinition.setup(disabledOptions, mockNuxt)

      // Should not add any handlers when all disabled
      expect(addServerHandler).not.toHaveBeenCalled()
    })

    it('should handle partial configuration', async () => {
      const { addServerHandler } = require('@nuxt/kit')

      const partialOptions = {
        metrics: { enabled: true, path: '/custom-metrics' },
        healthCheck: { enabled: false, path: '/health' },
        readyCheck: { enabled: true, path: '/custom-ready' },
        debugServer: { enabled: false, port: 3001 }
      }

      await moduleDefinition.setup(partialOptions, mockNuxt)

      // Should add metrics middleware
      expect(addServerHandler).toHaveBeenCalledWith({
        handler: 'resolved-./runtime/server/middleware/metrics'
      })

      // Should add metrics route with custom path
      expect(addServerHandler).toHaveBeenCalledWith({
        route: '/custom-metrics',
        handler: 'resolved-./runtime/server/routes/metrics.get'
      })

      // Should NOT add health route (disabled)
      expect(addServerHandler).not.toHaveBeenCalledWith(
        expect.objectContaining({
          route: '/health'
        })
      )

      // Should add ready route with custom path
      expect(addServerHandler).toHaveBeenCalledWith({
        route: '/custom-ready',
        handler: 'resolved-./runtime/server/routes/ready'
      })
    })

    it('should set metrics runtime config when metrics enabled', async () => {
      await moduleDefinition.setup(mockOptions, mockNuxt)

      expect(mockNuxt.options.runtimeConfig.public.metrics).toEqual({
        path: '/metrics'
      })
    })

    it('should log appropriate messages', async () => {
      const { logger } = require('./runtime/logger')

      await moduleDefinition.setup(mockOptions, mockNuxt)

      expect(logger.info).toHaveBeenCalledWith('metrics enabled')
      expect(logger.info).toHaveBeenCalledWith('healthcheck enabled')
      expect(logger.info).toHaveBeenCalledWith('readycheck enabled on')
    })

    it('should prioritize debug server over individual handlers', async () => {
      const { addServerHandler, addServerPlugin } = require('@nuxt/kit')

      const debugServerOptions = {
        ...mockOptions,
        debugServer: { enabled: true, port: 3001 }
      }

      await moduleDefinition.setup(debugServerOptions, mockNuxt)

      // Should add debug server plugin
      expect(addServerPlugin).toHaveBeenCalledWith('resolved-./runtime/plugins/debugServer')

      // Should NOT add individual route handlers
      expect(addServerHandler).not.toHaveBeenCalledWith(
        expect.objectContaining({ route: expect.any(String) })
      )

      // Should still add metrics middleware
      expect(addServerHandler).toHaveBeenCalledWith({
        handler: 'resolved-./runtime/server/middleware/metrics'
      })
    })
  })

  describe('Configuration validation', () => {
    it('should handle missing optional configuration properties', async () => {
      const minimalOptions = {}

      await expect(moduleDefinition.setup(minimalOptions, {
        options: { runtimeConfig: { public: {} } }
      })).resolves.not.toThrow()
    })

    it('should handle undefined configuration values', async () => {
      const optionsWithUndefined = {
        metrics: undefined,
        healthCheck: undefined,
        readyCheck: undefined,
        debugServer: undefined
      }

      await expect(moduleDefinition.setup(optionsWithUndefined, {
        options: { runtimeConfig: { public: {} } }
      })).resolves.not.toThrow()
    })

    it('should handle custom paths correctly', async () => {
      const { addServerHandler } = require('@nuxt/kit')

      const customPaths = {
        metrics: { enabled: true, path: '/custom/metrics' },
        healthCheck: { enabled: true, path: '/custom/health' },
        readyCheck: { enabled: true, path: '/custom/ready' },
        debugServer: { enabled: false, port: 3001 }
      }

      await moduleDefinition.setup(customPaths, mockNuxt)

      expect(addServerHandler).toHaveBeenCalledWith({
        route: '/custom/metrics',
        handler: 'resolved-./runtime/server/routes/metrics.get'
      })

      expect(addServerHandler).toHaveBeenCalledWith({
        route: '/custom/health',
        handler: 'resolved-./runtime/server/routes/health'
      })

      expect(addServerHandler).toHaveBeenCalledWith({
        route: '/custom/ready',
        handler: 'resolved-./runtime/server/routes/ready'
      })
    })
  })
})