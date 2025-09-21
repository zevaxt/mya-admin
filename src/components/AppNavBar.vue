<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAccountStore } from '@/stores/account'
import { onMounted, onUnmounted, ref } from 'vue'
import { AUTH_CONFIG } from '@/config/auth.config'
import AccountSelector from './AccountSelector.vue'

const authStore = useAuthStore()
const accountStore = useAccountStore()
const router = useRouter()

// Estado para el panel de depuración
const showDebugPanel = ref(false)
const systemInfo = ref({
  version: '1.0.0',
  environment: import.meta.env.MODE || 'development',
  apiUrl: import.meta.env.VITE_API_URL || 'No configurado',
  browser: navigator.userAgent,
  timestamp: new Date().toISOString(),
})

// Función para cargar cuentas
const loadAccounts = async () => {
  await accountStore.fetchUserAccounts()
}

// Función para cerrar sesión
const logout = () => {
  authStore.logout()
  router.push('/')
}

// Función para mostrar/ocultar el panel de depuración
const toggleDebugPanel = () => {
  showDebugPanel.value = !showDebugPanel.value
}

// Función para actualizar la información del sistema
const refreshSystemInfo = () => {
  systemInfo.value = {
    ...systemInfo.value,
    timestamp: new Date().toISOString(),
  }
}

// Función para obtener el color del estado de la sesión según el tiempo restante
const getSessionStatusColor = () => {
  const remainingTime = authStore.tokenRemainingTime
  const warningThresholdSeconds = AUTH_CONFIG.TOKEN_WARNING_THRESHOLD_MS / 1000 // Convertir a segundos
  const criticalThresholdSeconds = 600 // 10 minutos en segundos
  
  if (remainingTime > warningThresholdSeconds) return 'success' // Más que el umbral de advertencia
  if (remainingTime > criticalThresholdSeconds) return 'warning' // Más de 10 minutos
  return 'error' // Menos de 10 minutos
}

// Función para obtener el icono del estado de la sesión según el tiempo restante
const getSessionStatusIcon = () => {
  const remainingTime = authStore.tokenRemainingTime
  const warningThresholdSeconds = AUTH_CONFIG.TOKEN_WARNING_THRESHOLD_MS / 1000 // Convertir a segundos
  const criticalThresholdSeconds = 600 // 10 minutos en segundos
  
  if (remainingTime > warningThresholdSeconds) return 'mdi-check-circle'
  if (remainingTime > criticalThresholdSeconds) return 'mdi-clock-outline'
  return 'mdi-alert-circle'
}

// Función para formatear el tiempo restante en formato HH:MM:SS
const getFormattedRemainingTime = () => {
  const remainingTime = authStore.tokenRemainingTime
  if (remainingTime <= 0) return '00:00:00'

  const hours = Math.floor(remainingTime / 3600)
  const minutes = Math.floor((remainingTime % 3600) / 60)
  const seconds = remainingTime % 60

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':')
}

// Variable para almacenar el ID del intervalo
const updateInterval = ref<number | null>(null)

// Inicializar el componente
onMounted(() => {
  // Configurar un intervalo para actualizar la información cada segundo cuando el panel está abierto
  updateInterval.value = window.setInterval(() => {
    if (showDebugPanel.value) {
      // Forzar una actualización de la vista
      refreshSystemInfo()
    }
  }, 1000)
})

// Limpiar el intervalo cuando el componente se desmonta
onUnmounted(() => {
  if (updateInterval.value !== null) {
    clearInterval(updateInterval.value)
  }
})
</script>

