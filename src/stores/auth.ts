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
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        error.value = axiosError.response?.data?.message || 'Error de autenticación. Verifica tus credenciales.'
      } else {
        error.value = 'Error de conexión. Intenta más tarde.'
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
