<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useAuthStore } from '@/stores/auth'
import type { Account } from '@/services/api'

const accountStore = useAccountStore()
const authStore = useAuthStore()
const loading = ref(false)
const menuOpen = ref(false)

// Cargar cuentas al montar el componente solo si no hay cuentas ya cargadas
onMounted(async () => {
  if (authStore.isAuthenticated && accountStore.accounts.length === 0) {
    // Verificar que exista el token
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No hay token de autenticación disponible')
      return
    }

    console.log('Token disponible:', token.substring(0, 10) + '...')
    loading.value = true
    try {
      await accountStore.fetchUserAccounts()
    } catch (error) {
      console.error('Error al cargar cuentas:', error)
    } finally {
      loading.value = false
    }
  }
})

// Observar cambios en la autenticación
watch(
  () => authStore.isAuthenticated,
  async (isAuthenticated) => {
    // Solo cargar cuentas si el usuario está autenticado y no hay cuentas cargadas
    if (isAuthenticated && accountStore.accounts.length === 0) {
      // Verificar que exista el token
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No hay token de autenticación disponible')
        return
      }

      loading.value = true
      try {
        await accountStore.fetchUserAccounts()
        console.log('Cuentas cargadas por cambio en autenticación:', accountStore.accounts.length)
      } catch (error) {
        console.error('Error al cargar cuentas:', error)
      } finally {
        loading.value = false
      }
    }
  },
)

// Función para seleccionar una cuenta
const selectAccount = (account: Account) => {
  accountStore.selectAccount(account)
  menuOpen.value = false
}
</script>

<template>
  <div class="account-selector">
    <!-- Botón de actualización de cuentas -->
    <v-btn
      icon
      size="small"
      color="white"
      variant="outlined"
      class="mb-1 refresh-btn"
      :loading="loading"
      @click="
        async () => {
          // Evitar múltiples clics mientras carga
          if (loading) return

          loading = true
          try {
            await accountStore.fetchUserAccounts()
            console.log('Cuentas actualizadas manualmente:', accountStore.accounts.length)
          } catch (error) {
            console.error('Error al actualizar cuentas:', error)
          } finally {
            loading = false
          }
        }
      "
    >
      <v-icon>mdi-refresh</v-icon>
      <v-tooltip activator="parent" location="bottom"> Actualizar cuentas </v-tooltip>
    </v-btn>

    <v-menu v-model="menuOpen" :close-on-content-click="false" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          color="primary"
          v-bind="props"
          :loading="loading"
          :disabled="!authStore.isAuthenticated"
          class="account-selector-btn"
        >
          <template v-if="accountStore.currentAccount">
            <v-icon start>mdi-store</v-icon>
            {{
              accountStore.currentAccount.Nickname ||
              accountStore.currentAccount.Email ||
              `Cuenta #${accountStore.currentAccount.ID}`
            }}
          </template>
          <template v-else>
            <v-icon start>mdi-store-off</v-icon>
            Sin cuenta seleccionada
          </template>
          <v-icon end>mdi-chevron-down</v-icon>
        </v-btn>
      </template>

      <v-card min-width="300" max-width="400">
        <v-card-title class="text-subtitle-1 font-weight-bold"> Seleccionar cuenta </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-0">
          <v-list>
            <v-list-item
              v-for="account in accountStore.accounts"
              :key="account.ID"
              :active="accountStore.currentAccount?.ID === account.ID"
              @click="selectAccount(account)"
            >
              <template v-slot:prepend>
                <v-icon
                  :color="accountStore.currentAccount?.ID === account.ID ? 'primary' : undefined"
                >
                  {{
                    accountStore.currentAccount?.ID === account.ID
                      ? 'mdi-check-circle'
                      : 'mdi-store'
                  }}
                </v-icon>
              </template>

              <v-list-item-title>
                {{ account.Nickname || `Cuenta #${account.ID}` }}
              </v-list-item-title>

              <v-list-item-subtitle>
                {{ account.Email || 'Sin correo' }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="accountStore.accounts.length === 0">
              <v-list-item-title class="text-center text-disabled">
                No hay cuentas disponibles
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="menuOpen = false"> Cerrar </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<style scoped>
.account-selector {
  display: inline-block;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 2px;
  background-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.account-selector-btn {
  min-width: 180px;
  text-transform: none;
  font-weight: bold;
  color: white !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.refresh-btn {
  margin-right: 4px;
  border-color: rgba(255, 255, 255, 0.6) !important;
}
</style>
