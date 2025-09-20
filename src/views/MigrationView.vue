<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import migrationService from '@/services/migrationService'
import type { ProductId, ProductDetail, OrphanProduct } from '@/services/migrationService'
import MissingPublicationsTable from '@/components/migration/MissingPublicationsTable.vue'

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
const syncActiveFilter = ref<string>('')
const catalogActiveFilter = ref<string>('')
const totalProductIds = ref(0)
const totalOrphans = ref(0)
const page = ref(1)
const itemsPerPage = ref(100)

// Opciones para items por página
const itemsPerPageOptions = [10, 50, 100, 300, 500, 1000]

// Opciones de filtro
const statusOptions = [
  { title: 'Todos', value: '' },
  { title: 'Activo', value: 'active' },
  { title: 'Pausado', value: 'paused' },
  { title: 'Finalizado', value: 'closed' },
]

const booleanFilterOptions = [
  { title: 'Todos', value: '' },
  { title: 'Sí', value: 'true' },
  { title: 'No', value: 'false' },
]

// Cabeceras de tabla para IDs de productos
const productIdsHeaders = [
  { title: 'ID', key: 'ID', sortable: true },
  { title: 'Cuenta', key: 'AccountName', sortable: true },
  { title: 'Sync Activo', key: 'SyncActive', sortable: true },
  { title: 'Catálogo Activo', key: 'CatalogActive', sortable: true },
  { title: 'Estado', key: 'Status', sortable: true },
  { title: 'Por Sincronizar', key: 'ToSync', sortable: true },
  { title: 'Actualizado', key: 'updated_at', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false },
]

// Cabeceras de tabla para productos huérfanos
const orphanProductsHeaders = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Título', key: 'title', sortable: true },
  { title: 'Categoría', key: 'category_id', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Estado de Sincronización', key: 'sync_status', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false },
]

// Computed properties
const currentAccount = computed(() => accountStore.currentAccount)
const accountId = computed(() => currentAccount.value?.ID || 0)
const hasAccount = computed(() => !!currentAccount.value)

// Verificar si hay filtros activos
const hasActiveFilters = computed(() => {
  return statusFilter.value !== '' || syncActiveFilter.value !== '' || catalogActiveFilter.value !== ''
})

// Mensaje de resultados filtrados
const filteredMessage = computed(() => {
  if (!hasActiveFilters.value || !productIds.value.length) return ''
  
  const total = productIds.value.length
  const filtered = filteredProductIds.value.length
  
  if (filtered === total) return ''
  
  return `Mostrando ${filtered} de ${total} registros`
})

// Filtrado de productos en la tabla
const filteredProductIds = computed(() => {
  if (!productIds.value.length) return []
  
  return productIds.value.filter(product => {
    // Filtrar por estado si hay un filtro seleccionado
    if (statusFilter.value) {
      const productStatus = product.Status ? 'active' : 'closed'
      if (productStatus !== statusFilter.value) return false
    }
    
    // Filtrar por Sync Activo
    if (syncActiveFilter.value !== '') {
      const isSyncActive = syncActiveFilter.value === 'true'
      if (product.SyncActive !== isSyncActive) return false
    }
    
    // Filtrar por Catálogo Activo
    if (catalogActiveFilter.value !== '') {
      const isCatalogActive = catalogActiveFilter.value === 'true'
      if (product.CatalogActive !== isCatalogActive) return false
    }
    
    return true
  })
})

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
    
    // Convertir los valores de string a boolean para los filtros
    const syncActive = syncActiveFilter.value === '' ? undefined : syncActiveFilter.value === 'true'
    const catalogActive = catalogActiveFilter.value === '' ? undefined : catalogActiveFilter.value === 'true'
    
    const response = await migrationService.getProductIds(
      accountId.value,
      statusFilter.value,
      offset,
      itemsPerPage.value,
      syncActive,
      catalogActive,
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
      itemsPerPage.value,
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
  // Insertar un guion después de los primeros 3 caracteres (MCO-1233526781)
  const formattedId = productId.slice(0, 3) + '-' + productId.slice(3)
  window.open(`https://articulo.mercadolibre.com.co/${formattedId}`, '_blank')
}

const handleTabChange = (tabIndex: unknown) => {
  const index = Number(tabIndex)
  activeTab.value = index
  page.value = 1

  if (index === 0) {
    loadProductIds()
  } else if (index === 1) {
    loadOrphanProducts()
  }
}

const handlePageChange = () => {
  if (activeTab.value === 0) {
    loadProductIds()
  } else if (activeTab.value === 1) {
    loadOrphanProducts()
  }
}

