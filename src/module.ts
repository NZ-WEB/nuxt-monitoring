import {
  defineNuxtModule,
  createResolver,
  addServerHandler,
  addServerPlugin,
} from "@nuxt/kit";
import { name, version } from "../package.json";
import { logger } from "./runtime/logger";

export type DefaultItemConfig = {
  enabled: boolean;
  path: string;
};

export type MetricsConfig = DefaultItemConfig;
export type HealthCheckConfig = DefaultItemConfig;
export type ReadyCheckConfig = DefaultItemConfig;
export type DebugServerConfig = {
  enabled: boolean;
  port: number;
};

export interface ModuleConfig {
  metrics: MetricsConfig;
  healthCheck: HealthCheckConfig;
  readyCheck: ReadyCheckConfig;
  debugServer: DebugServerConfig;
}
export type ModuleOptions = {
  [K in keyof ModuleConfig]: Partial<ModuleConfig[K]>;
};

const defaults: ModuleConfig = {
  metrics: {
    enabled: false,
    path: "/metrics",
  },
  healthCheck: {
    enabled: false,
    path: "/health",
  },
  readyCheck: {
    enabled: false,
    path: "/ready",
  },
  debugServer: {
    enabled: false,
    port: 3001,
  },
};

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: "monitoring",
  },
  defaults,
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    nuxt.options.runtimeConfig.public.monitoring = options;

    if (options.metrics?.enabled) {
      logger.info("metrics enabled");
      addServerHandler({
        handler: resolver.resolve("./runtime/server/middleware/metrics"),
      });
    }

    if (options.debugServer?.enabled) {
      logger.info("debug server enabled");
      addServerPlugin(resolver.resolve("./runtime/plugins/debugServer"));
    } else {
      if (options.metrics?.enabled) {
        nuxt.options.runtimeConfig.public.metrics = {
          path: options.metrics.path,
        };
        addServerHandler({
          route: options.metrics.path,
          handler: resolver.resolve("./runtime/server/routes/metrics.get"),
        });
      }

      if (options.healthCheck?.enabled) {
        logger.info("healthcheck enabled");
        addServerHandler({
          route: options.healthCheck.path,
          handler: resolver.resolve("./runtime/server/routes/health"),
        });
      }

      if (options.readyCheck?.enabled) {
        logger.info("readycheck enabled on");
        addServerHandler({
          route: options.readyCheck.path,
          handler: resolver.resolve("./runtime/server/routes/ready"),
        });
      }
    }
  },
});

// Export health check API functions
export {
  setHealthError,
  clearHealthError,
  clearAllHealthErrors,
  getHealthState,
} from './runtime/health/state';

// Export health check types
export type {
  HealthError,
  HealthState,
  HealthResponse,
} from './runtime/health/types';
