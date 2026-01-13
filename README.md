# nuxt-metrics

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A Nuxt module for collecting server and client metrics, providing health checks, and enhancing observability in production applications.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Features

- 📊 &nbsp;Collects Prometheus-style metrics (HTTP requests, performance, custom counters)
- 🩺 &nbsp;Provides `/health` and `/ready` endpoints for liveness and readiness probes
- 📜 &nbsp;Integrated logging with structured output via `consola`
- 🛠️ &nbsp;Debug plugin for server-side development insights
- 🌐 &nbsp;Supports both server and client-side instrumentation

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add nuxt-metrics
```

That's it! The module automatically sets up:
- Metrics collection middleware
- `/metrics` endpoint (Prometheus format)
- `/health` and `/ready` status endpoints
- Server-side logging infrastructure

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-metrics/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-metrics

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-metrics.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-metrics

[license-src]: https://img.shields.io/npm/l/nuxt-metrics.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-metrics

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com