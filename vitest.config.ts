import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Test files patterns
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/playground/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],

    // Environment configuration
    environment: 'node',

    // Global test configuration
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,ts}'],
      exclude: [
        'src/**/*.spec.{js,ts}',
        'src/**/*.test.{js,ts}',
        'src/**/types.ts', // Type-only files
        'src/**/index.ts', // Simple re-export files
        '**/node_modules/**',
        '**/dist/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },

    // Test timeout
    testTimeout: 10000,

    // Hook timeout
    hookTimeout: 10000,

    // Run tests in sequence to avoid interference
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },

    // Reporter configuration
    reporter: ['verbose', 'json'],
    outputFile: 'test-results.json',

    // Setup files
    setupFiles: [],

    // Teardown files
    teardownTimeout: 5000,
  },

  // Resolve configuration
  resolve: {
    alias: {
      // Mock #imports for testing
      '#imports': new URL('./test/mocks/nuxt-imports.ts', import.meta.url).pathname
    }
  },

  // Define configuration
  define: {
    __TEST__: true
  }
})