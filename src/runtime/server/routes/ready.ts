import { defineEventHandler, createError } from 'h3'

export interface ReadinessCheck {
  name: string
  check: () => Promise<boolean> | boolean
}

const readinessChecks: ReadinessCheck[] = []

export const registerReadinessCheck = (check: ReadinessCheck) => {
  readinessChecks.push(check)
}

export const clearReadinessChecks = () => {
  readinessChecks.length = 0
}

export default defineEventHandler(async () => {
  if (readinessChecks.length === 0) {
    return { status: 'ready' }
  }

  const results = await Promise.all(
    readinessChecks.map(async ({ name, check }) => {
      try {
        const passed = await check()
        return { name, passed }
      }
      catch {
        return { name, passed: false }
      }
    }),
  )

  const allPassed = results.every(r => r.passed)

  if (!allPassed) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      data: { checks: results },
    })
  }

  return {
    status: 'ready',
    checks: results,
  }
})
