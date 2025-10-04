<template>
  <div>
    <!-- Título y botones -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 text-primary font-weight-medium mb-1">Publicaciones Huérfanas</h3>

        <p class="text-caption text-grey">
          Publicaciones que tiene sincronizaciones asociadas, (Es decir no estan como una
          publicacion Saliente o Entrantes de sincronizacion)
        </p>
      </div>
      <div class="d-flex gap-2">
        <v-btn
          color="warning"
          variant="outlined"
          @click="loadOrphanPublications"
          :loading="loading"
          size="small"
        >
          <v-icon start>mdi-refresh</v-icon>
          Refrescar
        </v-btn>
      </div>
    </div>

    <!-- Filtros modernos tipo pills -->
    <div class="filter-bar mb-4">
      <!-- Barra de búsqueda principal -->
      <div class="search-container mb-3">
        <v-text-field
          v-model="searchQuery"
          variant="outlined"
          density="compact"
          hide-details
          placeholder="Buscar ID..."
          class="search-field modern-search"
          prepend-inner-icon="mdi-magnify"
          clearable
          rounded
          bg-color="grey-lighten-4"
          @update:model-value="handleSearchInputChange"
          @click:clear="clearSearchField"
          @keyup.enter="handleSearchSubmit"
        ></v-text-field>
      </div>

      <!-- Pills de filtros -->
      <div class="filter-pills-container d-flex flex-wrap align-center gap-2">
        <!-- Filtro de estado -->
        <v-menu location="bottom" offset-y :close-on-content-click="false">
          <template #activator="{ props }">
            <v-tooltip
              location="top"
              text="Al elegir la opción Activas, se listan únicamente las publicaciones cuyo estado interno quedó marcado como activo durante el proceso de populate, siempre que su estado fuera active en Mercado Libre y pertenezcan al canal Marketplace."
            >
              <template #activator="{ tooltipProps }">
                <v-chip
                  v-bind="{ ...props, ...tooltipProps }"
                  :color="!isDefaultStatusFilter ? 'primary' : 'grey-lighten-3'"
                  :variant="!isDefaultStatusFilter ? 'elevated' : 'flat'"
                  :prepend-icon="!isDefaultStatusFilter ? 'mdi-check-circle' : 'mdi-filter-variant'"
                  class="filter-pill-IZQUIERDA"
                  label
                >
                  <span class="text-body-2"> Estado: {{ getStatusLabel(statusFilter) }} </span>
                </v-chip>
              </template>
            </v-tooltip>
          </template>

          <v-card min-width="280" max-width="320" class="filter-menu pa-2">
            <v-card-title class="text-subtitle-2 pa-2">Filtrar por estado</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-2">
              <v-radio-group
                v-model="statusFilter"
                @update:model-value="handleStatusFilterChange"
                hide-details
                density="compact"
              >
                <v-radio
                  v-for="option in statusOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.title"
                  color="primary"
                  density="compact"
                ></v-radio>
              </v-radio-group>
            </v-card-text>
            <v-card-actions class="pa-2 pt-0">
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                color="primary"
                size="small"
                @click="
                  () => {
                    resetStatusFilter()
                  }
                "
              >
                Restablecer
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Filtro de Ventas -->
        <v-menu location="bottom" offset-y :close-on-content-click="false">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              :color="soldQuantityFilter !== 'all' ? 'primary' : 'grey-lighten-3'"
              :variant="soldQuantityFilter !== 'all' ? 'elevated' : 'flat'"
              :prepend-icon="soldQuantityFilter !== 'all' ? 'mdi-check-circle' : 'mdi-cart'"
              class="filter-pill"
              label
            >
              <span class="text-body-2">
                Ventas: {{ getSoldQuantityLabel(soldQuantityFilter) }}
              </span>
            </v-chip>
          </template>

          <v-card min-width="280" max-width="320" class="filter-menu pa-2">
            <v-card-title class="text-subtitle-2 pa-2">Filtrar por ventas</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-2">
              <v-radio-group
                v-model="soldQuantityFilter"
                @update:model-value="loadOrphanPublications"
                hide-details
                density="compact"
              >
                <v-radio
                  v-for="option in soldQuantityOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.title"
                  color="primary"
                  density="compact"
                ></v-radio>
              </v-radio-group>
            </v-card-text>
            <v-card-actions class="pa-2 pt-0">
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                color="primary"
                size="small"
                @click="
                  () => {
                    soldQuantityFilter = 'all'
                    loadOrphanPublications()
                  }
                "
              >
                Restablecer
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Filtro de Catálogo -->
        <v-menu location="bottom" offset-y :close-on-content-click="false">
          <template #activator="{ props }">
            <v-tooltip
              location="top"
              text="Selecciona 'De catálogo' para mostrar solo publicaciones que están en el catálogo de Mercado Libre, o 'Estándar' para las publicaciones normales"
            >
              <template #activator="{ tooltipProps }">
                <v-chip
                  v-bind="{ ...props, ...tooltipProps }"
                  :color="catalogActiveFilter !== 'all' ? 'primary' : 'grey-lighten-3'"
                  :variant="catalogActiveFilter !== 'all' ? 'elevated' : 'flat'"
                  :prepend-icon="
                    catalogActiveFilter !== 'all' ? 'mdi-check-circle' : 'mdi-book-open-variant'
                  "
                  class="filter-pill"
                  label
                >
                  <span class="text-body-2">
                    Tipo: {{ getCatalogLabel(catalogActiveFilter) }}
                  </span>
                </v-chip>
              </template>
            </v-tooltip>
          </template>

          <v-card min-width="280" max-width="320" class="filter-menu pa-2">
            <v-card-title class="text-subtitle-2 pa-2">Tipo de publicación</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-2">
              <v-radio-group
                v-model="catalogActiveFilter"
                @update:model-value="loadOrphanPublications"
                hide-details
                density="compact"
              >
                <v-radio
                  v-for="option in catalogActiveOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.title"
                  color="primary"
                  density="compact"
                ></v-radio>
              </v-radio-group>
            </v-card-text>
            <v-card-actions class="pa-2 pt-0">
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                color="primary"
                size="small"
                @click="
                  () => {
                    catalogActiveFilter = 'all'
                    loadOrphanPublications({ forceReload: true })
                  }
                "
              >
                Restablecer
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Filtro de Sincronizaciones -->
        <v-menu location="bottom" offset-y :close-on-content-click="false">
          <template #activator="{ props }">
            <v-tooltip
              location="top"
              text="Selecciona el tipo de sincronización que falta: 'Salientes' para publicaciones que no tienen sincronizaciones salientes, 'Entrantes' para las que no tienen sincronizaciones entrantes, o 'Todas' para las que no tienen ninguna sincronización"
            >
              <template #activator="{ tooltipProps }">
                <v-chip
                  v-bind="{ ...props, ...tooltipProps }"
                  :color="relationQueryTypeFilter !== 'incoming' ? 'primary' : 'grey-lighten-3'"
                  :variant="relationQueryTypeFilter !== 'incoming' ? 'elevated' : 'flat'"
                  :prepend-icon="
                    relationQueryTypeFilter !== 'incoming' ? 'mdi-check-circle' : 'mdi-sync-off'
                  "
                  class="filter-pill"
                  label
                >
                  <span class="text-body-2">
                    No Tiene: {{ getRelationLabel(relationQueryTypeFilter) }}
                  </span>
                </v-chip>
              </template>
            </v-tooltip>
          </template>

          <v-card min-width="280" max-width="320" class="filter-menu pa-2">
            <v-card-title class="text-subtitle-2 pa-2">No Tiene Sincronizaciones</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-2">
              <v-radio-group
                v-model="relationQueryTypeFilter"
                @update:model-value="loadOrphanPublications"
                hide-details
                density="compact"
              >
                <v-radio
                  v-for="option in relationQueryTypeOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.title"
                  color="primary"
                  density="compact"
                ></v-radio>
              </v-radio-group>
            </v-card-text>
            <v-card-actions class="pa-2 pt-0">
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                color="primary"
                size="small"
                @click="
                  () => {
                    relationQueryTypeFilter = 'incoming'
                    loadOrphanPublications({ forceReload: true })
                  }
                "
              >
                Restablecer
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Chip de resultados -->
        <v-chip
          v-if="total > 0"
          :color="
            !isDefaultStatusFilter ||
            soldQuantityFilter !== 'all' ||
            catalogActiveFilter !== 'all' ||
            relationQueryTypeFilter !== 'incoming'
              ? 'info-lighten-4'
              : 'grey-lighten-4'
          "
          variant="flat"
          :prepend-icon="
            !isDefaultStatusFilter ||
            soldQuantityFilter !== 'all' ||
            catalogActiveFilter !== 'all' ||
            relationQueryTypeFilter !== 'incoming'
              ? 'mdi-filter'
              : 'mdi-information'
          "
          class="filter-pill ct-right ms-auto"
          label
        >
          <span class="text-body-2">{{ total }} publicaciones huérfanas encontradas</span>
        </v-chip>

        <!-- Botón limpiar filtros -->
        <v-btn
          v-if="
            !isDefaultStatusFilter ||
            soldQuantityFilter !== 'all' ||
            catalogActiveFilter !== 'all' ||
            relationQueryTypeFilter !== 'incoming'
          "
          color="grey-darken-1"
          variant="text"
          size="small"
          @click="clearFilters"
          class="filter-clear-btn ms-auto"
          density="comfortable"
        >
          <v-icon start size="small">mdi-filter-remove</v-icon>
          Limpiar filtros
        </v-btn>
      </div>
    </div>

    <div class="position-relative">
      <v-data-table-virtual
        :height="tableHeight"
        :item-height="virtualRowHeight"
        :bench="virtualScrollBench"
        v-model="selectedItems"
        :headers="orphanPublicationsHeaders"
        :items="tableItems"
        :loading="loading"
        :items-per-page="itemsPerPage"
        class="elevation-1 rounded-lg"
        :no-data-text="
          hasAccount
            ? 'No hay publicaciones huérfanas'
            : 'Selecciona una cuenta para ver las publicaciones huérfanas'
        "
        show-select
        item-value="id"
      >
        <!-- Columna de ID -->
        <template #[`item.id`]="{ item }">
          <div class="d-flex align-center">
            <span class="text-truncate">{{ item.id }}</span>
          </div>
        </template>

        <!-- Columna de Acciones -->
        <template #[`item.actions`]="{ item }">
          <div class="text-left">
            <v-menu location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon
                  size="small"
                  color="grey-darken-1"
                  variant="text"
                  v-bind="props"
                  :disabled="loading"
                >
                  <v-icon>mdi-menu</v-icon>
                </v-btn>
              </template>

              <v-list density="compact">
                <!-- Ver detalles -->
                <v-list-item @click="viewProductDetail(item.id)" :disabled="loading">
                  <template v-slot:prepend>
                    <v-icon color="primary" size="small">mdi-eye</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">Ver detalles</v-list-item-title>
                </v-list-item>

                <!-- Eliminar publicación -->
                <v-list-item
                  @click="confirmDeleteProduct(item.id)"
                  :disabled="loading || processingDeleteId === item.id"
                >
                  <template v-slot:prepend>
                    <v-icon color="error" size="small" v-if="processingDeleteId !== item.id"
                      >mdi-delete</v-icon
                    >
                    <v-progress-circular
                      v-else
                      indeterminate
                      size="16"
                      color="error"
                      class="mr-2"
                    ></v-progress-circular>
                  </template>
                  <v-list-item-title class="text-body-2">Eliminar publicación</v-list-item-title>
                </v-list-item>

                <!-- Ver en Mercado Libre -->
                <v-list-item @click="openProductInNewTab(item.id)">
                  <template v-slot:prepend>
                    <v-icon color="info" size="small">mdi-open-in-new</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">Ver en Mercado Libre</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>

        <!-- No usamos el slot bottom para poder tener un paginador fijo -->
        <template #bottom> </template>
      </v-data-table-virtual>

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
                total > 0
                  ? `${(page - 1) * itemsPerPage + 1}-${Math.min(page * itemsPerPage, total)} de ${total}`
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
            :length="Math.ceil(total / itemsPerPage) || 1"
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

    <!-- Notificación de éxito o error -->
    <v-snackbar v-model="showNotification" :color="notificationType" :timeout="3000" location="top">
      {{ notificationMessage }}
      <template v-slot:actions>
        <v-btn variant="text" icon="mdi-close" @click="showNotification = false"></v-btn>
      </template>
    </v-snackbar>

    <!-- Diálogo de confirmación -->
    <v-dialog v-model="showConfirmDialog" max-width="450" content-class="elevation-0">
      <v-card class="rounded-lg" elevation="3">
        <v-card-title class="text-subtitle-1 pa-4 pb-0">
          {{ confirmDialogTitle }}
        </v-card-title>

        <v-card-text class="pa-4">
          <p class="text-body-2 text-medium-emphasis">{{ confirmDialogMessage }}</p>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            size="small"
            @click="showConfirmDialog = false"
            >Cancelar</v-btn
          >
          <v-btn
            color="primary"
            variant="text"
            size="small"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import router from '@/router'
