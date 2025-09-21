import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authService, type User, type LoginRequest } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref<User | null>(null)
  const userId = ref<number | null>(null) // Añadir userId para acceso rápido
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const username = computed(() => user.value?.Username || '')
  const currentUserId = computed(() => userId.value)

  // Acciones
  async function login(credentials: LoginRequest) {
    loading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)
      
      // Guardar en el store
      user.value = response.user
      userId.value = response.userId || response.user.ID
      token.value = response.token || null
      
      // Guardar en localStorage para persistencia
      if (response.token) {
        localStorage.setItem('token', response.token)
      }
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('userId', String(userId.value))
      
      return true
    } catch (err: unknown) {
      console.error('Error en login:', err)
      
      // Manejar el error con tipado seguro
      if (err instanceof Error) {
        // Si es un error con mensaje específico, usarlo directamente
        error.value = err.message
      } else if (err && typeof err === 'object' && 'response' in err) {
        // Definir una interfaz para la estructura de respuesta del servidor
        interface ApiErrorResponse {
          Code?: string;
          Status?: number;
          Message?: string;
          TecnicalDetails?: string;
          message?: string; // Formato alternativo
          [key: string]: unknown; // Para otros campos que puedan existir
        }
        
        const axiosError = err as { 
          response?: { 
            data?: ApiErrorResponse, 
            status?: number 
          } 
        }
        
        // Estructura de respuesta esperada del servidor
        // {
        //   "Code": "003",
        //   "Status": 401,
        //   "Message": "Sus datos de autenticacion son invalidos por favor intente nuevamente",
        //   "TecnicalDetails": "credenciales inválidas: contraseña incorrecta"
        // }
        
        // Verificar si la respuesta tiene la estructura esperada
        if (axiosError.response?.data?.Message) {
          // Usar el mensaje proporcionado por el servidor
          error.value = axiosError.response.data.Message
        } else if (axiosError.response?.data?.message) {
          // Formato alternativo de mensaje
          error.value = axiosError.response.data.message
        } else {
          // Mensajes personalizados según el código de estado
          switch (axiosError.response?.status) {
            case 401:
            case 403:
              error.value = 'Credenciales incorrectas. Por favor, verifica tu nombre de usuario y contraseña.'
              break
            case 404:
              error.value = 'El servicio de autenticación no está disponible. Por favor, contacta al administrador.'
              break
            case 429:
              error.value = 'Demasiados intentos fallidos. Por favor, espera unos minutos e intenta nuevamente.'
              break
            case 500:
            case 502:
            case 503:
              error.value = 'Error en el servidor. Por favor, intenta más tarde o contacta al soporte técnico.'
              break
            default:
              error.value = 'Error de autenticación. Verifica tus credenciales.'
          }
        }
        
        // Para depuración, registrar la estructura completa del error
        console.log('Estructura completa del error:', axiosError.response?.data)
      } else {
        error.value = 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.'
      }
      
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    userId.value = null
    token.value = null
    authService.logout()
    localStorage.removeItem('userId')
  }

  // Inicializar estado desde localStorage (para persistencia)
  function init() {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedUserId = localStorage.getItem('userId')
    
    if (storedToken) {
      token.value = storedToken
    }
    
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (err) {
        console.error('Error al parsear usuario almacenado:', err)
      }
    }
    
    if (storedUserId) {
      try {
        userId.value = parseInt(storedUserId, 10)
      } catch (err) {
        console.error('Error al parsear ID de usuario almacenado:', err)
      }
    }
  }

  // Inicializar al crear el store
  init()

  return {
    user,
    userId,
    token,
    loading,
    error,
    isAuthenticated,
    username,
    currentUserId,
    login,
    logout
  }
})
