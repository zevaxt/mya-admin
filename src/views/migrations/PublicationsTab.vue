<template>
  <div>
    <!-- Título y botones -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 text-primary font-weight-medium mb-1">PUBLICACIONES</h3>
        <p class="text-caption text-grey">Publicaciones registradas en el sistema</p>
      </div>
      <v-btn
        color="primary"
        variant="outlined"
        @click="loadProductIds"
        :loading="loading"
        size="small"
      >
        <v-icon start>mdi-refresh</v-icon>
        Refrescar
      </v-btn>
    </div>

    <!-- Filtros -->
    <div class="filter-container mb-4">
      <v-row>
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
              <v-icon
                v-if="statusFilter"
                color="primary"
                @click.stop="
                  () => {
                    statusFilter = ''
                    handleStatusFilterChange()
                  }
                "
                >mdi-close</v-icon
              >
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="3">
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
              <v-icon
                v-if="syncActiveFilter"
                color="primary"
                @click.stop="
                  () => {
                    syncActiveFilter = ''
                    handleSyncActiveFilterChange()
                  }
                "
                >mdi-close</v-icon
              >
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="3">
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
              <v-icon
                v-if="catalogActiveFilter"
                color="primary"
                @click.stop="
                  () => {
                    catalogActiveFilter = ''
                    handleCatalogActiveFilterChange()
                  }
                "
                >mdi-close</v-icon
              >
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="3" class="d-flex justify-end align-center gap-2">
          <v-btn
            v-if="hasActiveFilters || searchQuery"
            color="secondary"
            variant="outlined"
            @click="clearAllFilters"
            class="mr-2"
            size="small"
          >
            <v-icon start>mdi-filter-remove</v-icon>
            Limpiar filtros
          </v-btn>
        </v-col>
      </v-row>

      <!-- La barra de búsqueda ahora está integrada en el encabezado de la columna ID -->
    </div>

    <!-- Mensaje de filtrado -->
    <div v-if="filteredMessage" class="d-flex align-center mb-2">
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
    <div class="position-relative">
      <v-data-table
        ref="dataTable"
        v-model="selectedItems"
        :headers="productIdsHeaders"
        :items="filteredProductIds"
        :loading="loading"
        :items-per-page="itemsPerPage"
        class="elevation-1 rounded-lg"
        :no-data-text="
          hasAccount
            ? 'No hay productos disponibles'
            : 'Selecciona una cuenta para ver los productos'
        "
        show-select
        item-value="ID"
      >
        <!-- Template para el encabezado personalizado de la columna ID -->
        <template #[`header.ID`]="{ column }">
          <div
            class="d-flex align-center header-content"
            style="position: relative; min-width: 150px"
          >
            <!-- Contenedor con posición absoluta para evitar cambios en el layout -->
            <div style="position: absolute; width: 100%; z-index: 1">
              <v-fade-transition>
                <div
                  v-if="!showIdSearch"
                  class="d-flex align-center sortable-header"
                  @click="handleSort(column.key || '')"
                >
                  <span class="mr-2">{{ column.title }}</span>
                  <!-- Icono de ordenamiento (similar al que usa Vuetify internamente) -->
                  <v-icon
                    v-if="column.sortable"
                    size="x-small"
                    :icon="getSortIcon(column)"
                    class="sort-icon"
                    :class="{ 'visible-on-hover': !isSorted(column) }"
                  ></v-icon>
                  <v-btn
                    icon="mdi-magnify"
                    size="x-small"
                    variant="text"
                    color="primary"
                    class="ml-2"
                    @click.stop="activateSearch"
                  ></v-btn>
                </div>
              </v-fade-transition>
            </div>

            <!-- Contenedor con posición absoluta para la caja de búsqueda -->
            <div style="position: absolute; width: 100%; z-index: 2">
              <v-fade-transition>
                <v-text-field
                  v-if="showIdSearch"
                  v-model="searchQuery"
                  variant="outlined"
                  density="compact"
                  hide-details
                  placeholder="Buscar ID"
                  class="search-field"
                  clearable
                  ref="searchInput"
                  @update:model-value="handleSearchQueryChange"
                  @click:clear="clearSearchQuery"
                  @blur="handleSearchBlur"
                  @keydown.esc="deactivateSearch"
                  @click.stop
                ></v-text-field>
              </v-fade-transition>
            </div>

            <!-- Espacio invisible para mantener el ancho de la columna -->
            <div style="height: 1px; visibility: hidden">
              <div style="width: 150px"></div>
            </div>
          </div>
        </template>

        <template #[`item.price`]="{ item }">
          <div class="d-flex align-center justify-end w-100">
            <span :class="{ 'font-weight-medium': item.price, 'price-text': true }">
              {{ formatPrice(item.price) }}
            </span>
          </div>
        </template>

        <template #[`item.SyncActive`]="{ item }">
          <div class="d-flex align-center justify-center w-100">
            <v-switch
              v-model="item.SyncActive"
              color="success"
              hide-details
              density="compact"
              :loading="processingSyncActiveId === item.ID"
              :disabled="processingSyncActiveId === item.ID"
              @click.stop="toggleSyncActive(item.ID, item.SyncActive)"
              class="ma-0 pa-0"
            ></v-switch>
          </div>
        </template>

        <template #[`item.CatalogActive`]="{ item }">
          <v-chip :color="item.CatalogActive ? 'success' : 'error'" size="small">
            {{ item.CatalogActive ? 'Sí' : 'No' }}
          </v-chip>
        </template>

        <template #[`item.Status`]="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" class="text-capitalize">
            {{ item.status || (item.Status ? 'active' : 'inactive') }}
          </v-chip>
        </template>

        <template #[`item.Populate`]="{ item }">
          <v-chip :color="item.Populate ? 'success' : 'grey'" size="small">
            {{ item.Populate ? 'Sí' : 'No' }}
          </v-chip>
        </template>

        <template #[`item.updated_at`]="{ item }">
          {{ formatDate(item.updated_at) }}
        </template>

        <template #[`item.last_updated`]="{ item }">
          {{ item.last_updated ? formatDate(item.last_updated) : 'No disponible' }}
        </template>

        <template #[`item.date_created`]="{ item }">
          {{ item.date_created ? formatDate(item.date_created) : 'No disponible' }}
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="d-flex">
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

            <v-btn
              icon
              size="small"
              color="error"
              class="mr-2"
              @click="confirmDeleteProduct(item.ID)"
              :disabled="loading || processingDeleteId === item.ID"
              :loading="processingDeleteId === item.ID"
            >
              <v-icon v-if="processingDeleteId !== item.ID">mdi-delete</v-icon>
              <v-tooltip activator="parent" location="top">Eliminar publicación</v-tooltip>
            </v-btn>

            <v-btn
              icon
              size="small"
              color="success"
              class="mr-2"
              @click="confirmPopulateProduct(item.ID)"
              :disabled="loading || processingPopulateId === item.ID"
              :loading="processingPopulateId === item.ID"
            >
              <v-icon v-if="processingPopulateId !== item.ID">mdi-database-import</v-icon>
              <v-tooltip activator="parent" location="top">Populate</v-tooltip>
            </v-btn>

            <v-btn icon size="small" color="info" @click="openProductInNewTab(item.ID)">
              <v-icon>mdi-open-in-new</v-icon>
              <v-tooltip activator="parent" location="top">Ver en Mercado Libre</v-tooltip>
            </v-btn>
          </div>
        </template>

        <!-- No usamos el slot bottom para poder tener un paginador fijo -->
        <template #bottom> </template>
      </v-data-table>

      <!-- Paginador fijo -->
      <div class="pagination-fixed">
        <div class="d-flex align-center w-100 px-4 py-2 bg-white">
          <div class="d-flex align-center">
            <v-btn
              color="error"
              variant="outlined"
              size="small"
              :disabled="selectedItems.length === 0"
              @click="deleteSelectedItems"
              class="me-4"
            >
              <v-icon start>mdi-delete</v-icon>
              Eliminar {{ selectedItems.length }} seleccionadas
            </v-btn>
            
            <v-btn
              color="success"
              variant="outlined"
              size="small"
              :disabled="selectedItems.length === 0 || processingPopulateMultiple"
              @click="confirmPopulateSelectedItems"
              :loading="processingPopulateMultiple"
              class="me-4"
            >
              <v-icon start>mdi-database-import</v-icon>
              Populate {{ selectedItems.length }} seleccionadas
            </v-btn>
            <div class="text-caption text-grey me-4">
              {{
                totalProductIds > 0
                  ? `${(page - 1) * itemsPerPage + 1}-${Math.min(
                      page * itemsPerPage,
                      totalProductIds,
                    )} de ${totalProductIds}`
                  : '0-0 de 0'
              }}
            </div>
          </div>
          <div class="d-flex align-center me-4">
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
          <v-pagination
            v-model="page"
            :length="Math.ceil(totalProductIds / itemsPerPage)"
            @update:model-value="handlePageChange"
            :disabled="loading"
            :total-visible="5"
            show-first
            show-last
            class="pagination-centered flex-grow-1"
            density="comfortable"
            rounded="circle"
            active-color="primary"
          ></v-pagination>
        </div>
      </div>
    </div>

    <!-- Diálogo de confirmación -->
    <v-dialog v-model="showConfirmDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          {{ confirmDialogTitle }}
        </v-card-title>

        <v-card-text>
          {{ confirmDialogMessage }}
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showConfirmDialog = false">Cancelar</v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="
              async () => {
                showConfirmDialog = false
                await confirmDialogAction()
              }
            "
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Notificación de éxito o error -->
    <v-snackbar v-model="showNotification" :color="notificationType" :timeout="3000" location="top">
      {{ notificationMessage }}
      <template v-slot:actions>
        <v-btn variant="text" icon="mdi-close" @click="showNotification = false"></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/account'
