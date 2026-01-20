import { defineEventHandler, getRequestURL } from 'h3'
import { useRuntimeConfig } from '#imports'
import { collectMetrics, defaultMetrics } from '../../metrics/client'
import { logger } from '../../logger'
import type { ModuleOptions } from '../../../module'

const staticAssetExtensions
  = /\.(ico|png|jpg|jpeg|gif|svg|css|js|map|woff|woff2|ttf|eot|txt|xml|json)$/i

const isStaticAsset = (url: URL) => staticAssetExtensions.test(url.pathname)

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const monitoringConfig = config.public.monitoring as ModuleOptions
  const url = getRequestURL(event)
  const route = url.pathname
  const startTime = process.hrtime.bigint()
  const originalEnd = event.node.res.end

  const isNuxtRequest = /^\/__/.test(route)
  const isMetricsPath = route === monitoringConfig.metrics.path
  const isHealthcheckPath = route === monitoringConfig.healthCheck.path
  const isReadycheckPath = route === monitoringConfig.readyCheck.path

  if (
    isNuxtRequest
    || isMetricsPath
    || isHealthcheckPath
    || isReadycheckPath
    || isStaticAsset(url)
  ) {
    return
  }

  defaultMetrics.activeRequests.inc()

  let metricsCollected = false

  event.node.res.end = function (
    chunk?: unknown,
    encoding?: BufferEncoding | (() => void),
    callback?: () => void,
  ) {
    if (!metricsCollected) {
      metricsCollected = true

      try {
        const endTime = process.hrtime.bigint()
        const durationMs = Number(endTime - startTime) / 1e6
        const durationSec = durationMs / 1000
        const statusCode = event.node.res.statusCode

        collectMetrics(
          { method: event.method, route, statusCode },
          durationSec,
        )
      }
      catch (error) {
        logger.error('Failed to collect metrics:', error)
      }
      finally {
        defaultMetrics.activeRequests.dec()
      }
    }

    event.node.res.end = originalEnd

    if (typeof encoding === 'function') {
      callback = encoding
      encoding = undefined
    }

    return originalEnd.call(
      this,
      chunk || undefined,
      encoding as BufferEncoding,
      callback || undefined,
    )
  }
})