import { compareService, type OrphanPublicationsOptions } from '@/services/compareService'
import migrationService from '@/services/migrationService'

// Props
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

// Configuración de virtual scroll
const tableHeight = 500 // Altura fija para el contenedor de la tabla
const virtualRowHeight = 56 // Altura estándar de una fila (density: comfortable) 56
const virtualScrollBench = 20 // Número de filas adicionales a renderizar fuera de la vista (buffer)

// Emits
const emit = defineEmits(['update:loading', 'error'])

// Estado
const accountStore = useAccountStore()
const orphanPublicationIds = ref<string[]>([])
const allOrphanPublicationIds = ref<string[]>([])
const total = ref(0)
const error = ref<string | null>(null)
const page = ref(1)
const itemsPerPage = ref(100)
const processingDeleteId = ref<string | null>(null)
const selectedItems = ref<string[]>([])
const selectedItemsOrder = ref<string[]>([])
const hasLoadedOrphanPublications = ref(false)

// Estado para el diálogo de notificación
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'warning'>('success')

// Estado para el diálogo de confirmación
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogAction = ref<() => Promise<void>>(() => Promise.resolve())

// Opciones para items por página
const itemsPerPageOptions = [10, 25, 50, 100, 250, 500, 1000]

// Filtros
const statusFilter = ref<boolean | 'all'>(true)
const isDefaultStatusFilter = ref(true)
const soldQuantityFilter = ref<boolean | 'all'>('all')
const catalogActiveFilter = ref<boolean | 'all'>('all')
const relationQueryTypeFilter = ref<'outgoing' | 'incoming' | 'both'>('incoming') // Valor predeterminado: publicaciones que no tienen sincronizaciones salientes

