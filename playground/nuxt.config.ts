export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  monitoring: {
    debugServer: {
      enabled: true,
      port: 3001,
    },
    readyCheck: {
      checksFile: '~/server/readiness-checks.ts',
    },
  },
})
