export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  monitoring: {
    metrics: {
      override: {
        prefix: 'myapp_',
        labels: { app: 'playground', env: 'development' },
        eventLoopMonitoringPrecision: 10,
      },
    },
    debugServer: {
      enabled: true,
      port: 3001,
    },
    readyCheck: {
      checksFile: '~/server/readiness-checks.ts',
    },
  },
})
