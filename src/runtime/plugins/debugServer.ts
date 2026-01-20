import { useRuntimeConfig } from '#imports'
import { defineNitroPlugin } from 'nitropack/runtime'
import { createApp, toNodeListener, type App } from 'h3'
import { createServer } from 'node:http'
import type { ModuleConfig } from '~/src/module'
import { logger } from '../logger'

export default defineNitroPlugin(async (nitroApp) => {
  const runtimeConfig = useRuntimeConfig()
  const config = runtimeConfig.public.monitoring as ModuleConfig
  const app = await createDebuggerApp(config)
  const server = createDebugServer(app, config)

  nitroApp.hooks.hook('close', () => {
    logger.info('closing alive server...')
    return new Promise<void>((resolve) => {
      server.close((error) => {
        if (error) {
          logger.error('error closing debug server:', error)
        }
        else {
          logger.log('debug server closed')
        }
        resolve()
      })
    })
  })
})

const createDebuggerApp = async (config: ModuleConfig) => {
  const app = createApp()

  if (config.healthCheck?.enabled) {
    logger.info('healthcheck enabled')
    const healthHandler = await import('../server/routes/health').then(
      r => r.default,
    )
    app.use(config.healthCheck.path, healthHandler)
  }

  if (config.readyCheck?.enabled) {
    logger.info('readycheck enabled')
    const readyHandler = await import('../server/routes/ready').then(
      r => r.default,
    )
    app.use(config.readyCheck.path, readyHandler)
  }

  if (config.metrics?.enabled) {
    const metricsHandler = await import('../server/routes/metrics.get').then(
      r => r.default,
    )
    app.use(config.metrics.path, metricsHandler)
  }

  return app
}

const createDebugServer = (app: App, config: ModuleConfig) => {
  const listener = toNodeListener(app)
  const debugServerInstance = createServer(listener)

  debugServerInstance.on('error', (error) => {
    logger.error('alive server error:', error)
  })

  debugServerInstance.listen(config.debugServer?.port, () => {
    logger.info(
      `debug server started http://localhost:${config.debugServer?.port}`,
    )
  })

  return {
    close: debugServerInstance.close.bind(debugServerInstance),
  }
}