// Opciones para los filtros
const statusOptions = [
  { title: 'Todas', value: 'all' },
  { title: 'Activas', value: true },
  { title: 'Inactivas', value: false },
]

const soldQuantityOptions = [
  { title: 'Todas', value: 'all' },
  { title: 'Con ventas', value: true },
  { title: 'Sin ventas', value: false },
]

const catalogActiveOptions = [
  { title: 'Todas', value: 'all' },
  { title: 'De catálogo', value: true },
  { title: 'Estándar', value: false },
]

const relationQueryTypeOptions = [
  { title: 'Salientes', value: 'incoming' }, // Publicaciones que no tienen sincronizaciones salientes
  { title: 'Entrantes', value: 'outgoing' }, // Publicaciones que no tienen sincronizaciones entrantes
  { title: 'Todas', value: 'both' }, // Publicaciones que no tienen ningún tipo de sincronización
]

// Función para limpiar todos los filtros
const clearFilters = () => {
  statusFilter.value = true
  isDefaultStatusFilter.value = true
  soldQuantityFilter.value = 'all'
  catalogActiveFilter.value = 'all'
  relationQueryTypeFilter.value = 'incoming' // Restablecer a 'Salientes'
  loadOrphanPublications({ forceReload: true })
}

// Cabeceras de tabla
const orphanPublicationsHeaders = [
  { title: '', key: 'select', sortable: false },
  { title: 'ID', key: 'id', sortable: true },
  { title: '', key: 'actions', sortable: false },
]

