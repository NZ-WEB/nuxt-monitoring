import { defineEventHandler, setResponseHeader } from "h3";
import { register } from "../../metrics/client";

export default defineEventHandler(async (event) => {
  // Add CORS headers
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
  setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')

  setResponseHeader(event, "Content-Type", register.contentType);
  return await register.metrics();
});
