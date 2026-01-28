# Test Suite

This directory contains the test configuration and mocks for the nuxt-monitoring module test suite.

## Structure

```
test/
├── mocks/
│   └── nuxt-imports.ts    # Mock implementations of Nuxt runtime imports
└── README.md              # This file
```

## Test Organization

Tests are organized following the project structure, with each test file located in a `spec/` subdirectory next to the source file:

```
src/
├── module.ts
├── spec/
│   └── module.spec.ts
└── runtime/
    ├── health/
    │   ├── state.ts
    │   ├── types.ts
    │   └── spec/
    │       ├── state.spec.ts
    │       └── types.spec.ts
    ├── metrics/
    │   ├── client.ts
    │   └── spec/
    │       └── client.spec.ts
    ├── logger/
    │   ├── index.ts
    │   └── spec/
    │       └── index.spec.ts
    └── server/
        ├── middleware/
        │   ├── metrics.ts
        │   └── spec/
        │       └── metrics.spec.ts
        └── routes/
            ├── health.ts
            ├── ready.ts
            ├── metrics.get.ts
            └── spec/
                ├── health.spec.ts
                ├── ready.spec.ts
                └── metrics.get.spec.ts
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests once
npm run test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with interactive UI
npm run test:ui
```

### Advanced Test Commands

```bash
# Run specific test file
npx vitest run src/runtime/health/spec/state.spec.ts

# Run tests matching pattern
npx vitest run --grep "health check"

# Run tests in specific directory
npx vitest run src/runtime/health/

# Run with verbose output
npx vitest run --reporter=verbose
```

## Test Categories

### 1. Unit Tests

**Location**: `src/**/spec/*.spec.ts`

Test individual functions and modules in isolation:

- **Health State Management** (`src/runtime/health/spec/state.spec.ts`)
  - `setHealthError()`, `clearHealthError()`, `getHealthState()` functions
  - State consistency and edge cases
  - Concurrent operations

- **Metrics Collection** (`src/runtime/metrics/spec/client.spec.ts`)
  - `collectMetrics()` function
  - Prometheus metrics objects
  - Duration calculations and label handling

- **Logger** (`src/runtime/logger/spec/index.spec.ts`)
  - Logger object functionality
  - Different logging levels
  - Tagged logger creation

- **Type Definitions** (`src/runtime/health/spec/types.spec.ts`)
  - TypeScript interface validation
  - Type compatibility testing
  - Edge case handling

### 2. Integration Tests

**Location**: `src/runtime/server/**/spec/*.spec.ts`

Test HTTP handlers and middleware:

- **Health Endpoint** (`src/runtime/server/routes/spec/health.spec.ts`)
  - HTTP status codes (200 for healthy, 503 for unhealthy)
  - Response structure validation
  - Integration with health state

- **Ready Endpoint** (`src/runtime/server/routes/spec/ready.spec.ts`)
  - Simple "OK" response validation
  - Performance under load

- **Metrics Endpoint** (`src/runtime/server/routes/spec/metrics.get.spec.ts`)
  - Prometheus format validation
  - Content-Type headers
  - Integration with metrics register

- **Metrics Middleware** (`src/runtime/server/middleware/spec/metrics.spec.ts`)
  - Request filtering (static assets, internal routes)
  - Duration measurement
  - Active request counting
  - Response wrapping

### 3. Module Tests

**Location**: `src/spec/module.spec.ts`

Test the main Nuxt module:

- Module configuration and defaults
- Handler registration logic
- Debug server vs individual endpoints
- Runtime configuration setup

## Test Configuration

Tests use Vitest with the following configuration:

- **Environment**: Node.js
- **Coverage**: v8 provider with 80% threshold
- **Timeout**: 10 seconds for tests
- **Pool**: Forks with single fork to avoid interference
- **Mocks**: Nuxt imports mocked for testing environment

## Coverage Goals

The test suite aims for:

- **80% line coverage** minimum
- **80% branch coverage** minimum
- **80% function coverage** minimum
- **100% coverage** for critical functions (health state, metrics collection)

## Writing New Tests

When adding new functionality:

1. **Create test file** in `spec/` subdirectory next to source file
2. **Name test file** as `<source-file-name>.spec.ts`
3. **Write English comments** and descriptions
4. **Follow existing patterns** for consistency
5. **Include edge cases** and error scenarios
6. **Test both happy path and error conditions**
7. **Run tests** and fix any failures before committing

### Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { yourFunction } from '../your-module'

describe('Your Module', () => {
  beforeEach(() => {
    // Reset state before each test
    vi.clearAllMocks()
  })

  describe('yourFunction', () => {
    it('should do expected behavior', () => {
      // Arrange
      const input = 'test input'

      // Act
      const result = yourFunction(input)

      // Assert
      expect(result).toBe('expected output')
    })

    it('should handle edge cases', () => {
      // Test edge cases, errors, etc.
    })
  })
})
```

## Mocking Guidelines

### External Dependencies

Use `vi.mock()` to mock external dependencies:

```typescript
vi.mock('@nuxt/kit', () => ({
  defineNuxtModule: vi.fn(),
  createResolver: vi.fn(),
  addServerHandler: vi.fn()
}))
```

### Internal Modules

Mock internal modules when testing in isolation:

```typescript
vi.mock('./other-module', () => ({
  someFunction: vi.fn().mockReturnValue('mocked value')
}))
```

### Runtime Imports

Use the provided mock in `test/mocks/nuxt-imports.ts` for Nuxt runtime imports.

## Continuous Integration

Tests are run automatically:

- **On push** to any branch
- **Before releases** (in release scripts)
- **In pull requests**

All tests must pass before merging or releasing.