const handleItemsPerPageChange = () => {
  page.value = 1 // Resetear a la primera página cuando cambia el número de items por página
  if (activeTab.value === 0) {
    loadProductIds()
  } else if (activeTab.value === 1) {
    loadOrphanProducts()
  }
}

const handleStatusFilterChange = () => {
  page.value = 1
  if (activeTab.value === 0) {
    loadProductIds()
  } else if (activeTab.value === 1) {
    loadOrphanProducts()
  }
}

const handleSyncActiveFilterChange = () => {
  page.value = 1
  if (activeTab.value === 0) {
    loadProductIds()
  }
}

const handleCatalogActiveFilterChange = () => {
  page.value = 1
  if (activeTab.value === 0) {
    loadProductIds()
  }
}

// Función para limpiar todos los filtros
const clearAllFilters = () => {
  statusFilter.value = ''
  syncActiveFilter.value = ''
  catalogActiveFilter.value = ''
  page.value = 1
  loadProductIds()
}

// Inicialización
onMounted(() => {
  if (hasAccount.value) {
    loadProductIds()
  }
})

// Observar cambios en la cuenta seleccionada
watch(
  () => accountId.value,
  () => {
    page.value = 1
    if (activeTab.value === 0) {
      loadProductIds()
    } else if (activeTab.value === 1) {
      loadOrphanProducts()
    }
  },
)
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Gestión de Migraciones</h1>

        <v-alert v-if="!hasAccount" type="warning" class="mb-4">
          Selecciona una cuenta para ver los productos disponibles para migración.
        </v-alert>

        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
          {{ error }}
        </v-alert>

        <v-card>
          <v-tabs 
            v-model="activeTab" 
            @update:model-value="handleTabChange"
            bg-color="grey-lighten-4"
            slider-color="primary"
            class="tabs-with-separators"
            show-arrows
          >
            <v-tab 
              value="0" 
              :color="activeTab === 0 ? 'primary' : undefined"
              class="font-weight-medium tab-with-border"
            >
              <v-icon start color="primary">mdi-format-list-bulleted</v-icon>
              <v-badge
                :content="productIds.length"
                :model-value="productIds.length > 0"
                color="primary"
                inline
                class="ml-2"
              ></v-badge>
              IDs de Publicaciones
            </v-tab>
            <v-tab 
              value="1" 
              :color="activeTab === 1 ? 'warning' : undefined"
              class="font-weight-medium tab-with-border"
            >
              <v-icon start color="warning">mdi-alert-circle-outline</v-icon>
              <v-badge
                :content="orphanProducts.length"
                :model-value="orphanProducts.length > 0"
                color="warning"
                inline
                class="ml-2"
              ></v-badge>
              Publicaciones Huérfanas
            </v-tab>
            <v-tab 
              value="2" 
              :color="activeTab === 2 ? 'info' : undefined"
              class="font-weight-medium tab-with-border"
            >
              <v-icon start color="info">mdi-database-import-outline</v-icon>
              Publicaciones Faltantes
            </v-tab>
          </v-tabs>

          <v-card-text>
            <v-row class="mb-4">
              <v-col cols="12" md="3">
                <v-select
                  v-model="statusFilter"
                  :items="statusOptions"
                  item-title="title"
                  item-value="value"
                  label="Filtrar por estado"
                  variant="outlined"
                  density="comfortable"
                  @update:model-value="handleStatusFilterChange"
                  :color="statusFilter ? 'primary' : undefined"
                  :bg-color="statusFilter ? 'primary-lighten-5' : undefined"
                >
                  <template v-slot:append-inner>
                    <v-icon v-if="statusFilter" color="primary" @click.stop="statusFilter = ''; handleStatusFilterChange()">mdi-close</v-icon>
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12" md="3" v-if="activeTab === 0">
                <v-select
                  v-model="syncActiveFilter"
                  :items="booleanFilterOptions"
                  item-title="title"
                  item-value="value"
                  label="Filtrar por Sync Activo"
                  variant="outlined"
                  density="comfortable"
                  @update:model-value="handleSyncActiveFilterChange"
                  :color="syncActiveFilter ? 'primary' : undefined"
                  :bg-color="syncActiveFilter ? 'primary-lighten-5' : undefined"
                >
                  <template v-slot:append-inner>
                    <v-icon v-if="syncActiveFilter" color="primary" @click.stop="syncActiveFilter = ''; handleSyncActiveFilterChange()">mdi-close</v-icon>
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12" md="3" v-if="activeTab === 0">
                <v-select
                  v-model="catalogActiveFilter"
                  :items="booleanFilterOptions"
                  item-title="title"
                  item-value="value"
                  label="Filtrar por Catálogo Activo"
                  variant="outlined"
                  density="comfortable"
                  @update:model-value="handleCatalogActiveFilterChange"
                  :color="catalogActiveFilter ? 'primary' : undefined"
                  :bg-color="catalogActiveFilter ? 'primary-lighten-5' : undefined"
                >
                  <template v-slot:append-inner>
                    <v-icon v-if="catalogActiveFilter" color="primary" @click.stop="catalogActiveFilter = ''; handleCatalogActiveFilterChange()">mdi-close</v-icon>
                  </template>
                </v-select>
              </v-col>

              <v-col :cols="12" :md="activeTab === 0 ? 3 : 9" class="d-flex justify-end align-center gap-2">
                <v-btn
                  v-if="activeTab === 0 && hasActiveFilters"
                  color="secondary"
                  variant="outlined"
                  @click="clearAllFilters"
                  class="mr-2"
                  size="small"
                >
                  <v-icon start>mdi-filter-remove</v-icon>
                  Limpiar filtros
                </v-btn>
                <v-btn
                  color="primary"
                  :loading="loading"
                  @click="activeTab === 0 ? loadProductIds() : activeTab === 1 ? loadOrphanProducts() : null"
                >
                  <v-icon start>mdi-refresh</v-icon>
                  Actualizar
                </v-btn>
              </v-col>
            </v-row>

            <!-- Mensaje de filtrado -->
            <div v-if="filteredMessage && activeTab === 0" class="d-flex align-center mb-2">
              <v-chip color="info" variant="outlined" size="small" class="mr-2">
                <v-icon start size="small">mdi-filter</v-icon>
                {{ filteredMessage }}
              </v-chip>
              <v-btn 
                size="x-small" 
                icon 
                variant="text" 
                color="grey" 
                @click="clearAllFilters"
                v-if="hasActiveFilters"
              >
                <v-icon size="small">mdi-close</v-icon>
                <v-tooltip activator="parent" location="top">Limpiar filtros</v-tooltip>
              </v-btn>
            </div>
            
            <!-- Tabla de IDs de productos -->
            <v-data-table
              v-if="activeTab === 0"
              :headers="productIdsHeaders"
              :items="filteredProductIds"
              :loading="loading"
              :items-per-page="itemsPerPage"
              class="elevation-1"
              :no-data-text="
                hasAccount
                  ? 'No hay productos disponibles'
                  : 'Selecciona una cuenta para ver los productos'
              "
            >
              <template #[`item.SyncActive`]="{ item }">
                <v-chip :color="item.SyncActive ? 'success' : 'error'" size="small">
                  {{ item.SyncActive ? 'Activo' : 'Inactivo' }}
                </v-chip>
              </template>

              <template #[`item.CatalogActive`]="{ item }">
                <v-chip :color="item.CatalogActive ? 'success' : 'error'" size="small">
                  {{ item.CatalogActive ? 'Activo' : 'Inactivo' }}
                </v-chip>
              </template>

              <template #[`item.Status`]="{ item }">
                <v-chip :color="item.Status ? 'success' : 'error'" size="small">
                  {{ item.Status ? 'Activo' : 'Inactivo' }}
                </v-chip>
              </template>

              <template #[`item.ToSync`]="{ item }">
                <span>{{ item.ToSync === null ? 'N/A' : item.ToSync ? 'Sí' : 'No' }}</span>
              </template>

              <template #[`item.updated_at`]="{ item }">
                {{ new Date(item.updated_at).toLocaleString() }}
              </template>

              <template #[`item.actions`]="{ item }">
                <v-btn
                  icon
                  size="small"
                  color="primary"
                  class="mr-2"
                  @click="viewProductDetail(item.ID)"
                  :disabled="loading"
                >
                  <v-icon>mdi-eye</v-icon>
                  <v-tooltip activator="parent" location="top">Ver detalles</v-tooltip>
                </v-btn>

                <v-btn icon size="small" color="info" @click="openProductInNewTab(item.ID)">
                  <v-icon>mdi-open-in-new</v-icon>
                  <v-tooltip activator="parent" location="top">Ver en Mercado Libre</v-tooltip>
                </v-btn>
              </template>

              <template #bottom>
                <div class="d-flex flex-column align-center pa-2">
                  <div class="d-flex justify-center align-center w-100 mb-3">
                    <v-pagination
                      v-model="page"
                      :length="Math.ceil(totalProductIds / itemsPerPage)"
                      @update:model-value="handlePageChange"
                      :disabled="loading"
                      :total-visible="5"
                      show-first
                      show-last
                      class="pagination-centered"
                    ></v-pagination>
                  </div>
                  <div class="d-flex align-center">
                    <span class="text-caption me-2">Registros por página:</span>
                    <v-select
                      v-model="itemsPerPage"
                      :items="itemsPerPageOptions"
                      variant="outlined"
                      density="compact"
                      class="items-per-page-select"
                      hide-details
                      @update:model-value="handleItemsPerPageChange"
                    ></v-select>
                  </div>
                </div>
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
              :no-data-text="
                hasAccount
                  ? 'No hay productos huérfanos disponibles'
                  : 'Selecciona una cuenta para ver los productos huérfanos'
              "
            >
              <template #[`item.status`]="{ item }">
                <v-chip
                  :color="
                    item.status === 'active'
                      ? 'success'
                      : item.status === 'paused'
                        ? 'warning'
                        : 'error'
                  "
                  size="small"
                >
                  {{
                    item.status === 'active'
                      ? 'Activo'
                      : item.status === 'paused'
                        ? 'Pausado'
                        : 'Finalizado'
                  }}
                </v-chip>
              </template>

              <template #[`item.sync_status`]="{ item }">
                <v-chip
                  v-if="item.sync_status"
                  :color="
                    item.sync_status === 'synced'
                      ? 'success'
                      : item.sync_status === 'pending'
                        ? 'warning'
                        : 'error'
                  "
                  size="small"
                >
                  {{
                    item.sync_status === 'synced'
                      ? 'Sincronizado'
                      : item.sync_status === 'pending'
                        ? 'Pendiente'
                        : 'Error'
                  }}
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

                <v-btn icon size="small" color="info" @click="openProductInNewTab(item.id)">
                  <v-icon>mdi-open-in-new</v-icon>
                  <v-tooltip activator="parent" location="top">Ver en Mercado Libre</v-tooltip>
                </v-btn>
              </template>

              <template #bottom>
                <div class="d-flex flex-column align-center pa-2">
                  <div class="d-flex justify-center align-center w-100 mb-3">
                    <v-pagination
                      v-model="page"
                      :length="Math.ceil(totalOrphans / itemsPerPage)"
                      @update:model-value="handlePageChange"
                      :disabled="loading"
                      :total-visible="5"
                      show-first
                      show-last
                      class="pagination-centered"
                    ></v-pagination>
                  </div>
                  <div class="d-flex align-center">
                    <span class="text-caption me-2">Registros por página:</span>
                    <v-select
                      v-model="itemsPerPage"
                      :items="itemsPerPageOptions"
                      variant="outlined"
                      density="compact"
                      class="items-per-page-select"
                      hide-details
                      @update:model-value="handleItemsPerPageChange"
                    ></v-select>
                  </div>
                </div>
              </template>
            </v-data-table>

            <!-- Tabla de publicaciones faltantes -->
            <MissingPublicationsTable
              v-if="activeTab === 2"
              :loading="loading"
              @update:loading="loading = $event"
              @error="error = $event"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Diálogo de detalle de producto -->
    <v-dialog v-model="showProductDetail" max-width="900" scrollable>
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
                  <v-list-item-subtitle>{{
                    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
                      selectedProduct.price,
                    )
                  }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Cantidad disponible</v-list-item-title>
                  <v-list-item-subtitle>{{
                    selectedProduct.available_quantity
                  }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Categoría</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedProduct.category_id }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Estado</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="
                        selectedProduct.status === 'active'
                          ? 'success'
                          : selectedProduct.status === 'paused'
                            ? 'warning'
                            : 'error'
                      "
                      size="small"
                    >
                      {{
                        selectedProduct.status === 'active'
                          ? 'Activo'
                          : selectedProduct.status === 'paused'
                            ? 'Pausado'
                            : 'Finalizado'
                      }}
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
          <v-btn color="primary" variant="text" @click="showProductDetail = false"> Cerrar </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.items-per-page-select {
  width: 100px;
}

.v-tab {
  min-height: 48px;
  border-radius: 4px 4px 0 0;
  margin-right: 4px;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
}

.tab-with-border::after {
  content: '';
  position: absolute;
  right: -2px;
  top: 30%;
  height: 40%;
  width: 1px;
  background-color: rgba(0, 0, 0, 0.1);
}

.v-tab--selected {
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: rgba(255, 255, 255, 0.7);
}

.tabs-with-separators :deep(.v-slide-group__content) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.v-tabs-slider {
  height: 3px;
}

.pagination-centered {
  margin: 0 auto;
}
</style>
