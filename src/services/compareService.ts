// Servicio para comparar publicaciones en DB vs Mercado Libre
import apiClient from './api'

// Interfaces para las respuestas de la API
export interface MissingPublicationsResponse {
  total: number
  missing_publication_ids: string[]
}

export interface OrphanPublicationsResponse {
  total: number
  orphan_publication_ids: string[]
}

// Opciones para la consulta de publicaciones faltantes
export interface MissingPublicationsOptions {
  status?: 'active' | ''
  channels?: 'marketplace' | 'marketplace,mshops'
  offset?: number
  limit?: number
}

// Opciones para la consulta de publicaciones huérfanas
export interface OrphanPublicationsOptions {
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

  // Obtener publicaciones que existen en la base de datos pero no en Mercado Libre (huérfanas)
  async getOrphanPublications(
    accountId: number,
    options?: OrphanPublicationsOptions,
  ): Promise<OrphanPublicationsResponse> {
    try {
      const headers: Record<string, string> = {
        'account-id': accountId.toString(),
      }
      
      // Parámetros de paginación
      const url = '/v1/provider/publications/orphans'
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

      return response.data as OrphanPublicationsResponse
    } catch (error) {
      console.error('Error al obtener publicaciones huérfanas:', error)
      throw error
    }
  },
}

export default compareService