// Funciones para obtener el estado y las ventas eliminadas
// Ya no son necesarias

// Computed properties
const currentAccount = computed(() => accountStore.currentAccount)
const accountId = computed(() => currentAccount.value?.ID || 0)
const hasAccount = computed(() => !!currentAccount.value)

// Cargar publicaciones huérfanas
const loadOrphanPublications = async (options: { forceReload?: boolean } = {}) => {
  const { forceReload = false } = options

  if (!hasAccount.value) {
    error.value = 'Selecciona una cuenta para ver las publicaciones huérfanas'
    emit('error', error.value)

    // Mostrar notificación cuando no hay cuenta seleccionada
    showNotification.value = true
    notificationMessage.value = 'Selecciona una cuenta para ver las publicaciones huérfanas'
    notificationType.value = 'warning'
    return
  }

  emit('update:loading', true)
  error.value = null

  try {
    // Configurar opciones de paginación y filtros
    const options: OrphanPublicationsOptions = {
      status: statusFilter.value, // 'all' para todas, true para activas, false para inactivas
      withSoldQuantity: soldQuantityFilter.value,
      catalogActive: catalogActiveFilter.value, // Filtro para publicaciones de catálogo
      relationQueryType: relationQueryTypeFilter.value, // Tipo de relación a consultar
    }

    if (forceReload || !hasLoadedOrphanPublications.value) {
      const response = await compareService.getOrphanPublications(accountId.value, options)
      allOrphanPublicationIds.value = response.publication_ids || []
      hasLoadedOrphanPublications.value = true
    }

    page.value = 1
    applyLocalFilters()
  } catch (err) {
    console.error('Error al cargar publicaciones huérfanas:', err)

    // Extraer mensaje de error más detallado
    let errorMessage = 'Error al cargar publicaciones huérfanas'

    if (err instanceof Error) {
      errorMessage = `Error al cargar publicaciones huérfanas: ${err.message}`
    } else if (typeof err === 'object' && err !== null && 'response' in err) {
      // Error de Axios
      const axiosError = err as { response?: { status?: number; data?: any } }
      if (axiosError.response?.status === 502) {
        errorMessage = 'El servidor no está disponible (Error 502). Por favor, intenta más tarde.'
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message
      } else if (axiosError.response?.data?.Message) {
        errorMessage = axiosError.response.data.Message
      }
    }

    error.value = errorMessage
    emit('error', error.value)

    // Mostrar notificación de error
    showNotification.value = true
    notificationMessage.value = errorMessage
    notificationType.value = 'error'
  } finally {
    emit('update:loading', false)
  }
}

