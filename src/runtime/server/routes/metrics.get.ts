import { defineEventHandler, setResponseHeader } from "h3";
import { register } from "../../metrics/client";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Content-Type", register.contentType);
  return await register.metrics();
});