import migrationService from '@/services/migrationService'
import { openInMercadoLibre } from '@/utils/mercadoLibreUtils'
import type { ProductId } from '@/services/migrationService'

const router = useRouter()

// Emits
// No hay emisiones de eventos

// Stores
const accountStore = useAccountStore()

// Estado
const loading = ref(false)
const error = ref<string | null>(null)
const productIds = ref<ProductId[]>([])
const statusFilter = ref('')
const syncActiveFilter = ref<string>('')
const catalogActiveFilter = ref<string>('')
const searchQuery = ref('')
const totalProductIds = ref(0)
const page = ref(1)
const itemsPerPage = ref(100)
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'warning'>('success')
const processingPopulateId = ref<string | null>(null)
const processingDeleteId = ref<string | null>(null)
const processingSyncActiveId = ref<string | null>(null)
const processingPopulateMultiple = ref<boolean>(false)

// Estado para el diálogo de confirmación
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogAction = ref<() => Promise<void>>(() => Promise.resolve())

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

// Estado para los elementos seleccionados
const selectedItems = ref<ProductId[]>([])

// Cabeceras de tabla para IDs de productos
const productIdsHeaders = [
  { title: '', key: 'select', sortable: false },
  {
    title: 'ID',
    key: 'ID',
    sortable: true,
    filterable: true,
  },
  { title: 'Precio', key: 'price', sortable: true, class: 'text-right' },
  { title: 'Sync', key: 'SyncActive', sortable: true, class: 'text-center' },
  { title: 'Catálogo', key: 'CatalogActive', sortable: true },
  { title: 'Estado', key: 'Status', sortable: true },
  { title: 'Populate', key: 'Populate', sortable: true },
  { title: 'F. Populated', key: 'updated_at', sortable: true },
  { title: 'F. Updated', key: 'last_updated', sortable: true },
  { title: 'F. Created', key: 'date_created', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false },
]

