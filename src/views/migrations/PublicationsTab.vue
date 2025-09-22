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
            v-if="hasActiveFilters"
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
          <v-chip
            :color="item.Status ? 'success' : 'error'"
            size="small"
          >
            {{ item.Status ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>

        <template #[`item.ToSync`]="{ item }">
          <v-chip :color="item.ToSync ? 'success' : 'grey'" size="small">
            {{ item.ToSync ? 'Sí' : 'No' }}
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
            <div class="text-caption text-grey me-4">
              {{
                totalProductIds > 0
                  ? `${(page - 1) * itemsPerPage + 1}-${Math.min(
                      page * itemsPerPage,
                      totalProductIds
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
import { useAccountStore } from '@/stores/account'
import migrationService from '@/services/migrationService'
import type { ProductId } from '@/services/migrationService'

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
const totalProductIds = ref(0)
const page = ref(1)
const itemsPerPage = ref(100)
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'warning'>('success')
const processingPopulateId = ref<string | null>(null)
const processingDeleteId = ref<string | null>(null)

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
const selectedItems = ref([])

// Cabeceras de tabla para IDs de productos
const productIdsHeaders = [
  { title: '', key: 'select', sortable: false },
  { title: 'ID', key: 'ID', sortable: true },
  { title: 'Cuenta', key: 'AccountName', sortable: true },
  { title: 'Sync Activo', key: 'SyncActive', sortable: true },
  { title: 'Catálogo Activo', key: 'CatalogActive', sortable: true },
  { title: 'Estado', key: 'Status', sortable: true },
  { title: 'Por Sincronizar', key: 'ToSync', sortable: true },
  { title: 'Populate', key: 'Populate', sortable: true },
  { title: 'Actualizado', key: 'updated_at', sortable: true },
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

  return `Mostrando ${filtered} de ${total} publicaciones`
})

// Filtrar IDs de productos
const filteredProductIds = computed(() => {
  let filtered = [...productIds.value]

  // Filtrar por estado
  if (statusFilter.value) {
    // Convertir el valor booleano a string para la comparación
    const statusValue = statusFilter.value === 'active' ? true : false
    filtered = filtered.filter((item) => item.Status === statusValue)
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

// Ver detalles del producto (por implementar)
const viewProductDetail = async (productId: string) => {
  // Por implementar
  console.log('Ver detalles del producto:', productId)
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
        selectedItems.value,
      )

      // Mostrar notificación de éxito
      notificationMessage.value = result.message
      notificationType.value = result.success ? 'success' : 'warning'
      showNotification.value = true

      // Recargar la lista de productos
      await loadProductIds()

      // Limpiar selección
      selectedItems.value = []
    } catch (err) {
      console.error('Error al eliminar publicaciones seleccionadas:', err)
      notificationMessage.value = 'Error al eliminar las publicaciones seleccionadas'
      notificationType.value = 'error'
      showNotification.value = true
    } finally {
      loading.value = false
    }
  }
  showConfirmDialog.value = true
}

// Abrir producto en nueva pestaña
const openProductInNewTab = (productId: string) => {
  // Insertar un guion después de los primeros 3 caracteres (MCO-1233526781)
  const formattedId = productId.slice(0, 3) + '-' + productId.slice(3)
  window.open(`https://articulo.mercadolibre.com.co/${formattedId}`, '_blank')
}

// Formatear fecha
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString()
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

// Limpiar todos los filtros
const clearAllFilters = () => {
  statusFilter.value = ''
  syncActiveFilter.value = ''
  catalogActiveFilter.value = ''
  page.value = 1
  loadProductIds()
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
</style>
