// Моки для #imports в тестовом окружении
export const useRuntimeConfig = () => ({
  public: {
    monitoring: {
      ready: true,
      metrics: { enabled: true, path: '/metrics' },
      healthCheck: { enabled: true, path: '/health' },
      readyCheck: { enabled: true, path: '/ready' },
    },
  },
})