// Estado para el filtro de búsqueda en la tabla
const showIdSearch = ref(false)

// Computed properties
const currentAccount = computed(() => accountStore.currentAccount)
const accountId = computed(() => currentAccount.value?.ID || 0)
const hasAccount = computed(() => !!currentAccount.value)

// Verificar si hay filtros activos
const hasActiveFilters = computed(() => {
  return (
    statusFilter.value !== '' ||
    syncActiveFilter.value !== '' ||
    catalogActiveFilter.value !== '' ||
    searchQuery.value !== ''
  )
})

// Mensaje de resultados filtrados
const filteredMessage = computed(() => {
  if (!hasActiveFilters.value || !productIds.value.length) return ''

  const total = productIds.value.length
  const filtered = filteredProductIds.value.length

  return `Mostrando ${filtered} de ${total} publicaciones`
})

// Filtrar IDs de productos
const filteredProductIds = computed(() => {
  let filtered = [...productIds.value]

  // Filtrar por estado
  if (statusFilter.value) {
    if (statusFilter.value === 'active') {
      // Filtrar solo los productos con estado 'active'
      filtered = filtered.filter(
        (item) =>
          item.status?.toLowerCase() === 'active' ||
          (item.status === undefined && item.Status === true),
      )
    } else {
      // Filtrar todos los productos con estado diferente a 'active'
      filtered = filtered.filter(
        (item) =>
          item.status?.toLowerCase() !== 'active' &&
          !(item.status === undefined && item.Status === true),
      )
    }
  }

  // Filtrar por Sync Activo
  if (syncActiveFilter.value) {
    const isActive = syncActiveFilter.value === 'true' ? true : false
    filtered = filtered.filter((item) => item.SyncActive === isActive)
  }

  // Filtrar por Catálogo Activo
  if (catalogActiveFilter.value) {
    const isActive = catalogActiveFilter.value === 'true' ? true : false
    filtered = filtered.filter((item) => item.CatalogActive === isActive)
  }

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((item) => {
      return item.ID.toLowerCase().includes(query)
    })
  }

  return filtered
})

