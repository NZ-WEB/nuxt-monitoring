# nuxt-monitoring

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A comprehensive Nuxt module for application observability providing debug server, health checks, and Prometheus metrics collection with CORS support.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
- [🏗 &nbsp;Installation](#installation)
- [⚙️ &nbsp;Configuration](#configuration)
- [🩺 &nbsp;Health Check API](#health-check-api)
- [🐞 &nbsp;Debug Server](#debug-server)
- [📊 &nbsp;Metrics Collection](#metrics-collection)
- [🛠 &nbsp;Development](#development)

## Features

- 🐞 &nbsp;**Debug Server** - Separate port for monitoring endpoints with CORS support
- 🩺 &nbsp;**Health Checks** - `/health` endpoint with programmatic state management
- 🚀 &nbsp;**Readiness Probes** - `/ready` endpoint for container orchestration
- 📊 &nbsp;**Prometheus Metrics** - Comprehensive HTTP and Node.js runtime metrics
- 🌐 &nbsp;**CORS Support** - Built-in cross-origin headers for all monitoring endpoints
- 🔧 &nbsp;**TypeScript** - Full type safety and IntelliSense support
- 🎯 &nbsp;**Programmatic API** - Manage health state from your application code
- ✨ &nbsp;**Custom Metrics** - Extend with your own application-specific metrics

## Installation

Install the module via npm, yarn, or pnpm:

```bash
# npm
npm install nuxt-monitoring

# yarn
yarn add nuxt-monitoring

# pnpm
pnpm add nuxt-monitoring
```

Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-monitoring']
})
```

## Configuration

### Basic Configuration

The module works with zero configuration but offers extensive customization:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-monitoring'],
  monitoring: {
    // Metrics endpoint configuration
    metrics: {
      enabled: true,        // Enable/disable metrics collection
      path: '/metrics'      // Endpoint path for Prometheus metrics
    },

    // Health check endpoint configuration
    healthCheck: {
      enabled: true,        // Enable/disable health checks
      path: '/health'       // Endpoint path for health checks
    },

    // Readiness probe configuration
    readyCheck: {
      enabled: true,        // Enable/disable readiness checks
      path: '/ready'        // Endpoint path for readiness probes
    },

    // Debug server configuration (optional)
    debugServer: {
      enabled: false,       // Enable separate debug server
      port: 3001           // Port for debug server
    }
  }
})
```

### Debug Server Mode

Enable the debug server to run monitoring endpoints on a separate port:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-monitoring'],
  monitoring: {
    debugServer: {
      enabled: true,
      port: 3001          // Monitoring endpoints available at http://localhost:3001
    }
  }
})
```

**Benefits of Debug Server:**
- Isolates monitoring traffic from application traffic
- Allows separate security policies for monitoring endpoints
- Enables monitoring even when main application is unresponsive
- Built-in CORS support for cross-origin monitoring dashboards

### Custom Endpoint Paths

Configure custom paths for monitoring endpoints:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-monitoring'],
  monitoring: {
    metrics: {
      path: '/custom-metrics'
    },
    healthCheck: {
      path: '/api/health'
    },
    readyCheck: {
      path: '/api/ready'
    }
  }
})
```

### Selective Endpoint Enabling

Disable specific endpoints as needed:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-monitoring'],
  monitoring: {
    metrics: { enabled: false },      // Disable metrics
    readyCheck: { enabled: false },   // Disable readiness checks
    healthCheck: { enabled: true }    // Keep only health checks
  }
})
```

## Health Check API

The module provides a robust programmatic API for health state management, enabling applications to report and track component health automatically.

### Available Functions

```ts
import {
  setHealthError,
  clearHealthError,
  clearAllHealthErrors,
  getHealthState,
  type HealthState,
  type HealthError,
  type HealthResponse
} from 'nuxt-monitoring'
```

### Core Functions

#### `setHealthError(key: string, message: string, code?: string): void`

Register a health error for a specific component or service:

```ts
// Basic error registration
setHealthError('database', 'Connection timeout')

