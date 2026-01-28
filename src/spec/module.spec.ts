import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineNuxtModule, createResolver, addServerHandler, addServerPlugin } from '@nuxt/kit'
import { setHealthError, clearHealthError, clearAllHealthErrors, getHealthState } from '../runtime/health/state'
import { logger } from '../runtime/logger/index'

// Mock the dependencies before importing the module
vi.mock('@nuxt/kit', () => ({
  defineNuxtModule: vi.fn(),
  createResolver: vi.fn(() => ({ resolve: vi.fn() })),
  addServerHandler: vi.fn(),
  addServerPlugin: vi.fn()
}))

vi.mock('../runtime/logger/index', () => ({
  logger: {
    info: vi.fn()
  }
}))

vi.mock('../runtime/health/state', () => ({
  setHealthError: vi.fn(),
  clearHealthError: vi.fn(),
  clearAllHealthErrors: vi.fn(),
  getHealthState: vi.fn()
}))

describe('Main Module', () => {
  let moduleDefinition: any
  let mockDefineNuxtModule: any
  let mockedCreateResolver: any
  let mockedAddServerHandler: any
  let mockedAddServerPlugin: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mocked functions
    mockDefineNuxtModule = vi.mocked(defineNuxtModule)
    mockedCreateResolver = vi.mocked(createResolver)
    mockedAddServerHandler = vi.mocked(addServerHandler)
    mockedAddServerPlugin = vi.mocked(addServerPlugin)

    // Mock defineNuxtModule to capture the module definition
    mockDefineNuxtModule.mockImplementation((definition: any) => {
      moduleDefinition = definition
      return definition
    })

    // Re-import module after mocks are set up
    await import('../module')
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
      const { setHealthError: moduleSetHealthError, clearHealthError: moduleClearHealthError,
              clearAllHealthErrors: moduleClearAllHealthErrors, getHealthState: moduleGetHealthState } = await import('../module')

      const mockedSetHealthError = vi.mocked(setHealthError)
      const mockedClearHealthError = vi.mocked(clearHealthError)
      const mockedClearAllHealthErrors = vi.mocked(clearAllHealthErrors)
      const mockedGetHealthState = vi.mocked(getHealthState)

      moduleSetHealthError('test', 'Test message', 'TEST_CODE')
      expect(mockedSetHealthError).toHaveBeenCalledWith('test', 'Test message', 'TEST_CODE')

      moduleClearHealthError('test')
      expect(mockedClearHealthError).toHaveBeenCalledWith('test')

      moduleClearAllHealthErrors()
      expect(mockedClearAllHealthErrors).toHaveBeenCalled()

      moduleGetHealthState()
      expect(mockedGetHealthState).toHaveBeenCalled()
    })
  })

  describe('Module setup function', () => {
    let mockOptions: any
    let mockNuxt: any
    let mockResolver: any

    beforeEach(() => {
      mockResolver = {
        resolve: vi.fn().mockImplementation((path) => `resolved-${path}`)
      }
      mockedCreateResolver.mockReturnValue(mockResolver)

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
      await moduleDefinition.setup(mockOptions, mockNuxt)

      expect(mockedAddServerHandler).toHaveBeenCalledWith({
        handler: 'resolved-./runtime/server/middleware/metrics'
      })
    })

    it('should add debug server plugin when debug server enabled', async () => {
      const optionsWithDebug = {
        ...mockOptions,
        debugServer: { enabled: true, port: 3001 }
      }

      await moduleDefinition.setup(optionsWithDebug, mockNuxt)

      expect(mockedAddServerPlugin).toHaveBeenCalledWith('resolved-./runtime/plugins/debugServer')
    })

    it('should add individual handlers when debug server disabled', async () => {
      await moduleDefinition.setup(mockOptions, mockNuxt)

      // Should add metrics middleware
      expect(mockedAddServerHandler).toHaveBeenCalledWith({
        handler: 'resolved-./runtime/server/middleware/metrics'
      })

      // Should add metrics route
      expect(mockedAddServerHandler).toHaveBeenCalledWith({
        route: '/metrics',
        handler: 'resolved-./runtime/server/routes/metrics.get'
      })

      // Should add health route
      expect(mockedAddServerHandler).toHaveBeenCalledWith({
        route: '/health',
        handler: 'resolved-./runtime/server/routes/health'
      })

      // Should add ready route
      expect(mockedAddServerHandler).toHaveBeenCalledWith({
        route: '/ready',
        handler: 'resolved-./runtime/server/routes/ready'
      })
    })

    it('should respect disabled configurations', async () => {
      const disabledOptions = {
        metrics: { enabled: false, path: '/metrics' },
        healthCheck: { enabled: false, path: '/health' },
        readyCheck: { enabled: false, path: '/ready' },
        debugServer: { enabled: false, port: 3001 }
      }

      await moduleDefinition.setup(disabledOptions, mockNuxt)

      // Should not add any handlers when all disabled
      expect(mockedAddServerHandler).not.toHaveBeenCalled()
    })

    it('should handle partial configuration', async () => {
      const partialOptions = {
        metrics: { enabled: true, path: '/custom-metrics' },
        healthCheck: { enabled: false, path: '/health' },
        readyCheck: { enabled: true, path: '/custom-ready' },
        debugServer: { enabled: false, port: 3001 }
      }

      await moduleDefinition.setup(partialOptions, mockNuxt)

      // Should add metrics middleware
      expect(mockedAddServerHandler).toHaveBeenCalledWith({
        handler: 'resolved-./runtime/server/middleware/metrics'
      })

      // Should add metrics route with custom path
      expect(mockedAddServerHandler).toHaveBeenCalledWith({
        route: '/custom-metrics',
        handler: 'resolved-./runtime/server/routes/metrics.get'
      })

      // Should NOT add health route (disabled)
      expect(mockedAddServerHandler).not.toHaveBeenCalledWith(
        expect.objectContaining({
          route: '/health'
        })
      )

      // Should add ready route with custom path
      expect(mockedAddServerHandler).toHaveBeenCalledWith({
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
      const mockedLogger = vi.mocked(logger)

      await moduleDefinition.setup(mockOptions, mockNuxt)

      expect(mockedLogger.info).toHaveBeenCalledWith('metrics enabled')
      expect(mockedLogger.info).toHaveBeenCalledWith('healthcheck enabled')
      expect(mockedLogger.info).toHaveBeenCalledWith('readycheck enabled on')
    })

    it('should prioritize debug server over individual handlers', async () => {
      const debugServerOptions = {
        ...mockOptions,
        debugServer: { enabled: true, port: 3001 }
      }

      await moduleDefinition.setup(debugServerOptions, mockNuxt)

      // Should add debug server plugin
      expect(mockedAddServerPlugin).toHaveBeenCalledWith('resolved-./runtime/plugins/debugServer')

      // Should NOT add individual route handlers
      expect(mockedAddServerHandler).not.toHaveBeenCalledWith(
        expect.objectContaining({ route: expect.any(String) })
      )

      // Should still add metrics middleware
      expect(mockedAddServerHandler).toHaveBeenCalledWith({
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
        metrics: null,
        healthCheck: null,
        readyCheck: null,
        debugServer: null
      }

      await expect(moduleDefinition.setup(optionsWithUndefined, {
        options: { runtimeConfig: { public: {} } }
      })).resolves.not.toThrow()
    })

    it('should handle custom paths correctly', async () => {
      const customPaths = {
        metrics: { enabled: true, path: '/custom/metrics' },
        healthCheck: { enabled: true, path: '/custom/health' },
        readyCheck: { enabled: true, path: '/custom/ready' },
        debugServer: { enabled: false, port: 3001 }
      }

      await moduleDefinition.setup(customPaths, {
        options: { runtimeConfig: { public: {} } }
      })

      expect(mockedAddServerHandler).toHaveBeenCalledWith({
        route: '/custom/metrics',
        handler: 'resolved-./runtime/server/routes/metrics.get'
      })

      expect(mockedAddServerHandler).toHaveBeenCalledWith({
        route: '/custom/health',
        handler: 'resolved-./runtime/server/routes/health'
      })

      expect(mockedAddServerHandler).toHaveBeenCalledWith({
        route: '/custom/ready',
        handler: 'resolved-./runtime/server/routes/ready'
      })
    })
  })
})