
<script setup lang="ts">
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
        message: 'Это тестовая ошибка health check',
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

const useDebugServer = ref(true)

const testHealthEndpoint = async () => {
  const url = useDebugServer.value
    ? '/api/proxy/health'
    : '/health'
  const description = useDebugServer.value
    ? 'через прокси → debug server :3001'
    : 'напрямую (недоступно)'

  try {
    const data = await $fetch(url)
    healthEndpointResult.value = {
      status: 200,
      data,
      url: `${url} (${description})`,
    }
  } catch (error: any) {
    healthEndpointResult.value = {
      status: error.status || error.statusCode || 'unknown',
      data: error.data || error.message || error,
      url: `${url} (${description})`,
    }
  }
}

const testReadyEndpoint = async () => {
  const url = useDebugServer.value
    ? '/api/proxy/ready'
    : '/ready'
  const description = useDebugServer.value
    ? 'через прокси → debug server :3001'
    : 'напрямую (недоступно)'

  try {
    const data = await $fetch(url)
    readyEndpointResult.value = {
      status: 200,
      data,
      url: `${url} (${description})`,
    }
  } catch (error: any) {
    readyEndpointResult.value = {
      status: error.status || error.statusCode || 'unknown',
      data: error.data || error.message || error,
      url: `${url} (${description})`,
    }
  }
}

const testMetricsEndpoint = async () => {
  const url = useDebugServer.value
    ? '/api/proxy/metrics'
    : '/metrics'
  const description = useDebugServer.value
    ? 'через прокси → debug server :3001'
    : 'напрямую (недоступно)'

  try {
    const data = await $fetch(url)
    metricsEndpointResult.value = {
      status: 200,
      data,
      url: `${url} (${description})`,
      isMetrics: true, // Флаг для особого отображения метрик
    }
  } catch (error: any) {
    metricsEndpointResult.value = {
      status: error.status || error.statusCode || 'unknown',
      data: error.data || error.message || error,
      url: `${url} (${description})`,
      isMetrics: true,
    }
  }
}

const testAllEndpoints = async () => {
  await Promise.all([
    testHealthEndpoint(),
    testReadyEndpoint(),
    testMetricsEndpoint(),
  ])
}

// Загружаем начальное состояние
onMounted(() => {
  checkHealth()
})
</script>

