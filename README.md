# nuxt-monitoring

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A Nuxt module for deep observability, providing separate debug server, health checks, and comprehensive metrics collection.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Features

- 🖥️ &nbsp;**Debug Server**  
  Runs on a separate port (default: 3001), hosting `/health`, `/ready`, and `/metrics` endpoints independently from the main app. Supports HMR and graceful shutdown.
- 📊 &nbsp;**Metrics Collection**  
  Collects both standard Node.js runtime metrics and custom HTTP metrics:
  - Total HTTP requests (`http_request_total`)
  - Request duration (`http_request_duration_seconds`)
  - Active requests count (`http_active_requests`)
- ✅ &nbsp;**Health & Readiness Probes**  
  Configurable `/health` and `/ready` endpoints with custom paths.
- 🔧 &nbsp;**Flexible Configuration**  
  Enable/disable metrics, debug server, and customize endpoint paths.
- 🧩 &nbsp;**HMR & Graceful Shutdown**  
  Debug server integrates with Nuxt lifecycle and shuts down cleanly.

## Custom Metrics

The module collects the following HTTP metrics:

| Metric Name | Type | Labels | Description |
|------------|------|--------|-------------|
| `http_request_total` | Counter | `method`, `route`, `status_code` | Total number of HTTP requests |
| `http_request_duration_seconds` | Summary | `method`, `route`, `status_code` | Duration of HTTP requests in seconds |
| `http_active_requests` | Gauge | — | Number of active HTTP requests |

Additionally, the module automatically collects standard Node.js runtime metrics (CPU, memory, event loop, etc.) via [`prom-client`](https://github.com/siimon/prom-client).

## Quick Setup

Install the module:

```bash
npx nuxi module add nuxt-monitoring
```

## Configuration

Enable the debug server to expose metrics and health checks on a separate port:

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

Or, keep endpoints on the main server:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-monitoring'],
  monitoring: {
    metrics: {
      enabled: true,
      path: '/metrics'
    },
    healthCheck: {
      enabled: true,
      path: '/health'
    },
    readyCheck: {
      enabled: true,
      path: '/ready'
    }
  }
})
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