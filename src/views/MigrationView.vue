<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import migrationService from '@/services/migrationService'
import type { ProductId, ProductDetail, OrphanProduct } from '@/services/migrationService'

// Stores
const accountStore = useAccountStore()

// Estado
const activeTab = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)
const productIds = ref<ProductId[]>([])
const orphanProducts = ref<OrphanProduct[]>([])
const selectedProduct = ref<ProductDetail | null>(null)
const showProductDetail = ref(false)
const statusFilter = ref('')
const totalProductIds = ref(0)
const totalOrphans = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)

// Opciones de filtro
const statusOptions = [
  { title: 'Todos', value: '' },
  { title: 'Activo', value: 'active' },
  { title: 'Pausado', value: 'paused' },
  { title: 'Finalizado', value: 'closed' }
]

// Cabeceras de tabla para IDs de productos
const productIdsHeaders = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Título', key: 'title', sortable: true },
  { title: 'Categoría', key: 'category_id', sortable: true },
  { title: 'Precio', key: 'price', sortable: true },
  { title: 'Cantidad', key: 'available_quantity', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false }
]

// Cabeceras de tabla para productos huérfanos
const orphanProductsHeaders = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Título', key: 'title', sortable: true },
  { title: 'Categoría', key: 'category_id', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Estado de Sincronización', key: 'sync_status', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false }
]

// Computed properties
const currentAccount = computed(() => accountStore.currentAccount)
const accountId = computed(() => currentAccount.value?.ID || 0)
const hasAccount = computed(() => !!currentAccount.value)

// Métodos
const loadProductIds = async () => {
  if (!hasAccount.value) {
    error.value = 'Selecciona una cuenta para ver los productos'
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const offset = (page.value - 1) * itemsPerPage.value
    const response = await migrationService.getProductIds(
      accountId.value, 
      statusFilter.value,
      offset,
      itemsPerPage.value
    )
    
    productIds.value = response.products
    totalProductIds.value = response.total
  } catch (err) {
    console.error('Error al cargar IDs de productos:', err)
    if (err instanceof Error) {
      error.value = `Error al cargar IDs de productos: ${err.message}`
    } else {
      error.value = 'Error al cargar IDs de productos'
    }
  } finally {
    loading.value = false
  }
}

const loadOrphanProducts = async () => {
  if (!hasAccount.value) {
    error.value = 'Selecciona una cuenta para ver los productos huérfanos'
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const offset = (page.value - 1) * itemsPerPage.value
    const response = await migrationService.getOrphanProducts(
      accountId.value, 
      statusFilter.value,
      offset,
      itemsPerPage.value
    )
    
    orphanProducts.value = response.products
    totalOrphans.value = response.total
  } catch (err) {
    console.error('Error al cargar productos huérfanos:', err)
    if (err instanceof Error) {
      error.value = `Error al cargar productos huérfanos: ${err.message}`
    } else {
      error.value = 'Error al cargar productos huérfanos'
    }
  } finally {
    loading.value = false
  }
}

const viewProductDetail = async (productId: string) => {
  if (!hasAccount.value) return
  
  loading.value = true
  error.value = null
  
  try {
    const response = await migrationService.getProductDetail(accountId.value, productId)
    selectedProduct.value = response.product
    showProductDetail.value = true
  } catch (err) {
    console.error(`Error al cargar detalle del producto ${productId}:`, err)
    if (err instanceof Error) {
      error.value = `Error al cargar detalle del producto: ${err.message}`
    } else {
      error.value = 'Error al cargar detalle del producto'
    }
  } finally {
    loading.value = false
  }
}

const openProductInNewTab = (productId: string) => {
  window.open(`https://articulo.mercadolibre.com.ar/${productId}`, '_blank')
}

const handleTabChange = (tabIndex: unknown) => {
  const index = Number(tabIndex)
  activeTab.value = index
  page.value = 1
  
  if (index === 0) {
    loadProductIds()
  } else {
    loadOrphanProducts()
  }
}

const handlePageChange = () => {
  if (activeTab.value === 0) {
    loadProductIds()
  } else {
    loadOrphanProducts()
  }
}

const handleStatusFilterChange = () => {
  page.value = 1
  if (activeTab.value === 0) {
    loadProductIds()
  } else {
    loadOrphanProducts()
  }
}

// Inicialización
onMounted(() => {
  if (hasAccount.value) {
    loadProductIds()
  }
})