<template>
  <div class="container">
    <h1>Nuxt Monitoring Module Playground</h1>

    <div class="section">
      <h2>Monitoring API Test</h2>

      <div class="controls">
        <div class="toggle-group">
          <label>
            <input type="checkbox" v-model="useDebugServer" />
            Использовать Debug Server через прокси (рекомендовано)
          </label>
          <small class="help-text">
            Включено: запросы идут через прокси API → debug server (порт 3001)<br>
            Отключено: прямые запросы (будут падать, так как endpoints отключены на основном порту)
          </small>
        </div>
      </div>

      <div class="buttons">
        <button @click="setError" class="btn error">
          Установить ошибку
        </button>
        <button @click="clearError" class="btn success">
          Очистить ошибку
        </button>
        <button @click="checkHealth" class="btn info">
          Проверить состояние
        </button>
      </div>

      <div class="buttons endpoints">
        <button @click="testHealthEndpoint" class="btn primary">
          Тестировать /health
        </button>
        <button @click="testReadyEndpoint" class="btn secondary">
          Тестировать /ready
        </button>
        <button @click="testMetricsEndpoint" class="btn tertiary">
          Тестировать /metrics
        </button>
        <button @click="testAllEndpoints" class="btn quaternary">
          🚀 Тестировать все endpoints
        </button>
      </div>

      <div v-if="healthState" class="result">
        <h3>Текущее состояние:</h3>
        <pre>{{ JSON.stringify(healthState, null, 2) }}</pre>
      </div>

      <div v-if="healthEndpointResult" class="result">
        <h3>Результат /health endpoint:</h3>
        <p><strong>URL:</strong> {{ healthEndpointResult.url }}</p>
        <p><strong>Статус:</strong> {{ healthEndpointResult.status }}</p>
        <pre>{{ JSON.stringify(healthEndpointResult.data, null, 2) }}</pre>
      </div>

      <div v-if="readyEndpointResult" class="result">
        <h3>Результат /ready endpoint:</h3>
        <p><strong>URL:</strong> {{ readyEndpointResult.url }}</p>
        <p><strong>Статус:</strong> {{ readyEndpointResult.status }}</p>
        <pre>{{ JSON.stringify(readyEndpointResult.data, null, 2) }}</pre>
      </div>

      <div v-if="metricsEndpointResult" class="result">
        <h3>Результат /metrics endpoint:</h3>
        <p><strong>URL:</strong> {{ metricsEndpointResult.url }}</p>
        <p><strong>Статус:</strong> {{ metricsEndpointResult.status }}</p>
        <div v-if="metricsEndpointResult.isMetrics && typeof metricsEndpointResult.data === 'string'" class="metrics-data">
          <p><em>Prometheus метрики (показаны первые 20 строк):</em></p>
          <pre>{{ metricsEndpointResult.data.split('\n').slice(0, 20).join('\n') }}{{ metricsEndpointResult.data.split('\n').length > 20 ? '\n\n... (показано 20 из ' + metricsEndpointResult.data.split('\n').length + ' строк)' : '' }}</pre>
        </div>
        <div v-else>
          <pre>{{ JSON.stringify(metricsEndpointResult.data, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Доступные Endpoints</h2>

      <h3>🔄 Прокси API (порт 3000) ← Debug Server (порт 3001)</h3>
      <p><em>Решение проблемы CORS - запросы проксируются на debug server</em></p>
      <ul>
        <li><a href="/api/proxy/health" target="_blank">/api/proxy/health</a> - Health check через прокси</li>
        <li><a href="/api/proxy/ready" target="_blank">/api/proxy/ready</a> - Ready check через прокси</li>
        <li><a href="/api/proxy/metrics" target="_blank">/api/proxy/metrics</a> - Prometheus metrics через прокси</li>
      </ul>

      <h3>🐞 Debug Server напрямую (порт 3001)</h3>
      <p><em>Прямые запросы - могут вызывать CORS ошибки в браузере</em></p>
      <ul>
        <li><a href="http://localhost:3001/health" target="_blank">http://localhost:3001/health</a> - Health check</li>
        <li><a href="http://localhost:3001/ready" target="_blank">http://localhost:3001/ready</a> - Ready check</li>
        <li><a href="http://localhost:3001/metrics" target="_blank">http://localhost:3001/metrics</a> - Prometheus metrics</li>
      </ul>

      <h3>🚫 Основное приложение (порт 3000)</h3>
      <p><em>Monitoring endpoints отключены, так как включен debug server</em></p>
      <ul>
        <li><span class="disabled">/health</span> - Health check (отключен)</li>
        <li><span class="disabled">/ready</span> - Ready check (отключен)</li>
        <li><span class="disabled">/metrics</span> - Prometheus metrics (отключен)</li>
      </ul>

      <h3>🧪 API для демонстрации (порт 3000)</h3>
      <ul>
        <li><a href="/api/test-health" target="_blank">/api/test-health</a> - API для тестирования health check функций</li>
      </ul>
    </div>
  </div>
</template>

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

.controls {
  margin-bottom: 15px;
}

.toggle-group {
  background: #f8f9fa;
  padding: 10px 15px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.toggle-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.toggle-group input[type="checkbox"] {
  margin: 0;
}

.help-text {
  display: block;
  margin-top: 5px;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.buttons.endpoints {
  margin-top: 15px;
  border-top: 1px solid #e5e7eb;
  padding-top: 15px;
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

.btn.quaternary {
  background: #f59e0b;
  color: white;
  font-weight: 600;
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

h3 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #374151;
}

.metrics-data pre {
  max-height: 300px;
  overflow-y: auto;
  font-size: 0.85rem;
  line-height: 1.4;
}
</style>