// Error with custom error code
setHealthError('redis', 'Connection refused', 'ECONNREFUSED')

// Business logic error
setHealthError('payment-service', 'Payment gateway unreachable', 'GATEWAY_TIMEOUT')
```

**Parameters:**
- `key` (string): Unique identifier for the error component
- `message` (string): Human-readable error description
- `code` (string, optional): Machine-readable error code

#### `clearHealthError(key: string): void`

Remove a health error for a specific component:

```ts
// Clear database error when connection is restored
clearHealthError('database')

// Clear service error after successful health check
clearHealthError('payment-service')
```

#### `clearAllHealthErrors(): void`

Remove all health errors and reset to healthy state:

```ts
// Reset all health errors (use with caution)
clearAllHealthErrors()
```

#### `getHealthState(): HealthState`

Retrieve the current health state:

```ts
const healthState = getHealthState()
console.log(healthState)

// Example output:
// {
//   isHealthy: false,
//   errors: {
//     'database': {
//       message: 'Connection timeout',
//       code: 'TIMEOUT',
//       timestamp: 1640995200000
//     },
//     'redis': {
//       message: 'Connection refused',
//       code: 'ECONNREFUSED',
//       timestamp: 1640995260000
//     }
//   }
// }
```

### Health State Types

```ts
interface HealthError {
  message: string           // Error description
  code?: string            // Optional error code
  timestamp: number        // Unix timestamp when error occurred
}

interface HealthState {
  isHealthy: boolean                          // Overall health status
  errors: Record<string, HealthError>         // Map of component errors
}

interface HealthResponse {
  status: 'ok' | 'error'                     // HTTP response status
  errors?: Record<string, HealthError>        // Errors (only when status is 'error')
}
```

### Practical Usage Patterns

#### Database Connection Health

```ts
// server/plugins/database.ts
import { setHealthError, clearHealthError } from 'nuxt-monitoring'

export default nitroPlugin(async () => {
  try {
    await connectToDatabase()
    clearHealthError('database')
    console.log('Database connected successfully')
  } catch (error) {
    setHealthError('database', `Failed to connect: ${error.message}`, 'DB_CONNECTION_ERROR')
    console.error('Database connection failed')
  }
})
```

#### External Service Monitoring

```ts
// server/middleware/external-services.ts
export default defineEventHandler(async (event) => {
  // Only check external services every 30 seconds
  if (shouldCheckServices()) {
    await Promise.allSettled([
      checkPaymentGateway(),
      checkNotificationService(),
      checkFileStorage()
    ])
  }
})

async function checkPaymentGateway() {
  try {
    const response = await fetch('https://api.payment-gateway.com/health', {
      timeout: 5000
    })

    if (response.ok) {
      clearHealthError('payment-gateway')
    } else {
      setHealthError('payment-gateway', `HTTP ${response.status}`, 'HTTP_ERROR')
    }
  } catch (error) {
    setHealthError('payment-gateway', 'Service unreachable', 'NETWORK_ERROR')
  }
}
```

#### Application Startup Health

```ts
// server/plugins/startup-checks.ts
export default nitroPlugin(async () => {
  console.log('Running startup health checks...')

  // Check required environment variables
  const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL', 'API_SECRET']
  const missingEnvVars = requiredEnvVars.filter(key => !process.env[key])

  if (missingEnvVars.length > 0) {
    setHealthError('environment',
      `Missing required environment variables: ${missingEnvVars.join(', ')}`,
      'MISSING_ENV_VARS'
    )
  } else {
    clearHealthError('environment')
  }

  // Check disk space
  try {
    const stats = await checkDiskSpace()
    if (stats.freeSpacePercent < 10) {
      setHealthError('disk-space', 'Low disk space warning', 'LOW_DISK_SPACE')
    } else {
      clearHealthError('disk-space')
    }
  } catch (error) {
    setHealthError('disk-space', 'Unable to check disk space', 'DISK_CHECK_FAILED')
  }
})
```

#### Business Logic Health

```ts
// server/api/orders/process.post.ts
export default defineEventHandler(async (event) => {
  try {
    const order = await readBody(event)

    // Process order
    const result = await processOrder(order)

    // Clear any previous processing errors
    clearHealthError('order-processing')

    return { success: true, orderId: result.id }

  } catch (error) {
    // Set health error for failed order processing
    setHealthError('order-processing',
      `Order processing failed: ${error.message}`,
      'ORDER_PROCESSING_ERROR'
    )

    throw createError({
      statusCode: 500,
      statusMessage: 'Order processing failed'
    })
  }
})
```

### HTTP Endpoint Behavior

The health endpoint automatically reflects the current state:

#### Healthy Response (HTTP 200)
```json
{
  "status": "ok"
}
```

#### Unhealthy Response (HTTP 503)
```json
{
  "status": "error",
  "errors": {
    "database": {
      "message": "Connection timeout",
      "code": "TIMEOUT",
      "timestamp": 1640995200000
    },
    "payment-gateway": {
      "message": "Service unreachable",
      "code": "NETWORK_ERROR",
      "timestamp": 1640995260000
    }
  }
}
```

## Debug Server

The debug server feature allows you to run monitoring endpoints on a separate port, providing better isolation and security for your monitoring infrastructure.

### Configuration

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-monitoring'],
  monitoring: {
    debugServer: {
      enabled: true,
      port: 3001
    }
  }
})
```

