<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useAccountStore } from '@/stores/account'
import { ref } from 'vue'

const authStore = useAuthStore()
const accountStore = useAccountStore()
const showDebug = ref(false)

// Ya no simulamos el login para mantener consistencia con el resto del sistema

// Función para cargar cuentas
const loadAccounts = async () => {
  await accountStore.fetchUserAccounts()
}
</script>

<template>
  <v-card class="debug-panel" elevation="8">
    <v-card-title class="d-flex justify-space-between bg-grey-lighten-3">
      <span class="text-primary font-weight-bold">
        <v-icon color="primary" class="mr-1">mdi-bug</v-icon>
        Panel de depuración
      </span>
      <v-btn icon @click="showDebug = !showDebug" color="primary">
        <v-icon>{{ showDebug ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </v-btn>
    </v-card-title>

    <v-expand-transition>
      <div v-if="showDebug">
        <v-card-text>
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Estado de autenticación</h3>
          <pre>isAuthenticated: {{ authStore.isAuthenticated }}</pre>
          <pre>token: {{ authStore.token ? '✓' : '✗' }}</pre>
          <pre>userId: {{ authStore.userId }}</pre>
          <pre>username: {{ authStore.username }}</pre>

          <v-divider class="my-3"></v-divider>

          <h3 class="text-subtitle-1 font-weight-bold mb-2">Estado de cuentas</h3>
          <pre>cuentas cargadas: {{ accountStore.accounts.length }}</pre>
          <pre>cuenta seleccionada: {{ accountStore.selectedAccount?.ID || 'ninguna' }}</pre>

          <v-alert v-if="accountStore.error" type="error" class="mt-2">
            {{ accountStore.error }}
          </v-alert>

          <v-list v-if="accountStore.accounts.length > 0" class="mt-2 bg-grey-lighten-4">
            <v-list-item v-for="account in accountStore.accounts" :key="account.ID">
              <v-list-item-title>{{
                account.Nickname || `Cuenta #${account.ID}`
              }}</v-list-item-title>
              <v-list-item-subtitle>{{ account.Email }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-btn color="secondary" @click="loadAccounts" :disabled="!authStore.isAuthenticated">
            Cargar cuentas
          </v-btn>
          <v-btn color="error" @click="authStore.logout" :disabled="!authStore.isAuthenticated">
            Cerrar sesión
          </v-btn>
        </v-card-actions>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<style scoped>
.debug-panel {
  position: fixed;
  bottom: 25px;
  right: 10px;
  left: auto;
  width: 350px;
  z-index: 1000;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
