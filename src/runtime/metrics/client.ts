import {
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
  register,
} from "prom-client";

collectDefaultMetrics({ register });

const defaultMetrics = {
  httpRequestTotal: new Counter({
    name: "http_request_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"] as const,
    registers: [register],
  }),
  httpRequestDuration: new Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"] as const,
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 1.5, 2, 5, 10],
    registers: [register],
  }),
  activeRequests: new Gauge({
    name: "http_active_requests",
    help: "Number of active HTTP requests",
    registers: [register],
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
  defaultMetrics.httpRequestDuration.observe(
    {
      method: labels.method,
      route: labels.route,
      status_code: labels.statusCode,
    },
    duration,
  );
}

export { register, defaultMetrics, collectMetrics };
