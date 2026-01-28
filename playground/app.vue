
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

const toggleHealthError = async () => {
  const hasErrors = healthState.value && !healthState.value.isHealthy

  if (hasErrors) {
    // Очищаем ошибку
    await clearError()
  } else {
    // Устанавливаем ошибку
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
  const url = '/api/proxy/health'

  try {
    const data = await $fetch(url)
    healthEndpointResult.value = {
      status: 200,
      data,
      url: `${url} → debug server :3001`,
    }
  } catch (error: any) {
    healthEndpointResult.value = {
      status: error.status || error.statusCode || 'unknown',
      data: error.data || error.message || error,
      url: `${url} → debug server :3001`,
    }
  }
}

const testReadyEndpoint = async () => {
  const url = '/api/proxy/ready'

  try {
    const data = await $fetch(url)
    readyEndpointResult.value = {
      status: 200,
      data,
      url: `${url} → debug server :3001`,
    }
  } catch (error: any) {
    readyEndpointResult.value = {
      status: error.status || error.statusCode || 'unknown',
      data: error.data || error.message || error,
      url: `${url} → debug server :3001`,
    }
  }
}

const testMetricsEndpoint = async () => {
  const url = '/api/proxy/metrics'

  try {
    const data = await $fetch(url)
    metricsEndpointResult.value = {
      status: 200,
      data,
      url: `${url} → debug server :3001`,
      isMetrics: true, // Флаг для особого отображения метрик
    }
  } catch (error: any) {
    metricsEndpointResult.value = {
      status: error.status || error.statusCode || 'unknown',
      data: error.data || error.message || error,
      url: `${url} → debug server :3001`,
      isMetrics: true,
    }
  }
}


// Загружаем начальное состояние только для health check
onMounted(() => {
  if (activeTab.value === 'health') {
    checkHealth()
  }
})

// Загружаем состояние при переключении на вкладку health
watch(activeTab, (newTab) => {
  if (newTab === 'health' && !healthState.value) {
    checkHealth()
  }
})
</script>

<template>
  <div class="container">
    <h1>Nuxt Monitoring Module Playground</h1>

    <div class="section">
      <h2>Monitoring API Test</h2>

      <!-- Навигация по табам -->
      <div class="tabs">
        <button
          @click="activeTab = 'health'"
          :class="['tab', { active: activeTab === 'health' }]"
        >
          🩺 Health Check API
        </button>
        <button
          @click="activeTab = 'ready'"
          :class="['tab', { active: activeTab === 'ready' }]"
        >
          🚀 Ready Check
        </button>
        <button
          @click="activeTab = 'metrics'"
          :class="['tab', { active: activeTab === 'metrics' }]"
        >
          📊 Prometheus Metrics
        </button>
      </div>

      <!-- Health Check вкладка -->
      <div v-if="activeTab === 'health'" class="tab-content">
        <div class="header-with-status">
          <h3>Health Check API</h3>
          <div class="status-indicator" v-if="healthState">
            <span
              :class="['status-badge', healthState.isHealthy ? 'healthy' : 'unhealthy']"
            >
              {{ healthState.isHealthy ? '✅ Здоров' : '❌ Ошибка' }}
            </span>
          </div>
        </div>
        <p class="description">
          Управление состоянием health check. Устанавливайте и очищайте ошибки, проверяйте текущее состояние.
        </p>

        <div class="buttons">
          <button
            @click="toggleHealthError"
            :class="['btn', healthState && !healthState.isHealthy ? 'success' : 'error']"
          >
            {{ healthState && !healthState.isHealthy ? 'Очистить ошибку' : 'Установить ошибку' }}
          </button>
          <button @click="checkHealth" class="btn info">
            Проверить состояние
          </button>
          <button @click="testHealthEndpoint" class="btn primary">
            Тестировать /health endpoint
          </button>
        </div>

        <div v-if="healthState" class="result">
          <h4>Текущее состояние:</h4>
          <pre>{{ JSON.stringify(healthState, null, 2) }}</pre>
        </div>

        <div v-if="healthEndpointResult" class="result">
          <h4>Результат /health endpoint:</h4>
          <p><strong>URL:</strong> {{ healthEndpointResult.url }}</p>
          <p><strong>Статус:</strong> {{ healthEndpointResult.status }}</p>
          <pre>{{ JSON.stringify(healthEndpointResult.data, null, 2) }}</pre>
        </div>
      </div>

      <!-- Ready Check вкладка -->
      <div v-if="activeTab === 'ready'" class="tab-content">
        <h3>Ready Check</h3>
        <p class="description">
          Проверка готовности приложения. Этот endpoint показывает, готово ли приложение обслуживать запросы.
        </p>

        <div class="buttons">
          <button @click="testReadyEndpoint" class="btn secondary">
            Тестировать /ready endpoint
          </button>
        </div>

        <div v-if="readyEndpointResult" class="result">
          <h4>Результат /ready endpoint:</h4>
          <p><strong>URL:</strong> {{ readyEndpointResult.url }}</p>
          <p><strong>Статус:</strong> {{ readyEndpointResult.status }}</p>
          <pre>{{ JSON.stringify(readyEndpointResult.data, null, 2) }}</pre>
        </div>
      </div>

      <!-- Metrics вкладка -->
      <div v-if="activeTab === 'metrics'" class="tab-content">
        <h3>Prometheus Metrics</h3>
        <p class="description">
          Просмотр метрик приложения в формате Prometheus. Включает HTTP запросы, использование памяти, CPU и другие системные метрики.
        </p>

        <div class="buttons">
          <button @click="testMetricsEndpoint" class="btn tertiary">
            Загрузить метрики
          </button>
        </div>

        <div v-if="metricsEndpointResult" class="result">
          <h4>Результат /metrics endpoint:</h4>
          <p><strong>URL:</strong> {{ metricsEndpointResult.url }}</p>
          <p><strong>Статус:</strong> {{ metricsEndpointResult.status }}</p>

          <div v-if="metricsEndpointResult.isMetrics && typeof metricsEndpointResult.data === 'string'" class="metrics-data">
            <p><em>Prometheus метрики:</em></p>
            <pre class="metrics-output">{{ metricsEndpointResult.data }}</pre>
          </div>
          <div v-else>
            <pre>{{ JSON.stringify(metricsEndpointResult.data, null, 2) }}</pre>
          </div>
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
</style>
