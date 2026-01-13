import { consola } from "consola";

export const logger = consola.create({
  defaults: {
    tag: "nuxt-monitoring",
  },
});
