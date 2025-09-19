// API Service para manejar las peticiones HTTP
import axios from 'axios'

const API_URL = 'http://localhost:4200'

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para añadir el token a las peticiones autenticadas
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Tipos para la API
export interface LoginRequest {
  username: string
  password: string
}

export interface Account {
  id: number
  name: string
  status: string
}

export interface User {
  ID: number
  CreatedAt: string
  UpdatedAt: string
  DeletedAt: null | string
  Password: string
  Username: string
  Accounts: Account[] | null
}

export interface LoginResponse {
  token?: string
  user: User
  userId?: number // ID del usuario para acceso rápido
}

// Servicios de autenticación
export const authService = {
  // Login con username y password
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/v1/signin', credentials)
      
      // Simular un token ya que la API no lo devuelve explícitamente
      // En una implementación real, el token vendría en la respuesta
      const token = `simulated-jwt-token-${Date.now()}`
      const userData = response.data as User
      
      return {
        token,
        user: userData,
        userId: userData.ID // Incluir el ID del usuario para acceso rápido
      }
    } catch (error: unknown) {
      // Manejar el error con tipado seguro
      if (error instanceof Error) {
        console.error('Error en login:', error.message)
      } else {
        console.error('Error desconocido en login')
      }
      throw error
    }
  },

  // Cerrar sesión
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userId')
  },

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  }
}

export default apiClient
