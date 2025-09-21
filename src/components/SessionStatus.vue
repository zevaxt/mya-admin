<template>
  <div v-if="isAuthenticated" class="session-status">
    <v-tooltip location="bottom">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-chip
          v-bind="tooltipProps"
          size="small"
          :color="sessionColor"
          variant="outlined"
          class="session-chip"
        >
          <v-icon start size="small">{{ sessionIcon }}</v-icon>
          <span v-if="showTimeDisplay">{{ formattedTime }}</span>
          <span v-else>Sesión activa</span>
        </v-chip>
      </template>
      <div class="text-center">
        <div>Estado de sesión: {{ sessionActive ? 'Activa' : 'Expirando' }}</div>
        <div>Tiempo restante: {{ formattedTime }}</div>
        <div v-if="remainingTime < 3600" class="text-caption mt-1">
          La sesión se renovará automáticamente mientras uses la aplicación
        </div>
      </div>
    </v-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Props
const props = defineProps({
  showTime: {
    type: Boolean,
    default: true
  }
})

// Computed property que usa props
const showTimeDisplay = computed(() => props.showTime)

// Store
const authStore = useAuthStore()

// Estado
const updateInterval = ref<number | null>(null)
const remainingTime = ref(0)

// Computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated)
const sessionActive = computed(() => authStore.sessionActive)

const formattedTime = computed(() => {
  if (remainingTime.value <= 0) return '00:00:00'
  
  const hours = Math.floor(remainingTime.value / 3600)
  const minutes = Math.floor((remainingTime.value % 3600) / 60)
  const seconds = remainingTime.value % 60
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':')
})

const sessionColor = computed(() => {
  if (remainingTime.value > 3600) return 'success' // Más de 1 hora
  if (remainingTime.value > 600) return 'warning' // Más de 10 minutos
  return 'error' // Menos de 10 minutos
})

const sessionIcon = computed(() => {
  if (remainingTime.value > 3600) return 'mdi-check-circle'
  if (remainingTime.value > 600) return 'mdi-clock-outline'
  return 'mdi-alert-circle'
})

// Actualizar el tiempo restante cada segundo
function updateRemainingTime() {
  remainingTime.value = authStore.tokenRemainingTime
}

// Lifecycle hooks
onMounted(() => {
  // Actualizar inmediatamente
  updateRemainingTime()
  
  // Configurar intervalo para actualizar cada segundo
  updateInterval.value = window.setInterval(updateRemainingTime, 1000)
})

onUnmounted(() => {
  // Limpiar intervalo al desmontar
  if (updateInterval.value !== null) {
    clearInterval(updateInterval.value)
  }
})
</script>

<style scoped>
.session-status {
  display: inline-block;
}

.session-chip {
  cursor: pointer;
}
</style>