<template>
  <v-app-bar color="primary" dark app>
    <v-app-bar-nav-icon></v-app-bar-nav-icon>

    <v-toolbar-title>
      <v-btn
        variant="text"
        color="white"
        class="pa-0 text-h6"
        style="text-transform: none"
        :to="{ name: 'landing' }"
      >
        MYA Admin
      </v-btn>
    </v-toolbar-title>

    <!-- Menú de navegación -->
    <div class="ml-4">
      <v-btn variant="text" :to="{ name: 'dashboard' }" color="white">
        <v-icon start>mdi-view-dashboard</v-icon>
        Dashboard
      </v-btn>

      <v-btn variant="text" :to="{ name: 'migrations' }" color="white">
        <v-icon start>mdi-swap-horizontal</v-icon>
        Migraciones
      </v-btn>
    </div>

    <v-spacer></v-spacer>

    <!-- Selector de cuentas -->
    <div class="d-flex align-center">
      <v-chip color="warning" class="mr-2" v-if="!authStore.isAuthenticated">
        <v-icon start>mdi-alert</v-icon>
        No autenticado
      </v-chip>
      <AccountSelector v-if="authStore.isAuthenticated" class="mx-2" />
    </div>

    <v-btn icon class="mx-1">
      <v-icon>mdi-magnify</v-icon>
    </v-btn>

    <v-btn icon class="mx-1">
      <v-icon>mdi-bell</v-icon>
    </v-btn>

    <!-- Botón para mostrar/ocultar panel de depuración -->
    <v-btn
      icon
      class="mx-1"
      @click="toggleDebugPanel"
      :color="showDebugPanel ? 'error' : 'default'"
    >
      <v-icon>mdi-bug</v-icon>
      <v-tooltip activator="parent" location="bottom">Panel de depuración</v-tooltip>
    </v-btn>

    <v-menu offset-y v-if="authStore.isAuthenticated">
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props" class="mx-1">
          <v-avatar size="36">
            <v-icon>mdi-account-circle</v-icon>
          </v-avatar>
        </v-btn>
      </template>

      <v-list>
        <v-list-item>
          <v-list-item-title>
            <strong>{{ authStore.username }}</strong>
          </v-list-item-title>
          <v-list-item-subtitle> ID: {{ authStore.currentUserId }} </v-list-item-subtitle>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item @click="router.push('/profile')" prepend-icon="mdi-account-cog">
          <v-list-item-title>Perfil</v-list-item-title>
        </v-list-item>

        <v-list-item @click="router.push('/settings')" prepend-icon="mdi-cog">
          <v-list-item-title>Configuración</v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item @click="logout" prepend-icon="mdi-logout">
          <v-list-item-title>Cerrar sesión</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>

  <!-- Panel de depuración -->
  <v-navigation-drawer
    v-model="showDebugPanel"
    location="right"
    temporary
    width="400"
    class="debug-panel"
  >
    <v-card flat>
      <v-card-title class="d-flex justify-space-between align-center bg-grey-lighten-3">
        <span class="text-primary font-weight-bold">
          <v-icon color="primary" class="mr-1">mdi-bug</v-icon>
          Panel de depuración
        </span>
        <v-btn icon @click="toggleDebugPanel">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <!-- Información del sistema -->
        <h3 class="text-subtitle-1 font-weight-bold mb-2">Información del sistema</h3>
        <v-list density="compact" class="bg-grey-lighten-4 mb-3">
          <v-list-item>
            <v-list-item-title>Versión</v-list-item-title>
            <v-list-item-subtitle>{{ systemInfo.version }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Entorno</v-list-item-title>
            <v-list-item-subtitle>{{ systemInfo.environment }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>URL de API</v-list-item-title>
            <v-list-item-subtitle>{{ systemInfo.apiUrl }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Navegador</v-list-item-title>
            <v-list-item-subtitle class="text-truncate">{{
              systemInfo.browser
            }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Timestamp</v-list-item-title>
            <v-list-item-subtitle>{{ systemInfo.timestamp }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <!-- Estado de autenticación -->
        <h3 class="text-subtitle-1 font-weight-bold mb-2">Estado de autenticación</h3>

        <div class="d-flex align-center mb-2">
          <v-chip
            :color="authStore.isAuthenticated ? 'success' : 'error'"
            size="small"
            class="mr-2"
          >
            <v-icon start size="small">{{
              authStore.isAuthenticated ? 'mdi-check-circle' : 'mdi-alert-circle'
            }}</v-icon>
            {{ authStore.isAuthenticated ? 'Autenticado' : 'No autenticado' }}
          </v-chip>

          <v-chip v-if="authStore.isAuthenticated" :color="getSessionStatusColor()" size="small">
            <v-icon start size="small">{{ getSessionStatusIcon() }}</v-icon>
            {{ getFormattedRemainingTime() }}
          </v-chip>
        </div>

        <v-list density="compact" class="bg-grey-lighten-4 mb-3">
          <v-list-item>
            <v-list-item-title>Estado de sesión</v-list-item-title>
            <v-list-item-subtitle>{{
              authStore.sessionActive ? 'Activa' : 'Inactiva'
            }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item v-if="authStore.isAuthenticated">
            <v-list-item-title>Tiempo restante</v-list-item-title>
            <v-list-item-subtitle>{{ getFormattedRemainingTime() }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Token</v-list-item-title>
            <v-list-item-subtitle>{{
              authStore.token ? 'Presente' : 'Ausente'
            }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Usuario ID</v-list-item-title>
            <v-list-item-subtitle>{{ authStore.userId || 'No disponible' }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Nombre de usuario</v-list-item-title>
            <v-list-item-subtitle>{{ authStore.username || 'No disponible' }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-alert
          v-if="authStore.isAuthenticated && authStore.tokenRemainingTime < AUTH_CONFIG.TOKEN_WARNING_THRESHOLD_MS / 1000"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          <div class="d-flex align-center">
            <v-icon start>mdi-information</v-icon>
            <div>
              <strong>Renovación automática</strong>
              <div class="text-caption">
                El token se renovará automáticamente mientras uses la aplicación.
              </div>
            </div>
          </div>
        </v-alert>

        <v-divider class="my-3"></v-divider>

        <!-- Estado de cuentas -->
        <h3 class="text-subtitle-1 font-weight-bold mb-2">Estado de cuentas</h3>
        <pre>cuentas cargadas: {{ accountStore.accounts.length }}</pre>
        <pre>cuenta seleccionada: {{ accountStore.selectedAccount?.ID || 'ninguna' }}</pre>

        <v-alert v-if="accountStore.error" type="error" class="mt-2">
          {{ accountStore.error }}
        </v-alert>

        <v-list v-if="accountStore.accounts.length > 0" class="mt-2 bg-grey-lighten-4">
          <v-list-item v-for="account in accountStore.accounts" :key="account.ID">
            <v-list-item-title>{{ account.Nickname || `Cuenta #${account.ID}` }}</v-list-item-title>
            <v-list-item-subtitle>{{ account.Email }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-btn color="secondary" @click="loadAccounts" :disabled="!authStore.isAuthenticated">
          Cargar cuentas
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="refreshSystemInfo">
          <v-icon start>mdi-refresh</v-icon>
          Refrescar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-navigation-drawer>
</template>

<style scoped>
.debug-panel {
  z-index: 1000;
  max-height: 90vh;
  overflow-y: auto;
}

.debug-panel .v-list-item-subtitle {
  word-break: break-all;
}

pre {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  margin: 4px 0;
  font-family: monospace;
  font-size: 0.9rem;
}
</style>
