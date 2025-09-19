<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Importar computed
import { computed } from 'vue'

const router = useRouter()
const authStore = useAuthStore()

// Estado del formulario
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const formValid = ref(true)
const rememberMe = ref(false)

// Usar el estado del store para loading y error
const loading = computed(() => authStore.loading)
const errorMessage = computed(() => authStore.error)

// Cargar usuario recordado al montar el componente
onMounted(() => {
  const rememberedUser = localStorage.getItem('remember_user')
  if (rememberedUser) {
    username.value = rememberedUser
    rememberMe.value = true
  }
})

const rules = {
  username: [(v: string) => !!v || 'El nombre de usuario es requerido'],
  password: [
    (v: string) => !!v || 'La contraseña es requerida',
    (v: string) => v.length >= 3 || 'La contraseña debe tener al menos 3 caracteres',
  ],
}

const login = async () => {
  // Validar formulario
  if (!formValid.value) return

  // Llamar al store para hacer login
  const success = await authStore.login({
    username: username.value,
    password: password.value,
  })

  if (success) {
    // Si la opción de recordarme está activada, guardar preferencia
    if (rememberMe.value) {
      localStorage.setItem('remember_user', username.value)
    } else {
      localStorage.removeItem('remember_user')
    }

    // Redirigir a la página de landing después del login exitoso
    router.push('/landing')
  }
  // Si hay error, se muestra automáticamente desde el store
}
</script>

<template>
  <v-container fluid class="fill-height login-container">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12 rounded-lg">
          <v-card-title class="text-center pt-8 pb-4">
            <v-img src="/logo-meli.png" alt="Logo" contain height="60" class="mx-auto mb-4" />
            <h1 class="text-h5 font-weight-bold primary--text">MYA Admin</h1>
          </v-card-title>

          <v-card-text>
            <p class="text-subtitle-1 text-center mb-6">
              Inicia sesión para administrar tus productos
            </p>

            <v-form @submit.prevent="login" v-model="formValid">
              <v-text-field
                v-model="username"
                :rules="rules.username"
                label="Nombre de usuario"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                required
                autocomplete="username"
              />

              <v-text-field
                v-model="password"
                :rules="rules.password"
                label="Contraseña"
                prepend-inner-icon="mdi-lock"
                variant="outlined"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                required
                autocomplete="current-password"
              />

              <v-alert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                class="mb-4"
                density="compact"
              >
                {{ errorMessage }}
              </v-alert>

              <div class="d-flex justify-space-between align-center mb-4">
                <v-checkbox
                  v-model="rememberMe"
                  label="Recordarme"
                  hide-details
                  density="compact"
                />
                <v-btn variant="text" color="primary" class="text-caption" density="compact">
                  ¿Olvidaste tu contraseña?
                </v-btn>
              </div>

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="loading"
                :disabled="!formValid || loading"
              >
                Iniciar sesión
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-actions class="justify-center pb-6">
            <span class="text-body-2">¿No tienes una cuenta?</span>
            <v-btn
              variant="text"
              color="primary"
              class="text-body-2 font-weight-bold"
              @click="router.push('/register')"
            >
              Regístrate
            </v-btn>
          </v-card-actions>

          <!-- Botón de desarrollo para inicio rápido -->
          <v-card-actions class="justify-center pb-2">
            <v-btn
              color="success"
              variant="outlined"
              size="small"
              @click="() => {
                username = 'admin'
                password = 'password123'
                login()
              }"
            >
              Inicio rápido (desarrollo)
            </v-btn>
          </v-card-actions>
        </v-card>

        <div class="text-center mt-6">
          <p class="text-caption text-medium-emphasis">
            &copy; {{ new Date().getFullYear() }} MYA. Todos los derechos reservados.
          </p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
</style>