### Available Endpoints

When the debug server is enabled, monitoring endpoints are available at:

- `http://localhost:3001/health` - Health check endpoint
- `http://localhost:3001/ready` - Readiness probe endpoint
- `http://localhost:3001/metrics` - Prometheus metrics endpoint

### Benefits

1. **Traffic Isolation**: Monitoring traffic doesn't interfere with application traffic
2. **Security**: Apply different security policies to monitoring endpoints
3. **Reliability**: Monitor application health even when main server is overloaded
4. **CORS Support**: Built-in cross-origin headers for dashboard integration
5. **Resource Control**: Dedicated resources for monitoring infrastructure

### Docker Integration

Perfect for containerized deployments:

```dockerfile
# Dockerfile
EXPOSE 3000 3001

# Start application with debug server
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"    # Application traffic
      - "3001:3001"    # Monitoring traffic

  prometheus:
    image: prom/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    configs:
      - source: prometheus_config
        target: /etc/prometheus/prometheus.yml

configs:
  prometheus_config:
    content: |
      scrape_configs:
        - job_name: 'nuxt-app'
          static_configs:
            - targets: ['app:3001']  # Scrape from debug server
```

### Kubernetes Integration

```yaml
# deployment.yaml
apiVersion: v1
kind: Service
metadata:
  name: app-monitoring
spec:
  selector:
    app: nuxt-app
  ports:
    - name: monitoring
      port: 3001
      targetPort: 3001
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nuxt-app
spec:
  template:
    spec:
      containers:
        - name: app
          image: nuxt-app:latest
          ports:
            - containerPort: 3000  # App traffic
            - containerPort: 3001  # Monitoring traffic
          readinessProbe:
            httpGet:
              path: /ready
              port: 3001
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
```

## Metrics Collection

The module automatically collects comprehensive application and runtime metrics in Prometheus format.

### Automatic HTTP Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `http_request_total` | Counter | `method`, `route`, `status_code` | Total number of HTTP requests |
| `http_request_duration_seconds` | Summary | `method`, `route`, `status_code` | Request duration in seconds |
| `http_active_requests` | Gauge | — | Number of currently active requests |

### Node.js Runtime Metrics