const filterSelectedItems = (selectedIds: unknown[]): string[] => {
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
    return []
  }

  const allowedIds = new Set(allOrphanPublicationIds.value)
  return selectedIds.filter((id): id is string => typeof id === 'string' && allowedIds.has(id))
}

const applyLocalFilters = () => {
  if (!hasLoadedOrphanPublications.value) {
    orphanPublicationIds.value = []
    total.value = 0
    return
  }

  let filtered = [...allOrphanPublicationIds.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((id) => id.toLowerCase().includes(query))
  }

  const selectedSet = new Set(selectedItems.value)
  selectedSet.forEach((id) => {
    if (!filtered.includes(id) && allOrphanPublicationIds.value.includes(id)) {
      filtered.unshift(id)
    }
  })

  const totalItems = filtered.length
  total.value = totalItems

  if (totalItems === 0) {
    page.value = 1
    orphanPublicationIds.value = []
    selectedItems.value = filterSelectedItems(selectedItems.value)
    return
  }

  const maxPage = Math.max(1, Math.ceil(totalItems / itemsPerPage.value) || 1)
  if (page.value > maxPage) {
    page.value = maxPage
  } else if (page.value < 1) {
    page.value = 1
  }

  const offset = (page.value - 1) * itemsPerPage.value
  const paginated = filtered.slice(offset, offset + itemsPerPage.value)
  orphanPublicationIds.value = paginated
  selectedItems.value = filterSelectedItems(selectedItems.value)
}

