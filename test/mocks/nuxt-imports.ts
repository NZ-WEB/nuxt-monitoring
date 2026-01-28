// Mock implementation of Nuxt runtime imports for testing

/**
 * Mock implementation of useRuntimeConfig
 * Returns a configurable runtime config for testing
 */
export const useRuntimeConfig = () => ({
  public: {
    monitoring: {
      metrics: { path: '/metrics' },
      healthCheck: { path: '/health' },
      readyCheck: { path: '/ready' }
    }
  }
})

/**
 * Mock implementation of other Nuxt imports that might be needed
 */
export const navigateTo = (url: string) => {
  console.log(`Mock navigateTo: ${url}`)
}

export const useState = (key: string, init?: () => any) => {
  const state = init ? init() : undefined
  return {
    value: state
  }
}

export const useCookie = (name: string) => {
  return {
    value: undefined
  }
}

export const useRoute = () => ({
  params: {},
  query: {},
  path: '/',
  name: 'index'
})

export const useRouter = () => ({
  push: (route: string) => console.log(`Mock router push: ${route}`),
  replace: (route: string) => console.log(`Mock router replace: ${route}`),
  go: (delta: number) => console.log(`Mock router go: ${delta}`),
  back: () => console.log('Mock router back'),
  forward: () => console.log('Mock router forward')
})

// Export all functions for easier importing
export default {
  useRuntimeConfig,
  navigateTo,
  useState,
  useCookie,
  useRoute,
  useRouter
}