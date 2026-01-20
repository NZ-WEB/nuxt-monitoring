import { defineEventHandler, createError } from 'h3'

export interface ReadinessCheck {
  name: string
  check: () => Promise<boolean> | boolean
}

export interface ReadinessCheckResult {
  name: string
  passed: boolean
  reason?: string
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

  const results: ReadinessCheckResult[] = await Promise.all(
    readinessChecks.map(async ({ name, check }) => {
      try {
        const passed = await check()
        return { name, passed }
      }
      catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        return { name, passed: false, reason }
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