const handlePageChange = (value: number) => {
  page.value = value
  applyLocalFilters()
}

const handleItemsPerPageChange = (value: number) => {
  itemsPerPage.value = Number(value)
  page.value = 1
  applyLocalFilters()
}

const handleStatusFilterChange = () => {
  isDefaultStatusFilter.value = statusFilter.value === true
  loadOrphanPublications({ forceReload: true })
}

const resetStatusFilter = () => {
  statusFilter.value = true
  isDefaultStatusFilter.value = true
  loadOrphanPublications({ forceReload: true })
}

// Ver detalles del producto
const viewProductDetail = (productId: string) => {
  // Abrir en una nueva pestaña
  const route = router.resolve(`/product-detail/${productId}`)
  window.open(route.href, '_blank')
}

// Importar la función compartida
import { openInMercadoLibre } from '@/utils/mercadoLibreUtils'

// Alias para mantener compatibilidad con el código existente
const openProductInNewTab = openInMercadoLibre

// Confirmar eliminación de una publicación
const confirmDeleteProduct = (productId: string) => {
  confirmDialogTitle.value = 'Confirmar eliminación'
  confirmDialogMessage.value = `¿Estás seguro de que deseas eliminar la publicación huérfana ${productId}? Esta acción no se puede deshacer.`
  confirmDialogAction.value = () => deleteProduct(productId)
  showConfirmDialog.value = true
}

// Eliminar una publicación
const deleteProduct = async (productId: string) => {
  if (!hasAccount.value) {
    error.value = 'Selecciona una cuenta para eliminar la publicación'
    return
  }

  try {
    processingDeleteId.value = productId

    // Llamar al servicio para eliminar la publicación
    const result = await migrationService.deleteProduct(accountId.value, productId)

    if (result && result.success) {
      notificationMessage.value = result.message
      notificationType.value = 'success'

      // Recargar la lista de publicaciones para actualizar la vista
      await loadOrphanPublications()
    } else {
      notificationMessage.value = 'Respuesta inesperada al eliminar la publicación'
      notificationType.value = 'error'
    }
  } catch (err) {
    console.error(`Error al eliminar la publicación ${productId}:`, err)
    if (err instanceof Error) {
      notificationMessage.value = `Error al eliminar la publicación: ${err.message}`
    } else {
      notificationMessage.value = 'Error al eliminar la publicación'
    }
    notificationType.value = 'error'
  } finally {
    showNotification.value = true
    processingDeleteId.value = null
  }
}

// Eliminar los elementos seleccionados
const deleteSelectedItems = async () => {
  if (selectedItems.value.length === 0) return

  // Mostrar diálogo de confirmación
  confirmDialogTitle.value = 'Eliminar publicaciones huérfanas seleccionadas'
  confirmDialogMessage.value = `¿Estás seguro de que deseas eliminar las ${selectedItems.value.length} publicaciones huérfanas seleccionadas?`
  confirmDialogAction.value = async () => {
    try {
      // Mostrar loading
      emit('update:loading', true)

      // Llamar al servicio para eliminar los productos seleccionados
      const result = await migrationService.deleteMultipleProducts(
        accountId.value,
        selectedItems.value,
      )

      // Mostrar notificación de éxito
      notificationMessage.value = result.message
      notificationType.value = result.success ? 'success' : 'warning'
      showNotification.value = true

      // Recargar la lista de publicaciones
      await loadOrphanPublications()

      // Limpiar selección
      selectedItems.value = []
    } catch (err) {
      console.error('Error al eliminar publicaciones seleccionadas:', err)
      notificationMessage.value = 'Error al eliminar las publicaciones seleccionadas'
      notificationType.value = 'error'
      showNotification.value = true
    } finally {
      emit('update:loading', false)
    }
  }
  showConfirmDialog.value = true
}

