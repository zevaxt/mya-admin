<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'
import AccountSelector from './AccountSelector.vue'

const authStore = useAuthStore()
const router = useRouter()

// Función para cerrar sesión
const logout = () => {
  authStore.logout()
  router.push('/')
}

// Inicializar el componente
onMounted(() => {
  // Cualquier inicialización necesaria puede ir aquí
})
</script>

<template>
  <v-app-bar color="primary" dark app>
    <v-app-bar-nav-icon></v-app-bar-nav-icon>
    
    <v-toolbar-title>MYA Admin</v-toolbar-title>
    
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
          <v-list-item-subtitle>
            ID: {{ authStore.currentUserId }}
          </v-list-item-subtitle>
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
</template>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
