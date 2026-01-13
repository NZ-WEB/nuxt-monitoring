import { Counter, Gauge, collectDefaultMetrics, register } from "prom-client";

collectDefaultMetrics({ register });

const defaultMetrics = {
  httpRequestTotal: new Counter({
    name: "http_request_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"] as const,
  }),
  httpRequestDuration: new Gauge({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"] as const,
  }),
  activeRequests: new Gauge({
    name: "http_active_requests",
    help: "Number of active HTTP requests",
  }),
};

function collectMetrics(
  labels: { method: string; route: string; statusCode: number },
  duration: number,
) {
  defaultMetrics.httpRequestTotal.inc({
    method: labels.method,
    route: labels.route,
    status_code: labels.statusCode,
  });
  defaultMetrics.httpRequestDuration.set(
    {
      method: labels.method,
      route: labels.route,
      status_code: labels.statusCode,
    },
    duration,
  );
}

export { defaultMetrics, collectMetrics, register };
