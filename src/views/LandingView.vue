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

// Función para cerrar sesión
const logout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <v-container fluid>
    <v-app-bar color="primary" dark app>
      <v-app-bar-nav-icon></v-app-bar-nav-icon>
      <v-toolbar-title>MYA Admin</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>mdi-bell</v-icon>
      </v-btn>
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
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
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="logout">
            <v-list-item-title>
              <v-icon start>mdi-logout</v-icon>
              Cerrar sesión
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
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
                <v-btn color="primary" variant="text">
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
                <v-btn color="primary" variant="text">
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
                <v-btn color="primary" variant="text">
                  Ver migraciones
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-footer app class="d-flex flex-column">
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
