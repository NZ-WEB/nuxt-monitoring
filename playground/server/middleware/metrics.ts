import { Counter } from "prom-client";

const playgroundTestMetric = new Counter({
  name: "playground_test_metric",
  help: "Counter for all requests in playground",
});

export default defineEventHandler(() => {
  playgroundTestMetric.inc();
});
