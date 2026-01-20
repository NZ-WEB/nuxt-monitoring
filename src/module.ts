import {
  defineNuxtModule,
  createResolver,
  addServerHandler,
  addServerPlugin,
  addTemplate,
  useNuxt,
} from '@nuxt/kit'
import { name, version } from '../package.json'
import { logger } from './runtime/logger'

export type {
  ReadinessCheck,
  ReadinessCheckResult,
} from './runtime/server/routes/ready'
export type { HealthState } from './runtime/server/routes/health'
export {
  setHealthError,
  clearHealthError,
  getHealthState,
} from './runtime/server/routes/health'

export interface DefaultItemConfig {
  enabled: boolean
  path: string
}

export type MetricsConfig = DefaultItemConfig
export type HealthCheckConfig = DefaultItemConfig
export interface ReadyCheckConfig extends DefaultItemConfig {
  checksFile?: string
}

export interface DebugServerConfig {
  enabled: boolean
  port: number
}

export interface ModuleConfig {
  metrics: MetricsConfig
  healthCheck: HealthCheckConfig
  readyCheck: ReadyCheckConfig
  debugServer: DebugServerConfig
}

export type ModuleOptions = {
  [K in keyof ModuleConfig]: Partial<ModuleConfig[K]>;
}

const defaults: ModuleConfig = {
  metrics: {
    enabled: true,
    path: '/metrics',
  },
  healthCheck: {
    enabled: true,
    path: '/health',
  },
  readyCheck: {
    enabled: true,
    path: '/ready',
  },
  debugServer: {
    enabled: false,
    port: 3001,
  },
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'monitoring',
  },
  defaults,
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    nuxt.options.runtimeConfig.public.monitoring = options

    if (options.metrics?.enabled) {
      logger.info('metrics enabled')
      addServerHandler({
        handler: resolver.resolve('./runtime/server/middleware/metrics'),
      })
    }

    if (options.readyCheck?.checksFile) {
      registerReadinessChecksPlugin(options.readyCheck.checksFile)
    }

    if (options.debugServer?.enabled) {
      registerDebugServer(resolver)
      return
    }

    registerDirectHandlers(resolver, options)
  },
})

const registerDebugServer = (resolver: ReturnType<typeof createResolver>) => {
  logger.info('debug server enabled')
  addServerPlugin(resolver.resolve('./runtime/plugins/debugServer'))
}

const registerReadinessChecksPlugin = (checksFile: string) => {
  logger.info(`readiness checks file: ${checksFile}`)

  const nuxt = useNuxt()
  const resolvedPath = checksFile.startsWith('~/')
    ? checksFile.replace('~/', `${nuxt.options.srcDir}/`)
    : checksFile

  const template = addTemplate({
    filename: 'monitoring-readiness-checks-plugin.ts',
    write: true,
    getContents: () => `
import { defineNitroPlugin } from 'nitropack/runtime'
import { registerReadinessCheck } from 'nuxt-monitoring/runtime/server/routes/ready'
import checks from '${resolvedPath}'

export default defineNitroPlugin(() => {
  if (Array.isArray(checks)) {
    checks.forEach(check => registerReadinessCheck(check))
  }
})
`,
  })

  addServerPlugin(template.dst)
}

const registerDirectHandlers = (
  resolver: ReturnType<typeof createResolver>,
  options: ModuleOptions,
) => {
  if (options.metrics?.enabled) {
    addServerHandler({
      route: options.metrics.path,
      handler: resolver.resolve('./runtime/server/routes/metrics.get'),
    })
  }

  if (options.healthCheck?.enabled) {
    logger.info('healthcheck enabled')
    addServerHandler({
      route: options.healthCheck.path,
      handler: resolver.resolve('./runtime/server/routes/health'),
    })
  }

  if (options.readyCheck?.enabled) {
    logger.info('readycheck enabled')
    addServerHandler({
      route: options.readyCheck.path,
      handler: resolver.resolve('./runtime/server/routes/ready'),
    })
  }
}
