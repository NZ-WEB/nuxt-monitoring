import {
  Counter,
  Gauge,
  Histogram,
  collectDefaultMetrics,
  register,
} from "prom-client";

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
  httpRequestDurationHistogram: new Histogram({
    name: "http_request_duration_seconds_histogram",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
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
  defaultMetrics.httpRequestDurationHistogram.observe(
    {
      method: labels.method,
      route: labels.route,
      status_code: labels.statusCode,
    },
    duration,
  );
}

export { defaultMetrics, collectMetrics, register };
