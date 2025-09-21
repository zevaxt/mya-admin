// Servicio para manejar tokens JWT
import apiClient from './api'
import { jwtDecode } from 'jwt-decode'
import { AUTH_CONFIG } from '@/config/auth.config'

interface DecodedToken {
  exp?: number
  iat?: number
  sub?: string
  [key: string]: unknown
}

export const tokenService = {
  // Verificar si el token está expirado
  isTokenExpired(token: string | null): boolean {
    if (!token) return true

    try {
      const decoded = jwtDecode<DecodedToken>(token)
      
      // Si no hay fecha de expiración, consideramos que está expirado
      if (!decoded.exp) return true
      
      // Convertir a milisegundos y comparar con la fecha actual
      // Agregamos un margen de 5 minutos (300 segundos) para renovar antes de que expire
      const expirationTime = decoded.exp * 1000 // Convertir a milisegundos
      const currentTime = Date.now()
      
      // Token está expirado o expirará en menos de 5 minutos
      return currentTime > expirationTime - 300000 // 5 minutos en milisegundos
    } catch (error) {
      console.error('Error al decodificar el token:', error)
      return true
    }
  },

  // Obtener tiempo restante del token en segundos
  getTokenRemainingTime(token: string | null): number {
    if (!token) return 0

    try {
      const decoded = jwtDecode<DecodedToken>(token)
      
      if (!decoded.exp) return 0
      
      const expirationTime = decoded.exp * 1000 // Convertir a milisegundos
      const currentTime = Date.now()
      
      const remainingTime = expirationTime - currentTime
      return Math.max(0, Math.floor(remainingTime / 1000)) // Convertir a segundos
    } catch (error) {
      console.error('Error al calcular tiempo restante del token:', error)
      return 0
    }
  },

  // Renovar el token
  async refreshToken(): Promise<string | null> {
    try {
      const response = await apiClient.post('/v1/refresh-token')
      
      if (response.data && response.data.token) {
        // Guardar el nuevo token
        const newToken = response.data.token
        localStorage.setItem('token', newToken)
        return newToken
      }
      
      return null
    } catch (error) {
      console.error('Error al renovar el token:', error)
      return null
    }
  },

  // Configurar un temporizador para renovar el token automáticamente
  setupTokenRefresh(token: string | null, onRefreshSuccess: (token: string) => void, onRefreshFailed: () => void): number | null {
    if (!token) return null

    try {
      const decoded = jwtDecode<DecodedToken>(token)
      
      if (!decoded.exp) return null
      
      const expirationTime = decoded.exp * 1000
      const currentTime = Date.now()
      
      // Calcular tiempo para la renovación (usando el umbral configurado)
      const timeToRefresh = Math.max(0, expirationTime - currentTime - AUTH_CONFIG.TOKEN_REFRESH_THRESHOLD_MS)
      
      // Si el token expira en menos tiempo que el umbral configurado, intentar renovarlo inmediatamente
      if (timeToRefresh < 0) {
        this.refreshToken()
          .then(newToken => {
            if (newToken) {
              onRefreshSuccess(newToken)
            } else {
              onRefreshFailed()
            }
          })
          .catch(() => onRefreshFailed())
        return null
      }
      
      // Configurar temporizador para renovar el token
      return window.setTimeout(async () => {
        const newToken = await this.refreshToken()
        if (newToken) {
          onRefreshSuccess(newToken)
          // Configurar el próximo ciclo de renovación
          this.setupTokenRefresh(newToken, onRefreshSuccess, onRefreshFailed)
        } else {
          onRefreshFailed()
        }
      }, timeToRefresh)
    } catch (error) {
      console.error('Error al configurar renovación de token:', error)
      return null
    }
  },

  // Cancelar el temporizador de renovación
  clearTokenRefresh(timerId: number | null): void {
    if (timerId !== null) {
      window.clearTimeout(timerId)
    }
  }
}

export default tokenService
