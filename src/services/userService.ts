// Servicio para manejar operaciones relacionadas con el usuario
import apiClient from './api'
import type { User } from './api'

export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UserProfileResponse {
  success: boolean
  message: string
  user?: User
}

export interface PasswordChangeResponse {
  success: boolean
  message: string
}

export const userService = {
  // Obtener perfil del usuario actual
  async getUserProfile(): Promise<UserProfileResponse> {
    try {
      const response = await apiClient.get('/v1/user/profile')
      return {
        success: true,
        message: 'Perfil obtenido exitosamente',
        user: response.data,
      }
    } catch (error: unknown) {
      console.error('Error al obtener perfil de usuario:', error)

      // Extraer mensaje de error específico si está disponible
      let errorMessage = 'Error al obtener el perfil de usuario'

      // Tipificar el error para acceder a sus propiedades de forma segura
      const axiosError = error as {
        response?: {
          status?: number
          data?: {
            Message?: string
            message?: string
          }
        }
      }

      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message
      } else if (axiosError.response?.data?.Message) {
        errorMessage = axiosError.response.data.Message
      }

      return {
        success: false,
        message: errorMessage,
      }
    }
  },

  // Cambiar contraseña del usuario
  async changePassword(passwordData: PasswordChangeRequest): Promise<PasswordChangeResponse> {
    try {
      // Validar que las contraseñas nuevas coincidan
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        return {
          success: false,
          message: 'Las contraseñas nuevas no coinciden',
        }
      }

      // Obtener el nombre de usuario del localStorage o del estado
      const userJson = localStorage.getItem('user')
      let username = ''

      if (userJson) {
        try {
          const userData = JSON.parse(userJson)
          username = userData.Username || ''
        } catch (e) {
          console.error('Error al parsear datos de usuario:', e)
        }
      }

      if (!username) {
        return {
          success: false,
          message: 'No se pudo obtener el nombre de usuario',
        }
      }

      // Enviar solicitud según la especificación de la API
      const response = await apiClient.post('/v1/change-password', {
        username: username,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      return {
        success: true,
        message: response.data?.message || 'Contraseña actualizada exitosamente',
      }
    } catch (error: unknown) {
      console.error('Error al cambiar contraseña:', error)

      // Extraer mensaje de error específico si está disponible
      let errorMessage = 'Error al cambiar la contraseña'

      // Tipificar el error para acceder a sus propiedades de forma segura
      const axiosError = error as {
        response?: {
          status?: number
          data?: {
            Message?: string
            message?: string
            TecnicalDetails?: string
          }
        }
      }

      if (axiosError.response?.data?.Message) {
        errorMessage = axiosError.response.data.Message
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message
      } else if (axiosError.response?.status === 401) {
        errorMessage = 'La contraseña actual es incorrecta'
      } else if (axiosError.response?.status === 400) {
        errorMessage = 'Datos incompletos o inválidos'
      }

      return {
        success: false,
        message: errorMessage,
      }
    }
  },
}

export default userService
