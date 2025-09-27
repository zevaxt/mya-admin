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

export interface OrphanPublicationsResponse {
  count: number
  publication_ids: string[]
}

// Opciones para la consulta de publicaciones faltantes
export interface MissingPublicationsOptions {
  status?: 'active' | 'paused' | 'inactive' | 'closed' | ''
  channels?: 'marketplace' | 'marketplace,mshops' | 'mshops' | 'all'
  offset?: number
  limit?: number
}

// Opciones para la consulta de publicaciones deprecadas
export interface DeprecatedPublicationsOptions {
  offset?: number
  limit?: number
}

// Opciones para la consulta de publicaciones huérfanas
export interface OrphanPublicationsOptions {
  status?: string | boolean | 'all' // Ahora acepta string para los estados de ML
  withSoldQuantity?: boolean | 'all'
  catalogActive?: boolean | 'all' // Nuevo parámetro para filtrar por publicaciones de catálogo
  offset?: number
  limit?: number
}

// Servicio de comparación
export const compareService = {
  // Sincronizar IDs de productos con Mercado Libre
  async syncProductIds(
    accountId: number,
    status: string = '',
    channels: string = 'marketplace',
    readOnly: boolean = false
  ): Promise<{success: boolean; message?: string; publication_ids?: string[]} | string[]> {
    try {
      const response = await apiClient.post('/v1/migration/update/products/ids', {}, {
        headers: {
          'account-id': accountId.toString(),
          'status': status,
          'channels': channels,
          'read-mode': readOnly.toString()
        }
      })

      // Si es modo solo lectura, devolver el array de IDs directamente
      if (readOnly) {
        return Array.isArray(response.data) ? response.data : response.data?.publication_ids || []
      }

      // Modo normal (guardar en BD)
      return {
        success: true,
        message: 'Sincronización de IDs completada correctamente',
        publication_ids: response.data?.publication_ids || []
      }
    } catch (error) {
      console.error('Error al sincronizar IDs de productos:', error)
      
      // En modo solo lectura, devolver array vacío en caso de error
      if (readOnly) {
        return []
      }
      
      // Modo normal, devolver error
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al sincronizar IDs de productos'
      }
    }
  },
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


      const response = await apiClient.get(url, {
        headers,
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

  // Obtener publicaciones huérfanas (no sincronizadas y sin catálogo activo)
  async getOrphanPublications(
    accountId: number,
    options?: OrphanPublicationsOptions,
  ): Promise<OrphanPublicationsResponse> {
    try {
      const headers: Record<string, string> = {
        'account-id': accountId.toString(),
      }

      // Añadir encabezados opcionales según la especificación
      if (options?.status !== undefined) {
        headers['status'] = options.status.toString()
      }

      if (options?.withSoldQuantity !== undefined) {
        headers['with-sold-quantity'] = options.withSoldQuantity.toString()
      }

      if (options?.catalogActive !== undefined) {
        headers['catalog-active'] = options.catalogActive.toString()
      }

      // Parámetros de paginación
      const url = '/v1/migration/products/orphans'

      const response = await apiClient.get(url, {
        headers,
      })

      // Depurar la respuesta
      console.log('Respuesta del servidor (publicaciones huérfanas):', response.data)

      // Devolver la respuesta según el formato documentado
      return {
        count: response.data.count || 0,
        publication_ids: response.data.publication_ids || [],
      } as OrphanPublicationsResponse
    } catch (error) {
      console.error('Error al obtener publicaciones huérfanas:', error)
      throw error
    }
  },
}

export default compareService
