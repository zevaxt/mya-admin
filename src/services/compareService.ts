// Servicio para comparar publicaciones en DB vs Mercado Libre
import apiClient from './api'

// Interfaces para las respuestas de la API
export interface MissingPublicationsResponse {
  total: number
  missing_publication_ids: string[]
}

export interface DeprecatedPublicationsResponse {
  total: number
  deprecated_publication_ids: string[]
}

// Opciones para la consulta de publicaciones faltantes
export interface MissingPublicationsOptions {
  status?: 'active' | 'paused' | 'inactive' | ''
  channels?: 'marketplace' | 'marketplace,mshops'
  offset?: number
  limit?: number
}

// Opciones para la consulta de publicaciones deprecadas
export interface DeprecatedPublicationsOptions {
  offset?: number
  limit?: number
}

// Servicio de comparación
export const compareService = {
  // Obtener publicaciones que existen en Mercado Libre pero no en la base de datos
  async getMissingPublications(
    accountId: number,
    options?: MissingPublicationsOptions,
  ): Promise<MissingPublicationsResponse> {
    try {
      const headers: Record<string, string> = {
        'account-id': accountId.toString(),
      }

      // Añadir encabezados opcionales si están presentes
      if (options?.status !== undefined) {
        headers['status'] = options.status
      }

      if (options?.channels) {
        headers['channels'] = options.channels
      }

      // Parámetros de paginación
      const url = '/v1/provider/publications/compare'
      const params: Record<string, string> = {}

      if (options?.offset !== undefined) {
        params['offset'] = options.offset.toString()
      }

      if (options?.limit !== undefined) {
        params['limit'] = options.limit.toString()
      }

      const response = await apiClient.get(url, {
        headers,
        params,
      })

      return response.data as MissingPublicationsResponse
    } catch (error) {
      console.error('Error al obtener publicaciones faltantes:', error)
      throw error
    }
  },

  // Obtener publicaciones que existen en la base de datos pero no en Mercado Libre (deprecadas)
  async getDeprecatedPublications(
    accountId: number,
    options?: DeprecatedPublicationsOptions,
  ): Promise<DeprecatedPublicationsResponse> {
    try {
      const headers: Record<string, string> = {
        'account-id': accountId.toString(),
      }

      // Parámetros de paginación
      const url = '/v1/provider/publications/deprecated'
      const params: Record<string, string> = {}

      if (options?.offset !== undefined) {
        params['offset'] = options.offset.toString()
      }

      if (options?.limit !== undefined) {
        params['limit'] = options.limit.toString()
      }

      const response = await apiClient.get(url, {
        headers,
        params,
      })

      // Depurar la respuesta
      console.log('Respuesta del servidor (publicaciones deprecadas):', response.data)

      // Devolver la respuesta directamente
      return response.data as DeprecatedPublicationsResponse
    } catch (error) {
      console.error('Error al obtener publicaciones deprecadas:', error)
      throw error
    }
  },
}

export default compareService
