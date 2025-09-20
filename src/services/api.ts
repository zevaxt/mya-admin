// API Service para manejar las peticiones HTTP
import axios from 'axios'

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4200',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para añadir el token de autenticación a todas las solicitudes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

// Interceptores para manejar errores de respuesta
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Capturar errores relacionados con la autenticación
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('Error de autenticación:', error.response.status, error.response.data)

        // Si hay un error de token expirado o inválido, podemos limpiar el localStorage
        if (
          error.response.data &&
          (error.response.data.message?.includes('token') ||
            error.response.data.error?.includes('token'))
        ) {
          console.warn('Token inválido o expirado, cerrando sesión...')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('userId')

          // Redirigir a la página de login si es necesario
          // window.location.href = '/'
        }
      }
    }

    return Promise.reject(error)
  },
)

// Tipos para la API
export interface LoginRequest {
  username: string
  password: string
}

export interface Account {
  ID: number
  CreatedAt: string
  UpdatedAt: string
  DeletedAt: string | null
  ProviderID: number
  UserID: number
  AuthorizationCode: string
  Email: string
  Nickname: string
  Code: string
}

export interface User {
  ID: number
  CreatedAt: string
  UpdatedAt: string
  DeletedAt: null | string
  Password: string
  Username: string
  Accounts: Account[] | null
  Token?: string // Token JWT devuelto por la API
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
      try {
        // Intentar hacer login con la API
        const response = await apiClient.post('/v1/signin', credentials)

        // Obtener los datos del usuario y el token de la respuesta
        const userData = response.data as User

        // Verificar si el token viene en la respuesta
        if (!userData.Token) {
          console.error('Error de autenticación: La API no devolvió un token')
          throw new Error('No se recibió un token de autenticación válido')
        }

        console.log('Token recibido de la API:', userData.Token.substring(0, 20) + '...')

        return {
          token: userData.Token,
          user: userData,
          userId: userData.ID, // Incluir el ID del usuario para acceso rápido
        }
      } catch (error) {
        // Registrar el error para depuración
        console.error('Error en la autenticación:', error)

        // Mensaje personalizado según el tipo de error
        // Verificar si es un error de Axios
        if (error && typeof error === 'object' && 'response' in error) {
          // Definir un tipo más específico para el error de Axios
          const axiosError = error as {
            response?: {
              status?: number
              data?: Record<string, unknown>
            }
            request?: unknown
          }

          if (axiosError.response?.status) {
            const status = axiosError.response.status

            if (status === 401 || status === 403) {
              throw new Error(
                'Credenciales incorrectas. Por favor, verifica tu nombre de usuario y contraseña',
              )
            } else if (status === 404) {
              throw new Error('El servicio de autenticación no está disponible en esta ruta')
            } else if (status >= 500) {
              throw new Error('Error en el servidor. Por favor, intenta más tarde')
            }
          } else if (axiosError.request) {
            throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet')
          }
        }

        // Si no se identificó un error específico, reenviar el error original
        if (error instanceof Error) {
          throw error
        } else {
          throw new Error('Error desconocido durante la autenticación')
        }
      }
    } catch (error: unknown) {
      // Manejar el error con tipado seguro
      if (error instanceof Error) {
        console.error('Error en login:', error.message)

        // Personalizar mensaje de error para el usuario
        if (error.message.includes('token')) {
          throw new Error('Error de autenticación: No se pudo obtener un token válido')
        } else if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error(
            'Credenciales incorrectas. Por favor, verifica tu nombre de usuario y contraseña',
          )
        } else if (error.message.includes('500')) {
          throw new Error('Error en el servidor. Por favor, intenta más tarde')
        } else if (error.message.includes('timeout') || error.message.includes('network')) {
          throw new Error('Error de conexión. Verifica tu conexión a internet')
        }
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
  },
}

export default apiClient
