<template>
  <div class="profile-view">
    <v-container>
      <v-row>
        <v-col cols="12" md="8" lg="6" class="mx-auto">
          <v-card class="mb-6">
            <v-card-title class="text-h5 font-weight-bold">
              <v-icon start color="primary" icon="mdi-account-circle" size="large"></v-icon>
              Perfil de Usuario
            </v-card-title>
            
            <v-divider></v-divider>
            
            <v-card-text>
              <div v-if="loading" class="d-flex justify-center align-center py-4">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>
              
              <div v-else>
                <v-list lines="two">
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-account</v-icon>
                    </template>
                    <v-list-item-title class="text-subtitle-1 font-weight-medium">
                      Nombre de usuario
                    </v-list-item-title>
                    <v-list-item-subtitle>{{ authStore.username }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item v-if="userEmail">
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-email</v-icon>
                    </template>
                    <v-list-item-title class="text-subtitle-1 font-weight-medium">
                      Correo electrónico
                    </v-list-item-title>
                    <v-list-item-subtitle>{{ userEmail }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-clock-outline</v-icon>
                    </template>
                    <v-list-item-title class="text-subtitle-1 font-weight-medium">
                      Sesión activa
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip
                        :color="authStore.isAuthenticated ? 'success' : 'error'"
                        size="small"
                        class="font-weight-medium"
                      >
                        {{ authStore.isAuthenticated ? 'Activa' : 'Inactiva' }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item v-if="authStore.isAuthenticated">
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-timer-outline</v-icon>
                    </template>
                    <v-list-item-title class="text-subtitle-1 font-weight-medium">
                      Tiempo restante de sesión
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatRemainingTime(authStore.tokenRemainingTime) }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Sección de cambio de contraseña -->
          <v-card>
            <v-card-title class="text-h5 font-weight-bold">
              <v-icon start color="primary" icon="mdi-lock" size="large"></v-icon>
              Cambiar Contraseña
            </v-card-title>
            
            <v-divider></v-divider>
            
            <v-card-text>
              <v-alert
                v-if="authStore.username"
                type="info"
                variant="tonal"
                class="mb-4"
                density="comfortable"
                border="start"
                icon="mdi-information-outline"
              >
                <div class="text-subtitle-2 font-weight-medium">Usuario: {{ authStore.username }}</div>
                <div class="text-body-2">Vas a cambiar la contraseña para este usuario.</div>
              </v-alert>
              
              <v-form ref="passwordForm" v-model="passwordFormValid" @submit.prevent="changePassword">
                <v-text-field
                  v-model="passwordData.currentPassword"
                  label="Contraseña actual"
                  :append-icon="showCurrentPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  @click:append="showCurrentPassword = !showCurrentPassword"
                  variant="outlined"
                  :rules="[rules.required]"
                  density="comfortable"
                  class="mb-3"
                  :error-messages="passwordErrors.currentPassword"
                  persistent-placeholder
                  @blur="validateField('currentPassword')"
                ></v-text-field>
                
                <v-text-field
                  v-model="passwordData.newPassword"
                  label="Nueva contraseña"
                  :append-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="showNewPassword ? 'text' : 'password'"
                  @click:append="showNewPassword = !showNewPassword"
                  variant="outlined"
                  :rules="[rules.required, rules.min]"
                  density="comfortable"
                  class="mb-3"
                  :error-messages="passwordErrors.newPassword"
                  persistent-placeholder
                  @blur="validateField('newPassword')"
                ></v-text-field>
                
                <v-text-field
                  v-model="passwordData.confirmPassword"
                  label="Confirmar nueva contraseña"
                  :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  @click:append="showConfirmPassword = !showConfirmPassword"
                  variant="outlined"
                  :rules="[rules.required, rules.passwordMatch]"
                  density="comfortable"
                  class="mb-3"
                  :error-messages="passwordErrors.confirmPassword"
                  persistent-placeholder
                  @blur="validateField('confirmPassword')"
                ></v-text-field>
                
                <div class="d-flex justify-end">
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="changingPassword"
                    :disabled="!passwordFormValid || changingPassword"
                  >
                    Cambiar Contraseña
                  </v-btn>
                </div>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    
    <!-- Notificación -->
    <v-snackbar
      v-model="showNotification"
      :color="notificationType"
      :timeout="3000"
      location="top"
    >
      {{ notificationMessage }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="showNotification = false"
        ></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import userService, { type PasswordChangeRequest } from '@/services/userService'
import { useRouter } from 'vue-router'

// Inicializar router
const router = useRouter()

// Configuración del formulario
const passwordForm = ref<HTMLFormElement | null>(null)
const passwordFormValid = ref(false)
const authStore = useAuthStore()
const loading = ref(false)
const changingPassword = ref(false)

// Estado para contraseñas visibles/ocultas
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Estado para errores de contraseña
const passwordErrors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Estado para notificaciones
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'warning'>('success')

// Datos de usuario
const userEmail = computed(() => {
  if (authStore.user?.Accounts && authStore.user.Accounts.length > 0) {
    return authStore.user.Accounts[0].Email
  }
  return ''
})

// Datos del formulario
const passwordData = ref<PasswordChangeRequest>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Reglas de validación
const rules = {
  required: (v: string) => !!v || 'Este campo es obligatorio',
  min: (v: string) => (v && v.length >= 8) || 'La contraseña debe tener al menos 8 caracteres',
  passwordMatch: (v: string) => v === passwordData.value.newPassword || 'Las contraseñas no coinciden'
}

// Validar campo específico
const validateField = (field: 'currentPassword' | 'newPassword' | 'confirmPassword') => {
  // Evitar limpiar el campo al perder el foco
  // Solo validar si es necesario
  if (field === 'currentPassword' && !passwordData.value.currentPassword) {
    const result = rules.required('')
    passwordErrors.value.currentPassword = typeof result === 'string' ? result : ''
  } else if (field === 'newPassword') {
    if (!passwordData.value.newPassword) {
      const result = rules.required('')
      passwordErrors.value.newPassword = typeof result === 'string' ? result : ''
    } else if (passwordData.value.newPassword.length < 8) {
      const result = rules.min(passwordData.value.newPassword)
      passwordErrors.value.newPassword = typeof result === 'string' ? result : ''
    } else {
      passwordErrors.value.newPassword = ''
    }
  } else if (field === 'confirmPassword') {
    if (!passwordData.value.confirmPassword) {
      const result = rules.required('')
      passwordErrors.value.confirmPassword = typeof result === 'string' ? result : ''
    } else if (passwordData.value.confirmPassword !== passwordData.value.newPassword) {
      const result = rules.passwordMatch(passwordData.value.confirmPassword)
      passwordErrors.value.confirmPassword = typeof result === 'string' ? result : ''
    } else {
      passwordErrors.value.confirmPassword = ''
    }
  }
}

// Formatear tiempo restante
const formatRemainingTime = (seconds: number): string => {
  if (seconds <= 0) return 'Sesión expirada'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes} min ${remainingSeconds} seg`
  }
  return `${remainingSeconds} segundos`
}

// Cargar datos del usuario
const loadUserProfile = async () => {
  loading.value = true
  try {
    const response = await userService.getUserProfile()
    if (response.success && response.user) {
      // Si es necesario actualizar datos adicionales del usuario
      // que no están en el store
      
      // Mostrar notificación de éxito
      showNotification.value = true
      notificationMessage.value = 'Perfil cargado exitosamente'
      notificationType.value = 'success'
      
      // Esperar un momento para que el usuario vea la notificación
      setTimeout(() => {
        // Redirigir a la página de landing
        router.push('/landing')
      }, 1500) // Esperar 1.5 segundos antes de redirigir
    }
  } catch (error) {
    console.error('Error al cargar perfil:', error)
    showNotification.value = true
    notificationMessage.value = 'Error al cargar los datos del perfil'
    notificationType.value = 'error'
  } finally {
    loading.value = false
  }
}

// Cambiar contraseña
const changePassword = async () => {
  if (!passwordFormValid.value) return
  
  // Limpiar errores previos
  passwordErrors.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  
  changingPassword.value = true
  try {
    const response = await userService.changePassword(passwordData.value)
    
    showNotification.value = true
    notificationMessage.value = response.message
    notificationType.value = response.success ? 'success' : 'error'
    
    if (response.success) {
      // Limpiar formulario
      passwordData.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      if (passwordForm.value) {
        passwordForm.value.reset()
      }
      
      // Esperar un momento y redirigir a landing
      setTimeout(() => {
        router.push('/landing')
      }, 2000) // Esperar 2 segundos antes de redirigir
    } else {
      // Manejar errores específicos
      if (response.message.toLowerCase().includes('contraseña actual') || 
          response.message.toLowerCase().includes('credenciales')) {
        passwordErrors.value.currentPassword = response.message
      } else if (response.message.toLowerCase().includes('nueva')) {
        passwordErrors.value.newPassword = response.message
      }
    }
  } catch (error) {
    console.error('Error al cambiar contraseña:', error)
    showNotification.value = true
    notificationMessage.value = 'Error al procesar la solicitud. Inténtelo nuevamente'
    notificationType.value = 'error'
  } finally {
    changingPassword.value = false
  }
}

// Cargar datos al montar el componente
onMounted(() => {
  loadUserProfile()
})
</script>

<style scoped>
.profile-view {
  padding: 24px 0;
}
</style>
