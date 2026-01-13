import { defineNitroPlugin, useRuntimeConfig } from "#imports";
import { createApp, toNodeListener, type App } from "h3";
import { createServer } from "node:http";
import healthHandler from "../server/routes/health";
import readyHandler from "../server/routes/ready";
import metricsHandler from "../server/routes/metrics.get";
import type { ModuleOptions } from "~/src/module";
import { logger } from "../logger";

export default defineNitroPlugin((nitroApp) => {
  const runtimeConfig = useRuntimeConfig();
  const config = runtimeConfig.public.monitoring as ModuleOptions;
  const app = createDebuggerApp(config);
  const server = createDebugServer(app, config);

  nitroApp.hooks.hook("close", () => {
    logger.info("closing alive server...");
    return new Promise<void>((resolve) => {
      server.close((error) => {
        if (error) {
          logger.error("error closing debug server:", error);
        } else {
          logger.log("debug server closed");
        }
        resolve();
      });
    });
  });
});

function createDebuggerApp(config: ModuleOptions) {
  const app = createApp();

  if (config.healthCheck?.enabled) {
    logger.info("healthcheck enabled");
    app.use(config.healthCheck.path, healthHandler);
  }

  if (config.readyCheck?.enabled) {
    logger.info("readycheck enabled");
    app.use(config.readyCheck.path, readyHandler);
  }

  if (config.metrics?.enabled) {
    app.use(config.metrics.path, metricsHandler);
  }

  return app;
}

function createDebugServer(app: App, config: ModuleOptions) {
  const listener = toNodeListener(app);
  const debugServerInstance = createServer(listener);

  debugServerInstance.on("error", (error) => {
    logger.error("alive server error:", error);
  });

  debugServerInstance.listen(config.debugServer?.port, () => {
    logger.info(
      `debug server started http://localhost:${config.debugServer?.port}`,
    );
  });

  return {
    close: debugServerInstance.close,
  };
}
