<template>
  <div class="container">
    <h1>Nuxt Monitoring Module Playground</h1>

    <div class="section">
      <h2>Health Check API Test</h2>

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
        <p><strong>Статус:</strong> {{ healthEndpointResult.status }}</p>
        <pre>{{ JSON.stringify(healthEndpointResult.data, null, 2) }}</pre>
      </div>
    </div>

    <div class="section">
      <h2>Endpoints</h2>
      <ul>
        <li><a href="/health" target="_blank">/health</a> - Health check</li>
        <li><a href="/ready" target="_blank">/ready</a> - Ready check</li>
        <li><a href="/metrics" target="_blank">/metrics</a> - Prometheus metrics</li>
        <li><a href="http://localhost:3001/health" target="_blank">Debug Server Health</a> (port 3001)</li>
        <li><a href="http://localhost:3001/ready" target="_blank">Debug Server Ready</a> (port 3001)</li>
        <li><a href="http://localhost:3001/metrics" target="_blank">Debug Server Metrics</a> (port 3001)</li>
      </ul>
    </div>
  </div>
</template>

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

const testHealthEndpoint = async () => {
  try {
    const data = await $fetch('/health')
    healthEndpointResult.value = {
      status: 200,
      data,
    }
  } catch (error: any) {
    healthEndpointResult.value = {
      status: error.status || error.statusCode || 'unknown',
      data: error.data || error.message || error,
    }
  }
}

// Загружаем начальное состояние
onMounted(() => {
  checkHealth()
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
</style>
