import {
  Counter,
  Gauge,
  Histogram,
  collectDefaultMetrics,
  register,
} from "prom-client";

collectDefaultMetrics({ register });

function normalizeRoute(route: string): string {
  let normalized = route.replace(/\/\d+/g, "/{id}");

  normalized = normalized.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    "/{uuid}",
  );

  return normalized;
}

function getStatusClass(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) {
    return "2xx";
  }
  if (statusCode >= 300 && statusCode < 400) {
    return "3xx";
  }
  if (statusCode >= 400 && statusCode < 500) {
    return "4xx";
  }
  if (statusCode >= 500) {
    return "5xx";
  }
  return "unknown";
}

const defaultMetrics = {
  httpRequestTotal: new Counter({
    name: "http_request_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"] as const,
  }),

  httpRequestDuration: new Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_class"] as const,
    buckets: [0.1, 0.5, 1, 2.5, 5, 10],
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
  const normalizedRoute = normalizeRoute(labels.route);
  const statusClass = getStatusClass(labels.statusCode);

  defaultMetrics.httpRequestTotal.inc({
    method: labels.method,
    route: normalizedRoute,
    status_code: labels.statusCode,
  });

  defaultMetrics.httpRequestDuration.observe(
    {
      method: labels.method,
      route: normalizedRoute,
      status_class: statusClass,
    },
    duration,
  );
}

export { defaultMetrics, collectMetrics, register };
