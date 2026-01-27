# nuxt-monitoring

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A Nuxt module for deep observability, providing separate debug server, health checks, and comprehensive metrics collection.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Features

- 🐞 &nbsp;Debug server for monitoring endpoints on a separate port
- 🩺 &nbsp;/health endpoint for health checks
- 🎯 &nbsp;Программный API для управления состоянием health check
- 🚀 &nbsp;/ready endpoint for readiness probes
- 📊 &nbsp;Standard metrics collection via prom-client
- ➕ &nbsp;Additional metrics collection
- ✨ &nbsp;Ability to collect custom metrics
- 🐢 &nbsp;Lazy loading of endpoints

## Additional Metrics

The module provides comprehensive metrics collection through the following categories:

### HTTP Request Metrics
The module automatically tracks key HTTP request metrics:

| Metric Name | Type | Labels | Description |
|------------|------|--------|-------------|
| `http_request_total` | Counter | `method`, `route`, `status_code` | Total number of HTTP requests |
| `http_request_duration_seconds` | Summary | `method`, `route`, `status_code` | Duration of HTTP requests in seconds |
| `http_active_requests` | Gauge | — | Number of active HTTP requests |

### Standard Node.js Runtime Metrics
Through integration with [`prom-client`](https://github.com/siimon/prom-client), the module automatically collects essential Node.js runtime metrics:
- CPU usage and utilization
- Memory usage (heap and system)
- Event loop lag and duration
- Garbage collection statistics
- Node.js version and process information
- OS-level metrics (platform, architecture, etc.)

### Custom Metrics
The module provides a flexible API for collecting custom metrics. Developers can define their own counters, gauges, histograms, and summaries to track application-specific business metrics or performance indicators.

All metrics are exposed in the standard Prometheus format and can be scraped by any Prometheus-compatible monitoring system.

## Quick Setup

Install the module:

```bash
npm install nuxt-monitoring
```

## Configuration

The module supports the following configuration options with these defaults:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-monitoring'],
  monitoring: {
    // Metrics collection (enabled by default)
    metrics: {
      enabled: true,
      path: '/metrics'
    },
    // Health check endpoint (enabled by default)
    healthCheck: {
      enabled: true,
      path: '/health'
    },
    // Readiness check endpoint (enabled by default)
    readyCheck: {
      enabled: true,
      path: '/ready'
    },
    // Debug server on separate port (disabled by default)
    debugServer: {
      enabled: false,
      port: 3001
    }
  }
})
```

You can customize any of these options. For example, to enable the debug server:

```ts
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

## Health Check API

Модуль предоставляет программный API для управления состоянием health check. Это позволяет вашему приложению сообщать о проблемах и автоматически переводить health check в состояние ошибки.

### Импорт функций

```ts
import {
  setHealthError,
  clearHealthError,
  getHealthState,
} from 'nuxt-monitoring'
```

### API функции

#### `setHealthError(key: string, message: string, code?: string): void`

Устанавливает ошибку health check по указанному ключу:

```ts
// Простая ошибка
setHealthError('database', 'Не удалось подключиться к базе данных')

// Ошибка с кодом
setHealthError('external-api', 'Timeout при вызове внешнего API', 'TIMEOUT_ERROR')
```

После установки ошибки, endpoint `/health` начнет возвращать HTTP статус 503 (Service Unavailable) с детальной информацией об ошибках.

#### `clearHealthError(key: string): void`

Очищает ошибку health check по указанному ключу:

```ts
clearHealthError('database')
```

Если после очистки ошибки других ошибок не остается, health check автоматически переходит в состояние "здоров" (HTTP 200).

#### `getHealthState()`

Возвращает текущее состояние health check:

```ts
const state = getHealthState()
console.log(state)
// {
//   isHealthy: false,
//   errors: {
//     'database': {
//       message: 'Не удалось подключиться к базе данных',
//       code: 'DB_CONNECTION_ERROR',
//       timestamp: 1643723400000
//     }
//   }
// }
```

### Примеры использования

#### Мониторинг подключения к базе данных

```ts
// В коде подключения к БД
export const connectToDatabase = async () => {
  try {
    await database.connect()
    clearHealthError('database') // Очищаем ошибку при успешном подключении
  } catch (error) {
    setHealthError('database', 'Не удалось подключиться к базе данных', 'DB_ERROR')
    throw error
  }
}
```

#### Мониторинг внешних сервисов

```ts
// В HTTP middleware или периодической задаче
export const checkExternalServices = async () => {
  try {
    await fetch('https://external-api.example.com/health')
    clearHealthError('external-api')
  } catch (error) {
    setHealthError('external-api', 'Внешний сервис недоступен', 'EXTERNAL_SERVICE_DOWN')
  }
}
```

#### Использование в server middleware

```ts
// server/middleware/health-monitoring.ts
export default defineEventHandler(async (event) => {
  // Проверяем критичные компоненты
  if (!await checkDatabaseConnection()) {
    setHealthError('database', 'База данных недоступна')
  } else {
    clearHealthError('database')
  }
})
```

### Поведение Health Check Endpoint

- **Здоровое состояние**: HTTP 200 с `{ "status": "ok" }`
- **Ошибка**: HTTP 503 с детальной информацией об ошибках

```json
{
  "status": "error",
  "errors": {
    "database": {
      "message": "Не удалось подключиться к базе данных",
      "code": "DB_ERROR",
      "timestamp": 1643723400000
    }
  }
}
```

## Contribution

<details>
  <summary>Local development</summary>
  
  ```bash
  # Install dependencies
  npm install
  
  # Generate type stubs
  npm run dev:prepare
  
  # Develop with the playground
  npm run dev
  
  # Build the playground
  npm run dev:build
  
  # Run ESLint
  npm run lint
  
  # Run Vitest
  npm run test
  npm run test:watch
  
  # Release new version
  npm run release
  ```

</details>

## License

MIT License - see [LICENSE](LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-monitoring/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-monitoring

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-monitoring.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-monitoring

[license-src]: https://img.shields.io/npm/l/nuxt-monitoring.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-monitoring

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com
