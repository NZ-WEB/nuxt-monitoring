import { defineEventHandler, getRequestURL } from "h3";
import { useRuntimeConfig } from "#imports";
import { collectMetrics, defaultMetrics } from "../../metrics/client";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const url = getRequestURL(event);

  const isNuxtRequest = /^\/__/.test(url.pathname);
  if (isNuxtRequest) return;

  if (
    url.pathname ===
    ((config.public.metrics as { path: string }).path || "/metrics")
  ) {
    return;
  }

  const staticAssetExtensions =
    /\.(ico|png|jpg|jpeg|gif|svg|css|js|map|woff|woff2|ttf|eot|txt|xml|json)$/i;
  if (staticAssetExtensions.test(url.pathname)) {
    return;
  }

  const startTime = process.hrtime.bigint();

  defaultMetrics.activeRequests.inc();

  const route = url.pathname;

  const originalEnd = event.node.res.end;
  event.node.res.end = function (
    chunk?: any,
    encoding?: BufferEncoding | (() => void),
    callback?: () => void,
  ) {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1e6;
    const durationSec = durationMs / 1000;
    const statusCode = event.node.res.statusCode;

    collectMetrics({ method: event.method, route, statusCode }, durationSec);
    defaultMetrics.activeRequests.dec();
    event.node.res.end = originalEnd;

    if (typeof encoding === "function") {
      callback = encoding;
      encoding = undefined;
    }
    return originalEnd.call(
      this,
      chunk || undefined,
      encoding as BufferEncoding,
      callback || undefined,
    );
  };
});
