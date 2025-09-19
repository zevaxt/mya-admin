// Servicio para manejar las cuentas de usuario
import apiClient from './api'
import type { Account } from './api'

// Interfaz para la respuesta de la API de cuentas
export interface AccountsResponse {
  accounts: Account[]
}

// Servicio de cuentas
export const accountService = {
  // Obtener todas las cuentas de un usuario
  async getUserAccounts(userId: number): Promise<Account[]> {
    try {
      // Verificar que el usuario esté autenticado
      if (!localStorage.getItem('token')) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      // Intentar obtener las cuentas de la API (el token se añade automáticamente por el interceptor)
      try {
        const response = await apiClient.get(`/v1/users/${userId}/accounts`)
        return response.data as Account[]
      } catch (apiError) {
        console.warn('Error al obtener cuentas de la API, usando datos de prueba:', apiError)

        // Si estamos en desarrollo y hay un error, devolver datos de prueba
        if (import.meta.env.DEV) {
          console.log('Usando cuentas de prueba para desarrollo')
          return [
            {
              ID: 1,
              CreatedAt: new Date().toISOString(),
              UpdatedAt: new Date().toISOString(),
              DeletedAt: null,
              ProviderID: 1,
              UserID: userId,
              AuthorizationCode: 'auth_code_123',
              Email: 'cuenta1@example.com',
              Nickname: 'Tienda Principal',
              Code: 'ML123456',
            },
            {
              ID: 2,
              CreatedAt: new Date().toISOString(),
              UpdatedAt: new Date().toISOString(),
              DeletedAt: null,
              ProviderID: 2,
              UserID: userId,
              AuthorizationCode: 'auth_code_456',
              Email: 'cuenta2@example.com',
              Nickname: 'Tienda Secundaria',
              Code: 'WIX789012',
            },
          ]
        }
        throw apiError
      }
    } catch (error: unknown) {
      // Manejar el error con tipado seguro
      if (error instanceof Error) {
        console.error(`Error al obtener cuentas del usuario ${userId}:`, error.message)
      } else {
        console.error(`Error desconocido al obtener cuentas del usuario ${userId}`)
      }
      throw error
    }
  },

  // Obtener una cuenta específica por su ID
  async getAccountById(userId: number, accountId: number): Promise<Account | null> {
    try {
      // Verificar que el usuario esté autenticado
      if (!localStorage.getItem('token')) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      try {
        const response = await apiClient.get(`/v1/users/${userId}/accounts/${accountId}`)
        return response.data as Account
      } catch (apiError) {
        console.warn(`Error al obtener la cuenta ${accountId}:`, apiError)
        
        // Si estamos en desarrollo, devolver una cuenta de prueba
        if (import.meta.env.DEV) {
          console.log('Usando cuenta de prueba para desarrollo')
          return {
            ID: accountId,
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
            DeletedAt: null,
            ProviderID: 1,
            UserID: userId,
            AuthorizationCode: `auth_code_${accountId}`,
            Email: `cuenta${accountId}@example.com`,
            Nickname: `Cuenta #${accountId}`,
            Code: `ML${accountId}${Date.now().toString().slice(-6)}`
          }
        }
        return null
      }
    } catch (error) {
      console.error(`Error al obtener la cuenta ${accountId}:`, error)
      return null
    }
  },

  // Guardar la cuenta seleccionada en localStorage
  saveSelectedAccount(account: Account): void {
    localStorage.setItem('selectedAccount', JSON.stringify(account))
  },

  // Obtener la cuenta seleccionada de localStorage
  getSelectedAccount(): Account | null {
    const storedAccount = localStorage.getItem('selectedAccount')
    if (storedAccount) {
      try {
        return JSON.parse(storedAccount) as Account
      } catch (error) {
        console.error('Error al parsear la cuenta almacenada:', error)
        return null
      }
    }
    return null
  },
}

export default accountService