// Cargar IDs de productos
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
      undefined, // status
      offset,
      itemsPerPage.value,
    )

    if (response && response.products) {
      productIds.value = response.products
      totalProductIds.value = response.total
    } else {
      error.value = 'Error al cargar IDs de productos'
    }
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

// Ver detalles del producto
const viewProductDetail = (productId: string) => {
  router.push(`/product/${productId}`)
}

// Actualizar el estado de sincronización de un producto
const toggleSyncActive = async (productId: string, currentValue: boolean) => {
  if (!hasAccount.value) return

  try {
    processingSyncActiveId.value = productId
    const newValue = !currentValue

    const result = await migrationService.updateSyncActive(productId, newValue, accountId.value)

    if (result && result.success) {
      // Actualizar el estado localmente para evitar recargar toda la lista
      const index = productIds.value.findIndex((p) => p.ID === productId)
      if (index !== -1) {
        productIds.value[index].SyncActive = newValue
      }

      notificationMessage.value = result.message
      notificationType.value = 'success'
    } else {
      notificationMessage.value = 'Error al actualizar el estado de sincronización'
      notificationType.value = 'error'
      // Recargar la lista para asegurar que los datos están actualizados
      await loadProductIds()
    }
  } catch (err) {
    console.error(`Error al actualizar el estado de sincronización para ${productId}:`, err)
    notificationMessage.value = 'Error al actualizar el estado de sincronización'
    notificationType.value = 'error'
    // Recargar la lista para asegurar que los datos están actualizados
    await loadProductIds()
  } finally {
    showNotification.value = true
    processingSyncActiveId.value = null
  }
}

// Confirmar eliminación de un producto
const confirmDeleteProduct = (productId: string) => {
  confirmDialogTitle.value = 'Confirmar eliminación'
  confirmDialogMessage.value = `¿Estás seguro de que deseas eliminar la publicación ${productId}? Esta acción no se puede deshacer.`
  confirmDialogAction.value = () => deleteProduct(productId)
  showConfirmDialog.value = true
}

