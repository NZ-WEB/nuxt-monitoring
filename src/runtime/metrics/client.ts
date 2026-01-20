import {
  Counter,
  Gauge,
  Summary,
  collectDefaultMetrics,
  register,
} from 'prom-client'
import type { PrometheusOverride } from '../../module'

let initialized = false

const initMetrics = (override?: PrometheusOverride) => {
  if (initialized) {
    return
  }

  collectDefaultMetrics({
    register,
    prefix: override?.prefix,
    labels: override?.labels,
    gcDurationBuckets: override?.gcDurationBuckets,
    eventLoopMonitoringPrecision: override?.eventLoopMonitoringPrecision,
  })

  initialized = true
}

const defaultMetrics = {
  httpRequestTotal: new Counter({
    name: 'http_request_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'] as const,
  }),
  httpRequestDuration: new Summary({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'] as const,
    percentiles: [0.5, 0.9, 0.95, 0.99],
  }),
  activeRequests: new Gauge({
    name: 'http_active_requests',
    help: 'Number of active HTTP requests',
  }),
}

const collectMetrics = (
  labels: { method: string, route: string, statusCode: number },
  duration: number,
) => {
  defaultMetrics.httpRequestTotal.inc({
    method: labels.method,
    route: labels.route,
    status_code: labels.statusCode,
  })
  defaultMetrics.httpRequestDuration.observe(
    {
      method: labels.method,
      route: labels.route,
      status_code: labels.statusCode,
    },
    duration,
  )
}

export { defaultMetrics, collectMetrics, register, initMetrics }
