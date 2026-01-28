
<script setup lang="ts">
const healthState = ref(null)
const healthEndpointResult = ref(null)

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
    ? 'http://localhost:3001/health'
    : '/health'

  try {
    const data = await $fetch(url)
    healthEndpointResult.value = {
      status: 200,
      data,
      url,
    }
  } catch (error: any) {
    healthEndpointResult.value = {
      status: error.status || error.statusCode || 'unknown',
      data: error.data || error.message || error,
      url,
    }
  }
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
      <h2>Health Check API Test</h2>

      <div class="controls">
        <div class="toggle-group">
          <label>
            <input type="checkbox" v-model="useDebugServer" />
            Использовать Debug Server (port 3001)
          </label>
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
        <button @click="testHealthEndpoint" class="btn primary">
          Тестировать /health endpoint
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
    </div>

    <div class="section">
      <h2>Endpoints</h2>

      <h3>Debug Server (включен, порт 3001)</h3>
      <ul>
        <li><a href="http://localhost:3001/health" target="_blank">http://localhost:3001/health</a> - Health check</li>
        <li><a href="http://localhost:3001/ready" target="_blank">http://localhost:3001/ready</a> - Ready check</li>
        <li><a href="http://localhost:3001/metrics" target="_blank">http://localhost:3001/metrics</a> - Prometheus metrics</li>
      </ul>

      <h3>Основное приложение (порт 3000)</h3>
      <p><em>Monitoring endpoints недоступны, так как включен debug server</em></p>
      <ul>
        <li><span class="disabled">/health</span> - Health check (отключен)</li>
        <li><span class="disabled">/ready</span> - Ready check (отключен)</li>
        <li><span class="disabled">/metrics</span> - Prometheus metrics (отключен)</li>
      </ul>

      <h3>API для демонстрации (порт 3000)</h3>
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
</style>