// Eliminar un producto
const deleteProduct = async (productId: string) => {
  if (!hasAccount.value) return

  try {
    processingDeleteId.value = productId
    const result = await migrationService.deleteProduct(accountId.value, productId)

    if (result && result.success) {
      notificationMessage.value = result.message
      notificationType.value = 'success'
      await loadProductIds()
    } else {
      notificationMessage.value = 'Error al eliminar la publicación'
      notificationType.value = 'error'
    }
  } catch (err) {
    console.error(`Error al eliminar el producto ${productId}:`, err)
    notificationMessage.value = 'Error al eliminar la publicación'
    notificationType.value = 'error'
  } finally {
    showNotification.value = true
    processingDeleteId.value = null
  }
}

// Confirmar populate de un producto
const confirmPopulateProduct = (productId: string) => {
  confirmDialogTitle.value = 'Confirmar populate'
  confirmDialogMessage.value = `¿Estás seguro de que deseas hacer populate de la publicación ${productId}?`
  confirmDialogAction.value = () => populateProduct(productId)
  showConfirmDialog.value = true
}

// Populate un producto
const populateProduct = async (productId: string) => {
  if (!hasAccount.value) return

  try {
    console.log('Populate individual - Product ID:', productId, 'Account ID:', accountId.value)
    if (!productId) {
      console.error('ID de producto indefinido o vacío en populate individual')
      notificationMessage.value = 'Error: ID de producto no válido'
      notificationType.value = 'error'
      showNotification.value = true
      return
    }
    processingPopulateId.value = productId
    // Usar el método correcto del servicio
    const result = await migrationService.updateProductPopulate(accountId.value, productId)

    if (result && result.success) {
      notificationMessage.value = result.message
      notificationType.value = 'success'
      await loadProductIds()
    } else {
      notificationMessage.value = 'Error al hacer populate de la publicación'
      notificationType.value = 'error'
    }
  } catch (err) {
    console.error(`Error al hacer populate del producto ${productId}:`, err)
    notificationMessage.value = 'Error al hacer populate de la publicación'
    notificationType.value = 'error'
  } finally {
    showNotification.value = true
    processingPopulateId.value = null
  }
}

// Eliminar los elementos seleccionados
const deleteSelectedItems = async () => {
  if (selectedItems.value.length === 0) return

  // Mostrar diálogo de confirmación
  confirmDialogTitle.value = 'Eliminar publicaciones seleccionadas'
  confirmDialogMessage.value = `¿Estás seguro de que deseas eliminar las ${selectedItems.value.length} publicaciones seleccionadas?`
  confirmDialogAction.value = async () => {
    try {
      // Mostrar loading
      loading.value = true

      // Llamar al servicio para eliminar los productos seleccionados
      const result = await migrationService.deleteMultipleProducts(
        accountId.value,
        selectedItems.value.map((item) => item.ID)
      )

      if (result && result.success) {
        notificationMessage.value = result.message
        notificationType.value = 'success'
        selectedItems.value = []
        await loadProductIds()
      } else {
        notificationMessage.value = 'Error al eliminar las publicaciones seleccionadas'
        notificationType.value = 'error'
      }
    } catch (err) {
      console.error('Error al eliminar productos seleccionados:', err)
      notificationMessage.value = 'Error al eliminar las publicaciones seleccionadas'
      notificationType.value = 'error'
    } finally {
      showNotification.value = true
      loading.value = false
    }
  }
  showConfirmDialog.value = true
}

// Confirmar populate de múltiples productos
const confirmPopulateSelectedItems = () => {
  if (selectedItems.value.length === 0) return

  // Mostrar diálogo de confirmación
  confirmDialogTitle.value = 'Populate publicaciones seleccionadas'
  confirmDialogMessage.value = `¿Estás seguro de que deseas hacer populate de las ${selectedItems.value.length} publicaciones seleccionadas?`
  confirmDialogAction.value = () => populateSelectedItems()
  showConfirmDialog.value = true
}

