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
  Attributes?: Record<string, unknown> // Campo para almacenar los atributos del producto
  Populate?: boolean // Campo para indicar si tiene atributos
}

export interface ProductIdListResponse {
  products: ProductId[]
  total: number
  offset: number
  limit: number
}

// Interfaces para modelar la estructura detallada de los atributos del producto
export interface ProductPicture {
  id: string
  url: string
  size?: string
  quality?: string
  max_size?: string
  secure_url?: string
}

export interface ProductAttributeValue {
  id?: string
  name: string
  struct?: {
    unit?: string
    number?: number
  } | null
}

export interface ProductAttribute {
  id: string
  name: string
  values?: ProductAttributeValue[]
  value_id?: string
  value_name?: string
  value_type?: string
  value_struct?: {
    unit?: string
    number?: number
  } | null
  attribute_group_id?: string
  attribute_group_name?: string
}

export interface ProductSaleTerm {
  id: string
  name: string
  values: ProductAttributeValue[]
  value_id?: string | null
  value_name?: string
  value_type?: string
  value_struct?: {
    unit: string
    number: number
  } | null
}

export interface ProductShipping {
  mode?: string
  tags?: string[]
  methods?: any[]
  dimensions?: any
  free_shipping?: boolean
  local_pick_up?: boolean
  store_pick_up?: boolean
}

export interface ProductSellerAddress {
  id?: number
  city?: {
    id: string
    name: string
  }
  state?: {
    id: string
    name: string
  }
  comment?: string
  country?: {
    id: string
    name: string
  }
  latitude?: number
  zip_code?: string
  longitude?: number
  address_line?: string
  search_location?: {
    city?: {
      id: string
      name: string
    }
    state?: {
      id: string
      name: string
    }
    neighborhood?: {
      id: string
      name: string
    }
  }
}

export interface ProductAttributes {
  id: string
  tags?: string[]
  price: number
  title: string
  health?: number
  status: string
  site_id?: string
  channels?: string[]
  deal_ids?: any[]
  end_time?: string
  location?: any
  pictures?: ProductPicture[]
  shipping?: ProductShipping
  subtitle?: string | null
  video_id?: string | null
  warnings?: any[]
  warranty?: string
  condition: string
  domain_id?: string
  permalink?: string
  seller_id?: number
  stop_time?: string
  thumbnail?: string
  attributes?: ProductAttribute[]
  base_price?: number
  sale_terms?: ProductSaleTerm[]
  start_time?: string
  sub_status?: any[]
  variations?: any[]
  buying_mode?: string
  category_id: string
  currency_id?: string
  geolocation?: {
    latitude: number
    longitude: number
  }
  date_created?: string
  descriptions?: string[]
  inventory_id?: string | null
  last_updated?: string
  thumbnail_id?: string
  sold_quantity?: number
  coverage_areas?: any[]
  item_relations?: any[]
  listing_source?: string
  original_price?: number | null
  parent_item_id?: string | null
  seller_address?: ProductSellerAddress
  seller_contact?: any
  catalog_listing?: boolean
  expiration_time?: string
  listing_type_id?: string
  automatic_relist?: boolean
  initial_quantity?: number
  secure_thumbnail?: string
  official_store_id?: number | null
  available_quantity: number
  catalog_product_id?: string | null
  accepts_mercadopago?: boolean
  seller_custom_field?: string | null
  differential_pricing?: any
  international_delivery_mode?: string
  non_mercado_pago_payment_methods?: any[]
}

export interface ProductDetail {
  ID: string
  Attributes: ProductAttributes
  AccountID: number
  SyncActive: boolean
  CatalogActive: boolean
  Status: boolean
  ToSync: boolean | null
  updated_at: string
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
    readMode: boolean = false,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await apiClient.post(
        '/v1/migration/update/products/ids',
        {},
        {
          headers: {
            'account-id': accountId.toString(),
            status: status,
            channels: channels,
            'read-mode': readMode.toString(),
          },
        },
      )

