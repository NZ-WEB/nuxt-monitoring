import { defineEventHandler, setResponseStatus, setResponseHeader } from "h3";

export default defineEventHandler(async (event) => {
  // Добавляем CORS заголовки
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
  setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')

  setResponseStatus(event, 200);
  return "OK";
});
