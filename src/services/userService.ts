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
        user: response.data
      }
    } catch (error: any) {
      console.error('Error al obtener perfil de usuario:', error)
      
      // Extraer mensaje de error específico si está disponible
      let errorMessage = 'Error al obtener el perfil de usuario'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.Message) {
        errorMessage = error.response.data.Message
      }
      
      return {
        success: false,
        message: errorMessage
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
          message: 'Las contraseñas nuevas no coinciden'
        }
      }

      const response = await apiClient.post('/v1/user/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      return {
        success: true,
        message: response.data?.message || 'Contraseña actualizada exitosamente'
      }
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error)
      
      // Extraer mensaje de error específico si está disponible
      let errorMessage = 'Error al cambiar la contraseña'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.Message) {
        errorMessage = error.response.data.Message
      } else if (error.response?.status === 401) {
        errorMessage = 'La contraseña actual es incorrecta'
      }
      
      return {
        success: false,
        message: errorMessage
      }
    }
  }
}

export default userService
