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
const failedAttempts = ref(0)
const showForgotPasswordDialog = ref(false)
const forgotPasswordEmail = ref('')
const forgotPasswordSubmitted = ref(false)
const forgotPasswordLoading = ref(false)

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
  username: [
    (v: string) => !!v || 'El nombre de usuario es requerido',
    (v: string) => (v && v.trim() !== '') || 'El nombre de usuario no puede estar vacío',
    (v: string) => (v && v.length <= 50) || 'El nombre de usuario no puede exceder los 50 caracteres',
  ],
  password: [
    (v: string) => !!v || 'La contraseña es requerida',
    (v: string) => (v && v.trim() !== '') || 'La contraseña no puede estar vacía',
    (v: string) => (v && v.length >= 3) || 'La contraseña debe tener al menos 3 caracteres',
    (v: string) => (v && v.length <= 50) || 'La contraseña no puede exceder los 50 caracteres',
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
    // Reiniciar contador de intentos fallidos
    failedAttempts.value = 0
    
    // Si la opción de recordarme está activada, guardar preferencia
    if (rememberMe.value) {
      localStorage.setItem('remember_user', username.value)
    } else {
      localStorage.removeItem('remember_user')
    }

    // Redirigir a la página de landing después del login exitoso
    router.push('/landing')
  } else {
    // Incrementar contador de intentos fallidos
    failedAttempts.value++
  }
  // Si hay error, se muestra automáticamente desde el store
}

// Reglas de validación para el correo electrónico
const emailRules = [
  (v: string) => !!v || 'El correo electrónico es requerido',
  (v: string) => /.+@.+\..+/.test(v) || 'El correo electrónico debe ser válido',
]

// Función para manejar la solicitud de recuperación de contraseña
const handleForgotPassword = async () => {
  // Validar el correo electrónico
  if (!forgotPasswordEmail.value || !/.+@.+\..+/.test(forgotPasswordEmail.value)) {
    return
  }
  
  forgotPasswordLoading.value = true
  
  try {
    // Simular una llamada a la API para solicitar la recuperación de contraseña
    // En un entorno real, aquí se llamaría a un endpoint de la API
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Marcar como enviado
    forgotPasswordSubmitted.value = true
    
    // Cerrar el diálogo después de un tiempo
    setTimeout(() => {
      showForgotPasswordDialog.value = false
      forgotPasswordSubmitted.value = false
      forgotPasswordEmail.value = ''
    }, 3000)
  } catch (error) {
    console.error('Error al solicitar recuperación de contraseña:', error)
  } finally {
    forgotPasswordLoading.value = false
  }
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
                density="comfortable"
                closable
                border="start"
                icon="mdi-alert-circle"
              >
                <div class="d-flex align-center">
                  <div>
                    <strong class="text-subtitle-2">Error de inicio de sesión</strong>
                    <div class="text-body-2">{{ errorMessage }}</div>
                    <div class="text-caption mt-2" v-if="errorMessage.includes('Credenciales incorrectas') || errorMessage.includes('autenticacion') || errorMessage.includes('inválidos')">
                      <v-icon size="small" class="me-1">mdi-lightbulb</v-icon>
                      <span>Sugerencia: Verifica que no tengas activado el bloqueo de mayúsculas y que estés usando las credenciales correctas.</span>
                    </div>
                    <div class="text-caption mt-2" v-if="errorMessage.includes('conexión')">
                      <v-icon size="small" class="me-1">mdi-lightbulb</v-icon>
                      <span>Sugerencia: Verifica tu conexión a internet o contacta al administrador del sistema.</span>
                    </div>
                    <div class="text-caption mt-2" v-if="failedAttempts >= 3">
                      <v-icon size="small" color="warning" class="me-1">mdi-alert</v-icon>
                      <span>Has realizado {{ failedAttempts }} intentos fallidos. Si olvidaste tu contraseña, haz clic en "Olvidaste tu contraseña".</span>
                    </div>
                  </div>
                </div>
              </v-alert>

              <div class="d-flex justify-space-between align-center mb-4">
                <v-checkbox
                  v-model="rememberMe"
                  label="Recordarme"
                  hide-details
                  density="compact"
                />
                <v-btn 
                  variant="text" 
                  color="primary" 
                  class="text-caption" 
                  density="compact"
                  @click="showForgotPasswordDialog = true"
                >
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

        </v-card>

        <div class="text-center mt-6">
          <p class="text-caption text-medium-emphasis">
            &copy; {{ new Date().getFullYear() }} MYA. Todos los derechos reservados.
          </p>
        </div>
      </v-col>
    </v-row>
    
    <!-- Diálogo de recuperación de contraseña -->
    <v-dialog v-model="showForgotPasswordDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 pb-2">
          <v-icon start color="primary" class="me-2">mdi-lock-reset</v-icon>
          Recuperar contraseña
        </v-card-title>
        
        <v-card-text>
          <div v-if="!forgotPasswordSubmitted">
            <p class="text-body-2 mb-4">
              Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
            </p>
            
            <v-form @submit.prevent="handleForgotPassword">
              <v-text-field
                v-model="forgotPasswordEmail"
                :rules="emailRules"
                label="Correo electrónico"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                required
                autocomplete="email"
              />
            </v-form>
          </div>
          
          <div v-else class="text-center py-4">
            <v-icon color="success" size="large" class="mb-4">mdi-check-circle</v-icon>
            <h3 class="text-h6 mb-2">Solicitud enviada</h3>
            <p class="text-body-2">
              Hemos enviado un correo electrónico con instrucciones para restablecer tu contraseña.
              Por favor, revisa tu bandeja de entrada.
            </p>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="showForgotPasswordDialog = false"
            :disabled="forgotPasswordLoading"
          >
            Cancelar
          </v-btn>
          <v-btn
            v-if="!forgotPasswordSubmitted"
            color="primary"
            variant="elevated"
            @click="handleForgotPassword"
            :loading="forgotPasswordLoading"
            :disabled="!forgotPasswordEmail || !/.+@.+\..+/.test(forgotPasswordEmail)"
          >
            Enviar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
</style>
