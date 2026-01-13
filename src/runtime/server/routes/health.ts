import { defineEventHandler, setResponseStatus } from 'h3'

export default defineEventHandler((event) => {
  setResponseStatus(event, 200)
  return 'OK'
})
