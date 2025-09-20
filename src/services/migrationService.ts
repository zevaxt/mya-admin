// Servicio para manejar las operaciones de migración
import apiClient from './api'

// Interfaces para las respuestas de la API
export interface ProductId {
  ID: string
  AccountID: number
  SyncActive: boolean
  CatalogActive: boolean
  Status: boolean
  ToSync: null | boolean
  updated_at: string
}

export interface ProductIdListResponse {
  products: ProductId[]
  total: number
  offset: number
  limit: number
}

export interface ProductDetail {
  id: string
  title: string
  category_id: string
  price: number
  available_quantity: number
  status: string
  permalink?: string
  attributes?: Array<{
    id: string
    name: string
    value_name: string
  }>
  pictures?: Array<{
    id: string
    url: string
  }>
  variations?: Array<{
    id: string
    attribute_combinations?: Array<{
      id: string
      name: string
      value_name: string
    }>
    price: number
    available_quantity: number
  }>
}

export interface ProductDetailResponse {
  product: ProductDetail
}

export interface ProductError {
  id: string
  details: {
    message: string
    error: string
    status: number
    cause?: Array<{
      department: string
      cause_id: number
      type: string
      code: string
      references: string[]
      message: string
    }>
  }
  CreatedAt: string | null
  UpdatedAt: string | null
  DeletedAt: string | null
}

export interface OrphanProduct {
  id: string
  title: string
  category_id: string
  status: string
  permalink?: string
  sync_status?: string
  price?: number
  available_quantity?: number
}

export interface OrphanProductsResponse {
  products: OrphanProduct[]
  total: number
  offset: number
  limit: number
}

// Servicio de migración
export const migrationService = {
  // Obtener lista de IDs de productos
  async getProductIds(
    accountId: number,
    status?: string,
    offset = 0,
    limit = 50,
  ): Promise<ProductIdListResponse> {
    try {
      let url = `/v1/migration/products?offset=${offset}&limit=${limit}`
      if (status) {
        url += `&status=${status}`
      }

      const response = await apiClient.get(url, {
        headers: {
          'account-id': accountId.toString(),
        },
      })

      // Transformar la respuesta al nuevo formato
      const data = response.data
      const products = data.products.map(
        (product: {
          ID: string
          Status: boolean
          CatalogActive: boolean
          ToSync?: boolean
          SyncActive?: boolean
          AccountID?: number
          updated_at?: string
        }) => ({
          ID: product.ID,
          AccountID: product.AccountID,
          SyncActive: product.SyncActive,
          CatalogActive: product.CatalogActive,
          Status: product.Status,
          ToSync: product.ToSync,
          updated_at: product.updated_at,
        }),
      )

      return {
        products,
        total: data.total,
        offset: data.offset,
        limit: data.limit,
      } as ProductIdListResponse
    } catch (error) {
      console.error('Error al obtener IDs de productos:', error)
      throw error
    }
  },

  // Obtener detalle de un producto por ID
  async getProductDetail(accountId: number, productId: string): Promise<ProductDetailResponse> {
    try {
      const response = await apiClient.get(`/v1/migration/product/${productId}`, {
        headers: {
          'account-id': accountId.toString(),
        },
      })

      return response.data as ProductDetailResponse
    } catch (error) {
      console.error(`Error al obtener detalle del producto ${productId}:`, error)
      throw error
    }
  },

  // Obtener productos huérfanos
  async getOrphanProducts(
    accountId: number,
    status?: string,
    offset = 0,
    limit = 50,
  ): Promise<OrphanProductsResponse> {
    try {
      let url = `/v1/migration/products/orphans?offset=${offset}&limit=${limit}`
      if (status) {
        url += `&status=${status}`
      }

      const response = await apiClient.get(url, {
        headers: {
          'account-id': accountId.toString(),
        },
      })

      return response.data as OrphanProductsResponse
    } catch (error) {
      console.error('Error al obtener productos huérfanos:', error)
      throw error
    }
  },
}

export default migrationService
