export interface HealthError {
  message: string
  code?: string
  timestamp: number
}

export interface HealthState {
  isHealthy: boolean
  errors: Record<string, HealthError>
}

export interface HealthResponse {
  status: 'ok' | 'error'
  errors?: Record<string, HealthError>
}