// Populate múltiples productos
const populateSelectedItems = async () => {
  if (!hasAccount.value || selectedItems.value.length === 0) return

  try {
    processingPopulateMultiple.value = true
    
    // Convertir los IDs seleccionados a strings si es necesario
    const productIds = selectedItems.value.map(id => id.toString())
    
    // Usar el nuevo método que procesa múltiples productos en una sola llamada
    const result = await migrationService.updateMultipleProductsPopulate(
      accountId.value,
      productIds
    )
    
    // Mostrar mensaje de resultado
    notificationMessage.value = result.message
    notificationType.value = result.success ? 'success' : 
      (result.results.some(r => r.success) ? 'warning' : 'error')
    
    // Recargar los datos para reflejar los cambios
    await loadProductIds()
  } catch (err) {
    console.error('Error al hacer populate de productos seleccionados:', err)
    notificationMessage.value = 'Error al hacer populate de las publicaciones seleccionadas'
    notificationType.value = 'error'
  } finally {
    showNotification.value = true
    processingPopulateMultiple.value = false
  }
}

// Alias para mantener compatibilidad con el código existente
const openProductInNewTab = openInMercadoLibre

// Formatear fecha
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (_) {
    return dateString
  }
}

// Formatear precio
const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) return 'No disponible'

  try {
    // Formatear el precio con separador de miles y sin decimales
    const formattedPrice = new Intl.NumberFormat('es-ES', {
      style: 'decimal', // Cambiado de 'currency' a 'decimal' para evitar el símbolo de moneda automático
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)

    // Añadir el símbolo $ al principio
    return `$${formattedPrice}`
  } catch (_) {
    return `$${price}`
  }
}

// Determinar el color del chip según el estado
const getStatusColor = (status: string | undefined): string => {
  if (!status) return 'grey'

  status = status.toLowerCase()

  switch (status) {
    case 'active':
      return 'success'
    case 'paused':
      return 'warning'
    case 'closed':
      return 'error'
    case 'under_review':
      return 'info'
    default:
      return 'grey'
  }
}

// Manejar cambio de página
const handlePageChange = () => {
  loadProductIds()
}

// Manejar cambio de items por página
const handleItemsPerPageChange = () => {
  page.value = 1 // Resetear a la primera página cuando cambia el número de items por página
  loadProductIds()
}

// Manejar cambio de filtro de estado
const handleStatusFilterChange = () => {
  page.value = 1
  loadProductIds()
}

// Manejar cambio de filtro de sync activo
const handleSyncActiveFilterChange = () => {
  page.value = 1
  loadProductIds()
}

// Manejar cambio de filtro de catálogo activo
const handleCatalogActiveFilterChange = () => {
  page.value = 1
  loadProductIds()
}

// Referencias para el campo de búsqueda y la tabla de datos
const searchInput = ref<HTMLElement | null>(null)
const dataTable = ref<unknown>(null)

// Función para manejar el ordenamiento
const handleSort = (key: string) => {
  if (dataTable.value) {
    // Intentar usar el método sort de la tabla si está disponible
    if (typeof dataTable.value.sort === 'function') {
      dataTable.value.sort(key)
    }
  }
}

// Definir interfaz para la columna
interface TableColumn {
  sortable?: boolean
  key?: string
  options?: {
    sortBy?: string[]
    sortDesc?: boolean[]
  }
}

// Función para verificar si una columna está ordenada
const isSorted = (column: TableColumn) => {
  if (!column.sortable || !column.options || !column.options.sortBy) return false
  return column.options.sortBy.includes(column.key || '')
}

// Función para obtener el icono de ordenamiento
const getSortIcon = (column: TableColumn) => {
  // Si la columna no está ordenada, mostrar el icono neutral
  if (!column.sortable) return ''

  // Verificar si la tabla tiene información de ordenamiento
  if (!column.options || !column.options.sortBy) return 'mdi-arrow-up-down'

  // Determinar la dirección del ordenamiento
  if (!isSorted(column)) return 'mdi-arrow-up-down'

  // Mostrar el icono según la dirección del ordenamiento
  return column.options.sortDesc && column.options.sortDesc[0] ? 'mdi-arrow-down' : 'mdi-arrow-up'
}

// Función para activar la búsqueda
const activateSearch = () => {
  showIdSearch.value = true
  // Enfocar el campo de búsqueda después de que se muestre
  setTimeout(() => {
    if (searchInput.value) {
      const input = searchInput.value.querySelector('input')
      if (input) input.focus()
    }
  }, 100)
}