Through integration with [`prom-client`](https://github.com/siimon/prom-client), the module automatically collects:

- **Process Metrics**: CPU usage, memory consumption, uptime
- **Event Loop**: Event loop lag and utilization
- **Garbage Collection**: GC duration and frequency by type
- **Node.js Version**: Runtime version information
- **System Metrics**: Platform, architecture, load average

### Request Filtering

The module intelligently filters requests to avoid noise:

- **Skipped**: Nuxt internal requests (`/__nuxt/*`)
- **Skipped**: Static assets (`.js`, `.css`, `.png`, etc.)
- **Skipped**: Monitoring endpoints themselves (`/metrics`, `/health`, `/ready`)
- **Tracked**: All API routes and page requests

### Metrics Endpoint

Access Prometheus metrics at `/metrics` (or your configured path):

```
# HELP http_request_total Total number of HTTP requests
# TYPE http_request_total counter
http_request_total{method="GET",route="/api/users",status_code="200"} 145

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds summary
http_request_duration_seconds{method="GET",route="/api/users",status_code="200",quantile="0.5"} 0.023
http_request_duration_seconds{method="GET",route="/api/users",status_code="200",quantile="0.95"} 0.156
```

### Custom Metrics

Extend with your own application-specific metrics:

```ts
// server/plugins/custom-metrics.ts
import { register } from 'prom-client'

// Custom business metrics
const userRegistrations = new Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['method', 'status']
})

const orderValue = new Histogram({
  name: 'order_value_dollars',
  help: 'Distribution of order values',
  buckets: [10, 50, 100, 500, 1000, 5000]
})

// Register with the existing registry
register.registerMetric(userRegistrations)
register.registerMetric(orderValue)

export { userRegistrations, orderValue }
```

```ts
// server/api/auth/register.post.ts
import { userRegistrations } from '~/server/plugins/custom-metrics'

export default defineEventHandler(async (event) => {
  try {
    const user = await createUser(userData)

    // Track successful registration
    userRegistrations.inc({ method: 'email', status: 'success' })

    return { user }
  } catch (error) {
    // Track failed registration
    userRegistrations.inc({ method: 'email', status: 'error' })
    throw error
  }
})
```

## Development

### Project Setup

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd nuxt-monitoring
   npm install
   ```

2. **Prepare Development Environment**:
   ```bash
   # Generate type stubs and prepare module
   npm run dev:prepare
   ```

3. **Start Development Server**:
   ```bash
   # Start playground with hot reload
   npm run dev
   ```

The playground will be available at:
- **Application**: http://localhost:3000
- **Debug Server**: http://localhost:3001 (if enabled)

### Available Scripts

```bash
# Development
npm run dev              # Start development server with playground
npm run dev:build        # Build playground for production
npm run dev:prepare      # Prepare development environment

# Testing
npm test                 # Run test suite
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:ui          # Run tests with UI

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript type checking

# Build & Release
npm run build            # Build module for production
npm run release:patch    # Release patch version
npm run release:minor    # Release minor version
npm run release:major    # Release major version
```

### Development Workflow

1. **Make Changes**: Edit source files in `src/`
2. **Test Changes**: Use playground at http://localhost:3000
3. **Run Tests**: Ensure `npm test` passes
4. **Check Linting**: Ensure `npm run lint` passes
5. **Type Check**: Ensure `npm run typecheck` passes

### Testing

The module includes comprehensive tests covering:

- **Unit Tests**: Core functionality and API methods
- **Integration Tests**: Nuxt module integration
- **HTTP Tests**: Endpoint behavior and responses
- **Type Tests**: TypeScript type definitions

Run specific test suites:
```bash
# Run specific test file
npm test src/runtime/health/spec/state.spec.ts

# Run tests with specific pattern
npm test -- --grep "health"

# Run tests in watch mode with coverage
npm run test:watch -- --coverage
```

### Playground Features

The included playground demonstrates all module features:

- **Health Management**: Interactive health error setting/clearing
- **Endpoint Testing**: Test all monitoring endpoints
- **Debug Server**: Toggle between regular and debug server modes
- **Metrics Visualization**: View Prometheus metrics output
- **Status Indicators**: Visual feedback for endpoint responses

## CORS Support

All monitoring endpoints include CORS headers by default:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

This enables monitoring dashboards and external tools to access endpoints directly from browsers.

## License

MIT License - see [LICENSE](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

---

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-monitoring/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-monitoring

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-monitoring.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-monitoring

[license-src]: https://img.shields.io/npm/l/nuxt-monitoring.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-monitoring

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com