// Observar cambios en la cuenta seleccionada
watch(() => accountId.value, () => {
  page.value = 1
  if (activeTab.value === 0) {
    loadProductIds()
  } else {
    loadOrphanProducts()
  }
})
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Gestión de Migraciones</h1>
        
        <v-alert
          v-if="!hasAccount"
          type="warning"
          class="mb-4"
        >
          Selecciona una cuenta para ver los productos disponibles para migración.
        </v-alert>
        
        <v-alert
          v-if="error"
          type="error"
          class="mb-4"
          closable
          @click:close="error = null"
        >
          {{ error }}
        </v-alert>
        
        <v-card>
          <v-tabs
            v-model="activeTab"
            @update:model-value="handleTabChange"
          >
            <v-tab value="0">IDs de Publicaciones</v-tab>
            <v-tab value="1">Publicaciones Huérfanas</v-tab>
          </v-tabs>
          
          <v-card-text>
            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-select
                  v-model="statusFilter"
                  :items="statusOptions"
                  item-title="title"
                  item-value="value"
                  label="Filtrar por estado"
                  variant="outlined"
                  density="comfortable"
                  @update:model-value="handleStatusFilterChange"
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="8" class="d-flex justify-end align-center">
                <v-btn
                  color="primary"
                  :loading="loading"
                  @click="activeTab === 0 ? loadProductIds() : loadOrphanProducts()"
                >
                  <v-icon start>mdi-refresh</v-icon>
                  Actualizar
                </v-btn>
              </v-col>
            </v-row>
            
            <!-- Tabla de IDs de productos -->
            <v-data-table
              v-if="activeTab === 0"
              :headers="productIdsHeaders"
              :items="productIds"
              :loading="loading"
              :items-per-page="itemsPerPage"
              class="elevation-1"
              :no-data-text="hasAccount ? 'No hay productos disponibles' : 'Selecciona una cuenta para ver los productos'"
            >
              <template #[`item.price`]="{ item }">
                {{ new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.price) }}
              </template>
              
              <template #[`item.status`]="{ item }">
                <v-chip
                  :color="item.status === 'active' ? 'success' : item.status === 'paused' ? 'warning' : 'error'"
                  size="small"
                >
                  {{ item.status === 'active' ? 'Activo' : item.status === 'paused' ? 'Pausado' : 'Finalizado' }}
                </v-chip>
              </template>
              
              <template #[`item.actions`]="{ item }">
                <v-btn
                  icon
                  size="small"
                  color="primary"
                  class="mr-2"
                  @click="viewProductDetail(item.id)"
                  :disabled="loading"
                >
                  <v-icon>mdi-eye</v-icon>
                  <v-tooltip activator="parent" location="top">Ver detalles</v-tooltip>
                </v-btn>
                
                <v-btn
                  icon
                  size="small"
                  color="info"
                  @click="openProductInNewTab(item.id)"
                >
                  <v-icon>mdi-open-in-new</v-icon>
                  <v-tooltip activator="parent" location="top">Ver en Mercado Libre</v-tooltip>
                </v-btn>
              </template>
              
              <template #bottom>
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(totalProductIds / itemsPerPage)"
                  @update:model-value="handlePageChange"
                  :disabled="loading"
                ></v-pagination>
              </template>
            </v-data-table>
            
            <!-- Tabla de productos huérfanos -->
            <v-data-table
              v-if="activeTab === 1"
              :headers="orphanProductsHeaders"
              :items="orphanProducts"
              :loading="loading"
              :items-per-page="itemsPerPage"
              class="elevation-1"
              :no-data-text="hasAccount ? 'No hay productos huérfanos' : 'Selecciona una cuenta para ver los productos huérfanos'"
            >
              <template #[`item.status`]="{ item }">
                <v-chip
                  :color="item.status === 'active' ? 'success' : item.status === 'paused' ? 'warning' : 'error'"
                  size="small"
                >
                  {{ item.status === 'active' ? 'Activo' : item.status === 'paused' ? 'Pausado' : 'Finalizado' }}
                </v-chip>
              </template>
              
              <template #[`item.sync_status`]="{ item }">
                <v-chip
                  v-if="item.sync_status"
                  :color="item.sync_status === 'synced' ? 'success' : item.sync_status === 'pending' ? 'warning' : 'error'"
                  size="small"
                >
                  {{ item.sync_status === 'synced' ? 'Sincronizado' : item.sync_status === 'pending' ? 'Pendiente' : 'Error' }}
                </v-chip>
                <span v-else>No disponible</span>
              </template>
              
              <template #[`item.actions`]="{ item }">
                <v-btn
                  icon
                  size="small"
                  color="primary"
                  class="mr-2"
                  @click="viewProductDetail(item.id)"
                  :disabled="loading"
                >
                  <v-icon>mdi-eye</v-icon>
                  <v-tooltip activator="parent" location="top">Ver detalles</v-tooltip>
                </v-btn>
                
                <v-btn
                  icon
                  size="small"
                  color="info"
                  @click="openProductInNewTab(item.id)"
                >
                  <v-icon>mdi-open-in-new</v-icon>
                  <v-tooltip activator="parent" location="top">Ver en Mercado Libre</v-tooltip>
                </v-btn>
              </template>
              
              <template #bottom>
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(totalOrphans / itemsPerPage)"
                  @update:model-value="handlePageChange"
                  :disabled="loading"
                ></v-pagination>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Diálogo de detalle de producto -->
    <v-dialog
      v-model="showProductDetail"
      max-width="900"
      scrollable
    >
      <v-card v-if="selectedProduct">
        <v-card-title class="d-flex justify-space-between align-center">
          <div>
            <span class="text-h6">Detalle del Producto</span>
            <div class="text-subtitle-2 text-grey">ID: {{ selectedProduct.id }}</div>
          </div>
          <v-btn icon @click="showProductDetail = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <h3 class="text-h6 mb-2">{{ selectedProduct.title }}</h3>
              
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Precio</v-list-item-title>
                  <v-list-item-subtitle>{{ new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(selectedProduct.price) }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-title>Cantidad disponible</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedProduct.available_quantity }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-title>Categoría</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedProduct.category_id }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-title>Estado</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="selectedProduct.status === 'active' ? 'success' : selectedProduct.status === 'paused' ? 'warning' : 'error'"
                      size="small"
                    >
                      {{ selectedProduct.status === 'active' ? 'Activo' : selectedProduct.status === 'paused' ? 'Pausado' : 'Finalizado' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
              
              <v-btn
                color="primary"
                class="mt-4"
                @click="openProductInNewTab(selectedProduct.id)"
                prepend-icon="mdi-open-in-new"
              >
                Ver en Mercado Libre
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="showProductDetail = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
