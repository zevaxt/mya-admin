// Servicio para manejar las operaciones de migración
import apiClient from './api'
import { accountService } from './accountService'
import { useAuthStore } from '@/stores/auth'
import type { Account } from './api'

// Interfaces para las respuestas de la API
export interface ProductId {
  ID: string
  AccountID: number
  AccountName?: string // Nuevo campo para mostrar el nombre de la cuenta
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
  // Actualizar IDs de productos desde Mercado Libre a la base de datos
  async updateProductIds(
    accountId: number,
    status: string = 'active',
    channels: string = 'marketplace',
    readMode: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    try {
      await apiClient.post('/v1/migration/update/products/ids', {}, {
        headers: {
          'account-id': accountId.toString(),
          'status': status,
          'channels': channels,
          'read-mode': readMode.toString()
        },
      })

      return {
        success: true,
        message: 'Sincronización de IDs iniciada correctamente'
      }
    } catch (error) {
      console.error('Error al actualizar IDs de productos:', error)
      throw error
    }
  },

  // Obtener lista de IDs de productos
  async getProductIds(
    accountId: number,
    status?: string,
    offset = 0,
    limit = 50,
    syncActive?: boolean,
    catalogActive?: boolean,
  ): Promise<ProductIdListResponse> {
    try {
      let url = `/v1/migration/products?offset=${offset}&limit=${limit}`
      if (status) {
        url += `&status=${status}`
      }
      if (syncActive !== undefined) {
        url += `&syncActive=${syncActive}`
      }
      if (catalogActive !== undefined) {
        url += `&catalogActive=${catalogActive}`
      }

      const response = await apiClient.get(url, {
        headers: {
          'account-id': accountId.toString(),
        },
      })

      // Transformar la respuesta al nuevo formato
      const data = response.data
      // Obtener las cuentas para mapear los nombres
      const authStore = useAuthStore()
      const userId = authStore.currentUserId
      let accounts: Account[] = []
      
      try {
        if (userId) {
          accounts = await accountService.getUserAccounts(userId)
        }
      } catch (err) {
        console.warn('No se pudieron cargar las cuentas para mostrar nombres:', err)
      }
      
      const products = data.products.map(
        (product: {
          ID: string
          Status: boolean
          CatalogActive: boolean
          ToSync?: boolean
          SyncActive?: boolean
          AccountID?: number
          updated_at?: string
        }) => {
          // Buscar el nombre de la cuenta si está disponible
          let accountName = 'N/A'
          if (product.AccountID && accounts.length > 0) {
            const account = accounts.find(acc => acc.ID === product.AccountID)
            if (account) {
              accountName = account.Nickname || account.Email || `Cuenta #${product.AccountID}`
            }
          }
          
          return {
            ID: product.ID,
            AccountID: product.AccountID,
            AccountName: accountName,
            SyncActive: product.SyncActive,
            CatalogActive: product.CatalogActive,
            Status: product.Status,
            ToSync: product.ToSync,
            updated_at: product.updated_at,
          }
        },
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

  // Crear una publicación por ID
  async createPublication(accountId: number, productId: string): Promise<string[]> {
    try {
      const response = await apiClient.post(`/v1/migration/product/id/${productId}`, {}, {
        headers: {
          'account-id': accountId.toString(),
        },
      })

      return response.data as string[]
    } catch (error) {
      console.error(`Error al crear publicación ${productId}:`, error)
      throw error
    }
  },
}

export default migrationService
