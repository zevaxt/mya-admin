// Servicio para comparar publicaciones en DB vs Mercado Libre
import apiClient from './api'

// Interfaces para las respuestas de la API
export interface MissingPublicationsResponse {
  total: number
  missing_publication_ids: string[]
}

// Servicio de comparación
export const compareService = {
  // Obtener publicaciones que existen en Mercado Libre pero no en la base de datos
  async getMissingPublications(accountId: number): Promise<MissingPublicationsResponse> {
    try {
      const response = await apiClient.get('/v1/provider/publications/compare', {
        headers: {
          'account-id': accountId.toString(),
        },
      })

      return response.data as MissingPublicationsResponse
    } catch (error) {
      console.error('Error al obtener publicaciones faltantes:', error)
      throw error
    }
  },
}

export default compareService