      return {
        success: true,
        message: 'Sincronización de IDs iniciada correctamente',
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
          Attributes?: Record<string, unknown>
        }) => {
          // Buscar el nombre de la cuenta si está disponible
          let accountName = 'N/A'
          if (product.AccountID && accounts.length > 0) {
            const account = accounts.find((acc) => acc.ID === product.AccountID)
            if (account) {
              accountName = account.Nickname || account.Email || `Cuenta #${product.AccountID}`
            }
          }

          // Determinar si tiene atributos (Populate)
          const hasAttributes =
            product.Attributes !== null &&
            product.Attributes !== undefined &&
            Object.keys(product.Attributes || {}).length > 0

          return {
            ID: product.ID,
            AccountID: product.AccountID,
            AccountName: accountName,
            SyncActive: product.SyncActive,
            CatalogActive: product.CatalogActive,
            Status: product.Status,
            ToSync: product.ToSync,
            updated_at: product.updated_at,
            Attributes: product.Attributes,
            Populate: hasAttributes,
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
  async getProductDetail(accountId: number, productId: string): Promise<ProductDetail> {
    try {
      const response = await apiClient.get(`/v1/migration/product/${productId}`, {
        headers: {
          'account-id': accountId.toString(),
        },
      })

      return response.data as ProductDetail
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
      const response = await apiClient.post(
        `/v1/migration/product/id/${productId}`,
        {},
        {
          headers: {
            'account-id': accountId.toString(),
          },
        },
      )

      return response.data as string[]
    } catch (error) {
      console.error(`Error al crear publicación ${productId}:`, error)
      throw error
    }
  },

  // Actualizar los atributos de población de un producto
  async updateProductPopulate(
    accountId: number,
    productId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await apiClient.post(
        `/v1/migration/update/products/populate/${productId}`,
        {},
        {
          headers: {
            'account-id': accountId.toString(),
          },
        },
      )

      return {
        success: true,
        message: `Atributos del producto ${productId} actualizados correctamente`,
      }
    } catch (error) {
      console.error(`Error al actualizar atributos del producto ${productId}:`, error)
      throw error
    }
  },

  // Eliminar una publicación
  async deleteProduct(
    accountId: number,
    productId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await apiClient.delete(`/v1/migration/delete/product/${productId}`, {
        headers: {
          'account-id': accountId.toString(),
          'delete-provider': 'false', // Siempre enviar false como se solicitó
        },
      })

      return {
        success: true,
        message: `Publicación ${productId} eliminada correctamente`,
      }
    } catch (error) {
      console.error(`Error al eliminar la publicación ${productId}:`, error)
      throw error
    }
  },

  // Eliminar múltiples publicaciones
  async deleteMultipleProducts(
    accountId: number,
    productIds: string[],
  ): Promise<{
    success: boolean
    message: string
    results: { id: string; success: boolean; message: string }[]
  }> {
    const results: { id: string; success: boolean; message: string }[] = []
    let successCount = 0
    let errorCount = 0

    try {
      // Procesar cada ID en secuencia
      for (const productId of productIds) {
        try {
          await apiClient.delete(`/v1/migration/delete/product/${productId}`, {
            headers: {
              'account-id': accountId.toString(),
              'delete-provider': 'false',
            },
          })

          results.push({
            id: productId,
            success: true,
            message: `Publicación eliminada correctamente`,
          })
          successCount++
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Error al eliminar la publicación'
          results.push({
            id: productId,
            success: false,
            message: errorMessage,
          })
          errorCount++
          console.error(`Error al eliminar la publicación ${productId}:`, error)
        }
      }

      return {
        success: errorCount === 0,
        message: `${successCount} publicaciones eliminadas correctamente${errorCount > 0 ? `, ${errorCount} con errores` : ''}`,
        results,
      }
    } catch (error) {
      console.error(`Error general al eliminar publicaciones:`, error)
      throw error
    }
  },
}

export default migrationService
