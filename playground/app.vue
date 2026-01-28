<template>
  <div class="container">
    <h1>Nuxt Monitoring Module Playground</h1>

    <div class="section">
      <h2>Monitoring API Test</h2>

      <!-- Tab navigation -->
      <div class="tabs">
        <button
          :class="['tab', { active: activeTab === 'health' }]"
          @click="activeTab = 'health'"
        >
          🩺 Health Check API
        </button>
        <button
          :class="['tab', { active: activeTab === 'ready' }]"
          @click="activeTab = 'ready'"
        >
          🚀 Ready Check
        </button>
        <button
          :class="['tab', { active: activeTab === 'metrics' }]"
          @click="activeTab = 'metrics'"
        >
          📊 Prometheus Metrics
        </button>
      </div>

      <!-- Health Check tab -->
      <div v-if="activeTab === 'health'" class="tab-content">
        <div class="header-with-status">
          <h3>Health Check API</h3>
          <div v-if="healthState" class="status-indicator">
            <span
              :class="['status-badge', healthState.isHealthy ? 'healthy' : 'unhealthy']"
            >
              {{ healthState.isHealthy ? '✅ Healthy' : '❌ Error' }}
            </span>
          </div>
        </div>
        <p class="description">
          Manage health check state. Set and clear errors, check current status.
        </p>

        <div class="buttons">
          <button
            :class="['btn', healthState && !healthState.isHealthy ? 'success' : 'error']"
            @click="toggleHealthError"
          >
            {{ healthState && !healthState.isHealthy ? 'Clear Error' : 'Set Error' }}
          </button>
          <button class="btn primary" @click="testHealthEndpoint">
            Test /health endpoint
          </button>
        </div>

        <div v-if="healthState" class="result">
          <h4>Current State:</h4>
          <pre>{{ JSON.stringify(healthState, null, 2) }}</pre>
        </div>

        <div v-if="healthEndpointResult" class="result">
          <h4>/health endpoint result:</h4>
          <p><strong>URL:</strong> {{ healthEndpointResult.url }}</p>
          <p><strong>Status:</strong>
            <span :class="['status-code', getStatusClass(healthEndpointResult.status)]">
              {{ healthEndpointResult.status }}
            </span>
          </p>
          <pre>{{ JSON.stringify(healthEndpointResult.data, null, 2) }}</pre>
        </div>
      </div>

      <!-- Ready Check tab -->
      <div v-if="activeTab === 'ready'" class="tab-content">
        <h3>Ready Check</h3>
        <p class="description">
          Check application readiness. This endpoint shows if the application is ready to serve requests.
        </p>

        <div class="buttons">
          <button class="btn secondary" @click="testReadyEndpoint">
            Test /ready endpoint
          </button>
        </div>

        <div v-if="readyEndpointResult" class="result">
          <h4>/ready endpoint result:</h4>
          <p><strong>URL:</strong> {{ readyEndpointResult.url }}</p>
          <p><strong>Status:</strong>
            <span :class="['status-code', getStatusClass(readyEndpointResult.status)]">
              {{ readyEndpointResult.status }}
            </span>
          </p>
          <pre>{{ JSON.stringify(readyEndpointResult.data, null, 2) }}</pre>
        </div>
      </div>

      <!-- Metrics tab -->
      <div v-if="activeTab === 'metrics'" class="tab-content">
        <h3>Prometheus Metrics</h3>
        <p class="description">
          View application metrics in Prometheus format. Includes HTTP requests, memory usage, CPU and other system metrics.
        </p>

        <div class="buttons">
          <button class="btn tertiary" @click="testMetricsEndpoint">
            Load metrics
          </button>
        </div>

        <div v-if="metricsEndpointResult" class="result">
          <h4>/metrics endpoint result:</h4>
          <p><strong>URL:</strong> {{ metricsEndpointResult.url }}</p>
          <p><strong>Status:</strong>
            <span :class="['status-code', getStatusClass(metricsEndpointResult.status)]">
              {{ metricsEndpointResult.status }}
            </span>
          </p>

          <div v-if="metricsEndpointResult.isMetrics && typeof metricsEndpointResult.data === 'string'" class="metrics-data">
            <p><em>Prometheus metrics:</em></p>
            <pre class="metrics-output">{{ metricsEndpointResult.data }}</pre>
          </div>
          <div v-else>
            <pre>{{ JSON.stringify(metricsEndpointResult.data, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Available Endpoints</h2>

      <h3>🐞 Debug Server (port 3001) с поддержкой CORS</h3>
      <p><em>Прямые запросы на debug server с настроенными CORS заголовками</em></p>
      <ul>
        <li><a href="http://localhost:3001/health" target="_blank">http://localhost:3001/health</a> - Health check</li>
        <li><a href="http://localhost:3001/ready" target="_blank">http://localhost:3001/ready</a> - Ready check</li>
        <li><a href="http://localhost:3001/metrics" target="_blank">http://localhost:3001/metrics</a> - Prometheus metrics</li>
      </ul>

      <h3>🧪 Demo API (port 3000)</h3>
      <ul>
        <li><a href="/api/test-health" target="_blank">/api/test-health</a> - API for testing health check functions</li>
      </ul>

    </div>
  </div>
</template>

<script setup lang="ts">
const activeTab = ref('health')
const healthState = ref(null)
const healthEndpointResult = ref(null)
const readyEndpointResult = ref(null)
const metricsEndpointResult = ref(null)

const setError = async () => {
  try {
    const { data } = await $fetch('/api/test-health', {
      method: 'POST',
      body: {
        action: 'setError',
        key: 'test-error',
        message: 'This is a test health check error',
        code: 'TEST_ERROR',
      },
    })
    console.log('Error set:', data)
    await checkHealth()
  } catch (error) {
    console.error('Failed to set error:', error)
  }
}

const clearError = async () => {
  try {
    const { data } = await $fetch('/api/test-health', {
      method: 'POST',
      body: {
        action: 'clearError',
        key: 'test-error',
      },
    })
    console.log('Error cleared:', data)
    await checkHealth()
  } catch (error) {
    console.error('Failed to clear error:', error)
  }
}

const toggleHealthError = async () => {
  const hasErrors = healthState.value && !healthState.value.isHealthy

  if (hasErrors) {
    // Clear error
    await clearError()
  } else {
    // Set error
    await setError()
  }
}

const checkHealth = async () => {
  try {
    const state = await $fetch('/api/test-health', {
      method: 'POST',
      body: { action: 'getState' },
    })
    healthState.value = state
  } catch (error) {
    console.error('Failed to get health state:', error)
  }
}

const testHealthEndpoint = async () => {
  const url = 'http://localhost:3001/health'

  try {
    const data = await $fetch(url)
    healthEndpointResult.value = {
      status: 200,
      data,
      url: `${url} (debug server)`,
    }
  } catch (error: any) {
    healthEndpointResult.value = {
      status: error.status || error.statusCode || 'unknown',
      data: error.data || error.message || error,
      url: `${url} (debug server)`,
    }
  }
}

const testReadyEndpoint = async () => {
  const url = 'http://localhost:3001/ready'

  try {
    const data = await $fetch(url)
    readyEndpointResult.value = {
      status: 200,
      data,
      url: `${url} (debug server)`,
    }
  } catch (error: any) {
    readyEndpointResult.value = {
      status: error.status || error.statusCode || 'unknown',
      data: error.data || error.message || error,
      url: `${url} (debug server)`,
    }
  }
}

const testMetricsEndpoint = async () => {
  const url = 'http://localhost:3001/metrics'

  try {
    const data = await $fetch(url)
    metricsEndpointResult.value = {
      status: 200,
      data,
      url: `${url} (debug server)`,
      isMetrics: true, // Flag for special metrics display
    }
  } catch (error: any) {
    metricsEndpointResult.value = {
      status: error.status || error.statusCode || 'unknown',
      data: error.data || error.message || error,
      url: `${url} (debug server)`,
      isMetrics: true,
    }
  }
}

const getStatusClass = (status: number | string) => {
  const statusNum = typeof status === 'string' ? Number.parseInt(status) : status

  if (statusNum >= 200 && statusNum < 300) return 'success'
  if (statusNum >= 300 && statusNum < 400) return 'redirect'
  if (statusNum >= 400 && statusNum < 500) return 'client-error'
  if (statusNum >= 500) return 'server-error'
  return 'unknown'
}

// Load initial state only for health check
onMounted(() => {
  if (activeTab.value === 'health') {
    checkHealth()
  }
})

// Load state when switching to health tab
watch(activeTab, (newTab) => {
  if (newTab === 'health' && !healthState.value) {
    checkHealth()
  }
})
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, sans-serif;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
  gap: 2px;
}

.tab {
  padding: 12px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  border-radius: 6px 6px 0 0;
  transition: all 0.2s ease;
  color: #6b7280;
}

.tab:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab.active {
  background: #3b82f6;
  color: white;
}

.tab-content {
  min-height: 400px;
}

.header-with-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.status-indicator {
  display: flex;
  align-items: center;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.healthy {
  background: #dcfce7;
  color: #166534;
}

.status-badge.unhealthy {
  background: #fef2f2;
  color: #dc2626;
}

.description {
  color: #6b7280;
  margin-bottom: 20px;
  font-size: 0.95rem;
  line-height: 1.5;
}

.buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn.error {
  background: #ef4444;
  color: white;
}

.btn.success {
  background: #22c55e;
  color: white;
}

.btn.info {
  background: #3b82f6;
  color: white;
}

.btn.primary {
  background: #8b5cf6;
  color: white;
}

.btn.secondary {
  background: #0ea5e9;
  color: white;
}

.btn.tertiary {
  background: #10b981;
  color: white;
}

.btn:hover {
  opacity: 0.9;
}

.result {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-top: 15px;
}

.result pre {
  background: #fff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  overflow-x: auto;
}

h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #374151;
  font-size: 1.25rem;
}

h4 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #374151;
  font-size: 1.1rem;
}

.metrics-data {
  margin-top: 15px;
}

.metrics-output {
  max-height: 500px;
  overflow-y: auto;
  font-size: 0.8rem;
  line-height: 1.3;
  background: #f8f9fa;
  color: #1f2937;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  white-space: pre-wrap;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

ul li {
  margin: 5px 0;
}

a {
  color: #3b82f6;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.disabled {
  color: #9ca3af;
  text-decoration: line-through;
}

.status-code {
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  font-family: monospace;
}

.status-code.success {
  background: #dcfce7;
  color: #166534;
}

.status-code.redirect {
  background: #fef3c7;
  color: #92400e;
}

.status-code.client-error {
  background: #fee2e2;
  color: #dc2626;
}

.status-code.server-error {
  background: #fef2f2;
  color: #dc2626;
}

.status-code.unknown {
  background: #f3f4f6;
  color: #6b7280;
}
</style>