// Función para desactivar la búsqueda
const deactivateSearch = () => {
  showIdSearch.value = false
}

// Función para manejar cuando se pierde el foco en el campo de búsqueda
const handleSearchBlur = () => {
  // Usar setTimeout para permitir que otros eventos (como click) se procesen primero
  setTimeout(() => {
    // Verificar si el campo de búsqueda sigue teniendo el foco
    const activeElement = document.activeElement
    const searchField = searchInput.value

    // Si el elemento activo no es el campo de búsqueda o un elemento dentro de él
    if (searchField && !searchField.contains(activeElement)) {
      // Solo desactivar si el campo está vacío
      if (!searchQuery.value) {
        deactivateSearch()
      }
    }
  }, 100)
}

// Función para manejar el cambio en la búsqueda
const handleSearchQueryChange = () => {
  // Reiniciar a la primera página cuando cambia la búsqueda
  page.value = 1
}

// Función para limpiar la búsqueda
const clearSearchQuery = () => {
  searchQuery.value = ''
  handleSearchQueryChange()
  deactivateSearch()
}

// Limpiar todos los filtros
const clearAllFilters = () => {
  statusFilter.value = ''
  syncActiveFilter.value = ''
  catalogActiveFilter.value = ''
  searchQuery.value = ''
  handleStatusFilterChange()
}

// Observar cambios en la cuenta seleccionada
watch(
  () => accountId.value,
  (newAccountId) => {
    if (newAccountId) {
      loadProductIds()
    }
  },
)

// Cargar datos iniciales
onMounted(() => {
  if (hasAccount.value) {
    loadProductIds()
  }
})
</script>

<style scoped>
.filter-container {
  margin-bottom: 16px;
}

.items-per-page-select {
  width: 100px;
}

.v-data-table :deep(th) {
  font-weight: 600 !important;
  background-color: #f5f5f5;
}

.v-data-table :deep(tr:hover) {
  background-color: #f9f9f9;
}

.position-relative {
  position: relative;
}

.pagination-fixed {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.05);
  border-radius: 0 0 8px 8px;
}

.pagination-centered {
  margin: 0 auto;
}

/* Estilos para la transición del campo de búsqueda */
.v-slide-x-transition-enter-active,
.v-slide-x-transition-leave-active {
  transition: all 0.3s ease;
  position: absolute;
  width: 100%;
}

.search-field {
  transition: all 0.3s ease;
  width: 100%;
}

/* Estilo para el campo de búsqueda en el encabezado */
:deep(.search-field .v-field__input) {
  padding-top: 0;
  padding-bottom: 0;
  min-height: 32px;
}

:deep(.v-field__field) {
  height: 32px;
}

/* Animación de pulso para el chip cuando se está procesando */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.pulse-animation {
  animation: pulse 1.5s infinite ease-in-out;
}

/* Estilos para el encabezado ordenable */
.sortable-header {
  cursor: pointer;
  user-select: none;
}

.sortable-header:hover {
  color: var(--v-theme-primary);
}

.sort-icon {
  opacity: 0.7;
  margin-left: 4px;
}

/* Estilo para el texto del precio */
.price-text {
  font-family:
    'Inter',
    'SF Pro Display',
    'Segoe UI',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-feature-settings:
    'tnum' on,
    'lnum' on; /* Activa números tabulares y lineales */
  text-align: right;
  width: 100%;
  padding-right: 8px;
  font-weight: 500; /* Semi-bold para mejor legibilidad */
  letter-spacing: -0.01em; /* Ligero ajuste de espaciado para mejor apariencia */
}

.visible-on-hover {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.sortable-header:hover .visible-on-hover {
  opacity: 0.7;
}

/* Estilos para la transición suave */
.header-content {
  min-height: 40px;
}

.search-field {
  width: 100%;
}

/* Ajustes para las transiciones */
.v-fade-transition-enter-active,
.v-fade-transition-leave-active {
  transition: opacity 0.3s ease;
}

.v-fade-transition-enter-from,
.v-fade-transition-leave-to {
  opacity: 0;
}
</style>
