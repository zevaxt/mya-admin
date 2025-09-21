import { ref, computed, onUnmounted } from 'vue'
import { defineStore } from 'pinia'
import { authService, type User, type LoginRequest } from '@/services/api'
import tokenService from '@/services/tokenService'
import { AUTH_CONFIG } from '@/config/auth.config'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref<User | null>(null)
  const userId = ref<number | null>(null) // Añadir userId para acceso rápido
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const tokenRefreshTimer = ref<number | null>(null)
  const sessionActive = ref<boolean>(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value && sessionActive.value)
  const username = computed(() => user.value?.Username || '')
  const currentUserId = computed(() => userId.value)
  const tokenRemainingTime = computed(() => token.value ? tokenService.getTokenRemainingTime(token.value) : 0)

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
        // Configurar la renovación automática del token
        setupTokenRefresh(response.token)
      }
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('userId', String(userId.value))
      sessionActive.value = true
      
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
    // Cancelar el temporizador de renovación de token
    if (tokenRefreshTimer.value !== null) {
      tokenService.clearTokenRefresh(tokenRefreshTimer.value)
      tokenRefreshTimer.value = null
    }
    
    user.value = null
    userId.value = null
    token.value = null
    sessionActive.value = false
    authService.logout()
    localStorage.removeItem('userId')
  }

  // Inicializar estado desde localStorage (para persistencia)
  function init() {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedUserId = localStorage.getItem('userId')
    
    if (storedToken) {
      // Verificar si el token almacenado es válido
      if (!tokenService.isTokenExpired(storedToken)) {
        token.value = storedToken
        sessionActive.value = true
        
        // Configurar la renovación automática del token
        setupTokenRefresh(storedToken)
      } else {
        // Si el token está expirado, intentar renovarlo
        tokenService.refreshToken()
          .then(newToken => {
            if (newToken) {
              token.value = newToken
              sessionActive.value = true
              setupTokenRefresh(newToken)
            } else {
              // Si no se puede renovar, limpiar la sesión
              logout()
            }
          })
          .catch(() => {
            // Error al renovar, limpiar la sesión
            logout()
          })
      }
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

  // Función para configurar la renovación automática del token
  function setupTokenRefresh(currentToken: string) {
    // Cancelar cualquier temporizador existente
    if (tokenRefreshTimer.value !== null) {
      tokenService.clearTokenRefresh(tokenRefreshTimer.value)
    }
    
    // Configurar el nuevo temporizador
    tokenRefreshTimer.value = tokenService.setupTokenRefresh(
      currentToken,
      // Callback para cuando la renovación es exitosa
      (newToken) => {
        token.value = newToken
        console.log('Token renovado automáticamente')
      },
      // Callback para cuando la renovación falla
      () => {
        console.warn('No se pudo renovar el token, cerrando sesión')
        logout()
      }
    )
  }
  
  // Verificar el estado del token periódicamente
  function setupTokenCheck() {
    let checkInterval: number | null = null
    
    // Función para verificar el token
    const checkToken = () => {
      if (token.value && tokenService.isTokenExpired(token.value)) {
        console.warn('Token expirado detectado durante verificación periódica')
        logout()
      }
    }
    
    // Iniciar el intervalo de verificación
    const startCheckInterval = () => {
      if (checkInterval === null) {
        checkInterval = window.setInterval(checkToken, AUTH_CONFIG.TOKEN_CHECK_INTERVAL_MS)
      }
    }
    
    // Detener el intervalo de verificación
    const stopCheckInterval = () => {
      if (checkInterval !== null) {
        clearInterval(checkInterval)
        checkInterval = null
      }
    }
    
    // Registrar eventos de visibilidad de la página para optimizar recursos
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Verificar inmediatamente cuando la página vuelve a ser visible
        checkToken()
        startCheckInterval()
      } else {
        // Pausar verificaciones cuando la página no está visible
        stopCheckInterval()
      }
    })
    
    // Iniciar el intervalo de verificación
    startCheckInterval()
    
    // Limpiar eventos e intervalos cuando el componente se desmonte
    onUnmounted(() => {
      stopCheckInterval()
      document.removeEventListener('visibilitychange', () => {})
    })
  }
  
  // Inicializar al crear el store
  init()
  setupTokenCheck()

  return {
    user,
    userId,
    token,
    loading,
    error,
    isAuthenticated,
    username,
    currentUserId,
    tokenRemainingTime,
    sessionActive,
    login,
    logout
  }
})
