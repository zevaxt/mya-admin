<script setup lang="ts">
// App.vue - Componente raíz
import AppNavBar from './components/AppNavBar.vue'
// El panel de depuración ahora está integrado en AppNavBar
import { useAuthStore } from './stores/auth'
import { computed, onMounted } from 'vue'

const authStore = useAuthStore()

// Determinar si se debe mostrar la barra de navegación
// No mostrarla en la página de login
const showNavBar = computed(() => {
  return authStore.isAuthenticated
})

// Inicializar la aplicación
onMounted(() => {
  // Cualquier inicialización necesaria puede ir aquí
})
</script>

<template>
  <v-app>
    <!-- Barra de navegación global -->
    <AppNavBar v-if="showNavBar" />
    
    <v-main :class="{ 'pt-0': !showNavBar }">
      <router-view />
    </v-main>
    
    <!-- El panel de depuración ahora está integrado en AppNavBar -->
  </v-app>
</template>

<style>
/* Estilos globales */
html, body {
  overflow-y: auto;
  width: 100%;
  height: 100%;
}
</style>