// Observar cambios en la cuenta seleccionada
watch(
  () => accountId.value,
  (newAccountId) => {
    if (newAccountId) {
      loadOrphanPublications()
    } else {
      orphanPublicationIds.value = []
      total.value = 0
    }
  },
)

// Cargar datos al montar el componente
onMounted(() => {
  if (hasAccount.value) {
    loadOrphanPublications({ forceReload: true })
  }
})

// Agregar las funciones auxiliares para las etiquetas de los filtros
const searchQuery = ref('')

// Función para manejar el cambio en el campo de búsqueda
const handleSearchInputChange = () => {
  if (!hasLoadedOrphanPublications.value) {
    return
  }

  page.value = 1
  applyLocalFilters()
}

const handleSearchSubmit = () => {
  if (!hasLoadedOrphanPublications.value) {
    return
  }

  page.value = 1
  applyLocalFilters()
}

// Función para limpiar el campo de búsqueda
const clearSearchField = () => {
  if (!hasLoadedOrphanPublications.value) {
    searchQuery.value = ''
    return
  }

  searchQuery.value = ''
  page.value = 1
  applyLocalFilters()
}

// Funciones auxiliares para las etiquetas de los filtros
const getStatusLabel = (value: boolean | string): string => {
  if (value === true) return 'Activas'
  if (value === false) return 'Inactivas'
  return 'Todas'
}

const getSoldQuantityLabel = (value: string): string => {
  const option = soldQuantityOptions.find((opt) => opt.value === value)
  return option ? option.title : value
}

const getCatalogLabel = (value: string): string => {
  const option = catalogActiveOptions.find((opt) => opt.value === value)
  return option ? option.title : value
}

const getRelationLabel = (value: string): string => {
  const option = relationQueryTypeOptions.find((opt) => opt.value === value)
  return option ? option.title : value
}
</script>

<style scoped>
.filter-bar {
  margin-bottom: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #f9fafb 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-container {
  max-width: 100%;
}

.modern-search {
  max-width: 100%;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
}

.modern-search :deep(.v-field__input) {
  min-height: 44px;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  line-height: 40px;
}

.modern-search :deep(.v-field__prepend-inner) {
  padding-top: 10px;
  color: rgba(0, 0, 0, 0.5);
}

.filter-pills-container {
  padding: 4px 0;
  gap: 0px !important; /* SEPARACION FILTROS*/
}

.filter-pill {
  font-family: 'Poppins', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  min-height: 44px !important;
  height: 44px !important;
  min-width: 160px;
  padding: 0 16px !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border-radius: 0px !important;
}

.filter-pill {
  font-family: 'Poppins', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  min-height: 44px !important;
  height: 44px !important;
  min-width: 160px;
  padding: 0 16px !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border-radius: 0px !important;
}

.ct-right {
  border-top-right-radius: 15px !important;
  border-bottom-right-radius: 15px !important;
}

.filter-pill-IZQUIERDA {
  font-family: 'Poppins', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  min-height: 44px !important;
  height: 44px !important;
  min-width: 160px;
  padding: 0 16px !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border-radius: 0px !important;
  border-start-start-radius: 15px !important;
  border-bottom-left-radius: 15px !important;
}

.filter-pill:hover,
.filter-pill-IZQUIERDA:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.filter-pill :deep(.v-chip__content),
.filter-pill-IZQUIERDA :deep(.v-chip__content) {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-menu {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.filter-clear-btn {
  font-family: 'Poppins', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  min-height: 44px !important;
  height: 44px !important;
  padding: 0 20px !important;
  border-radius: 8px !important;
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

.items-per-page-select {
  width: 100px;
}
</style>
