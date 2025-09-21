<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

// Verificar autenticación al cargar la página
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/')
  }
})
</script>

<template>
  <v-container fluid>
        <v-row>
          <v-col cols="12">
            <v-card class="mb-4">
              <v-card-title class="text-h5">
                Bienvenido, {{ authStore.username }}
              </v-card-title>
              <v-card-subtitle>
                ID de usuario: {{ authStore.currentUserId }}
              </v-card-subtitle>
              <v-card-text>
                <p>Has iniciado sesión correctamente en el panel de administración.</p>
                <p class="mt-4">Desde aquí podrás gestionar tus productos y configuraciones.</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="4">
            <v-card class="mb-4">
              <v-card-title class="text-h6">
                <v-icon start color="primary" icon="mdi-package-variant"></v-icon>
                Productos
              </v-card-title>
              <v-card-text>
                Administra tu catálogo de productos, precios y stock.
              </v-card-text>
              <v-card-actions>
                <v-btn color="primary" variant="text" to="/products">
                  Ver productos
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
          
          <v-col cols="12" md="4">
            <v-card class="mb-4">
              <v-card-title class="text-h6">
                <v-icon start color="primary" icon="mdi-account-group"></v-icon>
                Proveedores
              </v-card-title>
              <v-card-text>
                Gestiona tus proveedores y sus productos asociados.
              </v-card-text>
              <v-card-actions>
                <v-btn color="primary" variant="text" to="/providers">
                  Ver proveedores
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
          
          <v-col cols="12" md="4">
            <v-card class="mb-4">
              <v-card-title class="text-h6">
                <v-icon start color="primary" icon="mdi-swap-horizontal"></v-icon>
                Migraciones
              </v-card-title>
              <v-card-text>
                Realiza migraciones de productos entre cuentas.
              </v-card-text>
              <v-card-actions>
                <v-btn color="primary" variant="text" to="/migrations">
                  Ver migraciones
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      <v-footer app class="d-flex flex-column mt-8">
      <div class="text-center">
        <span>&copy; {{ new Date().getFullYear() }} MYA. Todos los derechos reservados.</span>
      </div>
    </v-footer>
  </v-container>
</template>

<style scoped>
.v-main {
  background-color: #f5f5f5;
}
</style>
