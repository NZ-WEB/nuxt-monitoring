import { defineNuxtModule, createResolver, addServerHandler } from "@nuxt/kit";
import { name, version } from "../package.json";

export interface MetricsConfig {
  enabled: boolean;
  path: string;
  defaultMetrics: {
    httpRequestTotal: boolean;
    httpRequestDuration: boolean;
    activeRequests: boolean;
  };
}

export interface HealthCheckConfig {
  enabled: boolean;
  path: string;
}

export interface ReadyCheckConfig {
  enabled: boolean;
  path: string;
}

export interface ModuleOptions {
  metrics: MetricsConfig;
  healthCheck: HealthCheckConfig;
  readyCheck: ReadyCheckConfig;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: "metrics",
  },
  defaults: {
    metrics: {
      enabled: true,
      path: "/metrics",
      defaultMetrics: {
        httpRequestTotal: true,
        httpRequestDuration: true,
        activeRequests: true,
      },
    },
    healthCheck: {
      enabled: true,
      path: "/health",
    },
    readyCheck: {
      enabled: true,
      path: "/ready",
    },
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    if (options.metrics?.enabled) {
      nuxt.options.runtimeConfig.public.metrics = {
        path: options.metrics.path,
      };

      addServerHandler({
        handler: resolver.resolve("./runtime/server/middleware/metrics"),
      });
      addServerHandler({
        route: options.metrics.path,
        handler: resolver.resolve("./runtime/server/routes/metrics.get"),
      });
    }
  },
});
