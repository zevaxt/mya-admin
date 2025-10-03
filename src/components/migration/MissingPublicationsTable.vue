<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import { compareService } from '@/services/compareService'
import { migrationService } from '@/services/migrationService'
import { populateProduct } from '@/services/publicationOperations'

// Props
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['update:loading', 'error'])

// Estado
const accountStore = useAccountStore()
const missingPublicationIds = ref<string[]>([])
const total = ref(0)
const error = ref<string | null>(null)
const syncLoading = ref(false)
const page = ref(1)
const itemsPerPage = ref(100)

// Opciones para items por página
const itemsPerPageOptions = [10, 25, 50, 100, 250, 500, 1000]

// Variables reactivas para búsqueda y otros elementos
const searchQuery = ref('')
const selectedItems = ref<string[]>([])

// Filtros
const statusFilter = ref('')
const isDefaultStatusFilter = ref(true)
const channelsFilter = ref('marketplace,mshops')
const isDefaultChannelsFilter = ref(true)

const statusOptions = [
  { title: 'Todas', value: '' },
  { title: 'Activas', value: 'active' },
  { title: 'Pausadas', value: 'paused' },
  { title: 'Inactivas', value: 'inactive' },
  { title: 'Finalizadas', value: 'closed' },
  { title: 'Eliminado', value: 'deleted' },
  { title: 'En revisión', value: 'under_review' },
]

const channelsOptions = [
  { title: 'Todas', value: 'marketplace,mshops' },
  { title: 'Marketplace', value: 'marketplace' },
  { title: 'Tienda', value: 'mshops' },
]

// Computed properties
const currentAccount = computed(() => accountStore.currentAccount)
const accountId = computed(() => currentAccount.value?.ID || 0)
const hasAccount = computed(() => !!currentAccount.value)

const hasActiveFilters = computed(() => {
  return !isDefaultStatusFilter.value || !isDefaultChannelsFilter.value || searchQuery.value !== ''
})

// Función para manejar la búsqueda
const handleSearchInputChange = () => {
  // Implementación para la búsqueda, puedes ajustar según sea necesario
  page.value = 1
}

// Función para limpiar el campo de búsqueda
const clearSearchField = () => {
  searchQuery.value = ''
}

// Función para obtener etiqueta de estado
const getStatusLabel = (value: string): string => {
  const option = statusOptions.find((opt) => opt.value === value)
  return option ? option.title : 'Todas'
}

// Función para obtener etiqueta de canal
const getChannelsLabel = (value: string): string => {
  const option = channelsOptions.find((opt) => opt.value === value)
  return option ? option.title : 'Todas'
}

// Función para limpiar todos los filtros
const clearAllFilters = () => {
  statusFilter.value = ''
  isDefaultStatusFilter.value = true
  channelsFilter.value = 'marketplace,mshops'
  isDefaultChannelsFilter.value = true
  searchQuery.value = ''
  loadMissingPublications()
}

// Nombre de la cuenta formateado
const accountName = computed(
  () =>
    currentAccount.value?.Nickname || currentAccount.value?.Email || `Cuenta #${accountId.value}`,
)

// Función para obtener el color según el estado
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'success'
    case 'paused':
      return 'warning'
    case 'inactive':
      return 'error'
    case 'closed':
      return 'grey-darken-1'
    default:
      return 'primary'
  }
}

// Cabeceras de tabla para publicaciones faltantes
const missingPublicationsHeaders = [
  { title: '', key: 'select', sortable: false },
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false },
]

// Cargar publicaciones faltantes
const loadMissingPublications = async () => {
  if (!hasAccount.value) {
    error.value = 'Selecciona una cuenta para ver las publicaciones faltantes'
    emit('error', error.value)
    return
  }

  emit('update:loading', true)
  error.value = null

  try {
    // Configurar opciones de filtrado
    const channels = channelsFilter.value

    const options = {
      status: statusFilter.value,
      channels: channels as 'marketplace' | 'marketplace,mshops' | 'mshops',
    }

    const response = await compareService.getMissingPublications(accountId.value, options)
    missingPublicationIds.value = response.missing_publication_ids || []
    total.value = response.total || 0
    error.value = null // Limpiar error previo si la solicitud fue exitosa
  } catch (err) {
    console.error('Error al cargar publicaciones faltantes:', err)
    missingPublicationIds.value = []
    total.value = 0

    // Extraer el mensaje de error detallado
    let errorMsg = 'Error al cargar publicaciones faltantes'

    if (err instanceof Error) {
      // Verificar si es un error de API con respuesta
      if ('response' in err && err.response) {
        // Definir una interfaz para el error de Axios
        interface AxiosErrorResponse {
          data?: { message?: string }
          status?: number
        }

        const axiosError = err as { response: AxiosErrorResponse }
        if (axiosError.response.data?.message) {
          errorMsg = `Error en v1/provider/publications/compare: ${axiosError.response.data.message}`
        } else if (axiosError.response.status) {
          errorMsg = `Error en v1/provider/publications/compare: Código ${axiosError.response.status}`
        }
      } else {
        // Error estándar de JavaScript
        errorMsg = `Error al cargar publicaciones faltantes: ${err.message}`
      }
    }

    error.value = errorMsg
    emit('error', error.value)

    // Mostrar el error en una notificación
    notificationMessage.value = errorMsg
    notificationType.value = 'error'
    showNotification.value = true
  } finally {
    emit('update:loading', false)
  }
}

// Manejar cambio de página
const handlePageChange = () => {
  loadMissingPublications()
}

const handleStatusFilterChange = () => {
  isDefaultStatusFilter.value = statusFilter.value === 'active'
  loadMissingPublications()
}

const handleChannelsFilterChange = () => {
  isDefaultChannelsFilter.value = channelsFilter.value === 'marketplace'
  loadMissingPublications()
}

const resetChannelsFilter = () => {
  channelsFilter.value = 'marketplace'
  isDefaultChannelsFilter.value = true
  loadMissingPublications()
}

const resetStatusFilter = () => {
  statusFilter.value = 'active'
  isDefaultStatusFilter.value = true
  loadMissingPublications()
}

// Importar la función compartida
import { openInMercadoLibre } from '@/utils/mercadoLibreUtils'

// Alias para mantener compatibilidad con el código existente
const openProductInNewTab = openInMercadoLibre

// Estado para el diálogo de notificación
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'warning'>('success')
const processingId = ref<string | null>(null)
const processingMultiple = ref<boolean>(false)

// Estado para el diálogo de confirmación
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogAction = ref<() => Promise<void>>(() => Promise.resolve())

// Estado para el diálogo de IDs
const showIdsDialog = ref(false)
const syncedPublicationIds = ref<string[]>([])

// Sincronizar IDs de productos desde Mercado Libre
const syncProductIds = async (readOnly: boolean = false) => {
  if (!hasAccount.value) {
    notificationMessage.value = 'Selecciona una cuenta para sincronizar las publicaciones'
    notificationType.value = 'error'
    showNotification.value = true
    return
  }

  syncLoading.value = true
  notificationMessage.value = ''
  notificationType.value = 'success'

  try {
    // Llamar al servicio para sincronizar los IDs
    const result = await compareService.syncProductIds(
      accountId.value,
      statusFilter.value,
      channelsFilter.value,
      readOnly, // Usar el modo de solo lectura según el parámetro
    )

    if (readOnly) {
      // En modo solo lectura, mostramos los IDs en un diálogo
      if (Array.isArray(result)) {
        syncedPublicationIds.value = result
        showIdsDialog.value = true
      } else if (
        typeof result === 'object' &&
        result !== null &&
        Array.isArray(result.publication_ids)
      ) {
        syncedPublicationIds.value = result.publication_ids
        showIdsDialog.value = true
      } else {
        notificationMessage.value =
          'No se encontraron publicaciones para sincronizar o el formato de respuesta es inesperado'
        notificationType.value = 'warning'
        showNotification.value = true
      }
    } else {
      // Modo normal (guardar en BD)
      // Verificar que result sea un objeto y no un array
      if (
        typeof result === 'object' &&
        result !== null &&
        !Array.isArray(result) &&
        result.success
      ) {
        notificationMessage.value = result.message || 'Sincronización de IDs iniciada correctamente'
        notificationType.value = 'success'
        showNotification.value = true

        // Recargar la lista de publicaciones faltantes después de sincronizar
        await loadMissingPublications()
      } else {
        notificationMessage.value = 'La sincronización se completó pero con un resultado inesperado'
        notificationType.value = 'warning'
        showNotification.value = true
      }
    }
  } catch (err) {
    console.error('Error al sincronizar IDs de productos:', err)
    if (err instanceof Error) {
      notificationMessage.value = `Error al sincronizar IDs de productos: ${err.message}`
    } else {
      notificationMessage.value = 'Error al sincronizar IDs de productos'
    }
    notificationType.value = 'error'
    showNotification.value = true
    emit('error', notificationMessage.value)
  } finally {
    syncLoading.value = false
  }
}

// Crear publicación
const createPublication = async (productId: string) => {
  if (!hasAccount.value) return

  try {
    processingId.value = productId
    emit('update:loading', true)

    // Llamar al servicio para crear la publicación
    const result = await migrationService.createPublication(accountId.value, productId)

    if (result && result.length > 0 && result.includes(productId)) {
      notificationMessage.value = 'Publicación creada correctamente'
      notificationType.value = 'success'

      // Recargar la lista de publicaciones faltantes
      await loadMissingPublications()
    } else {
      notificationMessage.value = 'Error al crear la publicación'
      notificationType.value = 'error'
    }
  } catch (err) {
    console.error(`Error al crear la publicación ${productId}:`, err)
    notificationMessage.value = 'Error al crear la publicación'
    notificationType.value = 'error'
    emit('error', notificationMessage.value)
  } finally {
    showNotification.value = true
    processingId.value = null
    emit('update:loading', false)
  }
}

// Crear y popular publicación
const createAndPopulatePublication = async (productId: string) => {
  if (!hasAccount.value) return

  try {
    processingId.value = productId
    emit('update:loading', true)

    // Paso 1: Crear la publicación
    const createResult = await migrationService.createPublication(accountId.value, productId)

    if (createResult && createResult.length > 0 && createResult.includes(productId)) {
      // Paso 2: Popular la publicación
      const populateResult = await populateProduct(accountId.value, productId)

      if (populateResult.success) {
        notificationMessage.value = 'Publicación creada y populada correctamente'
        notificationType.value = 'success'
      } else {
        notificationMessage.value = 'Publicación creada pero hubo un error al popularla'
        notificationType.value = 'warning'
      }

      // Recargar la lista de publicaciones faltantes
      await loadMissingPublications()
    } else {
      notificationMessage.value = 'Error al crear la publicación'
      notificationType.value = 'error'
    }
  } catch (err) {
    console.error(`Error al crear y popular la publicación ${productId}:`, err)
    notificationMessage.value = 'Error al crear y popular la publicación'
    notificationType.value = 'error'
    emit('error', notificationMessage.value)
  } finally {
    showNotification.value = true
    processingId.value = null
    emit('update:loading', false)
  }
}

// Inicialización
onMounted(() => {
  if (hasAccount.value) {
    loadMissingPublications()
  }
})

// Observar cambios en la cuenta seleccionada
watch(
  () => accountId.value,
  (newAccountId) => {
    if (newAccountId) {
      loadMissingPublications()
    } else {
      missingPublicationIds.value = []
      total.value = 0
    }
  },
)

// Confirmar sincronización en modo normal (guardar en BD)
const confirmSyncNormalMode = () => {
  // Preparar mensaje con información de filtros
  const estadoFiltro = statusFilter.value ? `"${statusFilter.value}"` : 'todos'
  const canalesFiltro = channelsFilter.value

  // Mostrar diálogo de confirmación
  confirmDialogTitle.value = 'Sincronizar IDs en modo normal'
  confirmDialogMessage.value = `\u00bfEst\u00e1s seguro de que deseas sincronizar los IDs y guardarlos en la base de datos?\n\nFiltros que se aplicar\u00e1n:\n- Status: ${estadoFiltro}\n- Canales de venta: ${canalesFiltro}\n\nEsta acci\u00f3n puede tardar varios minutos dependiendo de la cantidad de publicaciones.`
  confirmDialogAction.value = () => syncProductIds(false)
  showConfirmDialog.value = true
}

// Confirmar creación de publicaciones seleccionadas
const createSelectedPublications = () => {
  if (selectedItems.value.length === 0) return

  // Mostrar diálogo de confirmación
  confirmDialogTitle.value = 'Crear publicaciones seleccionadas'
  confirmDialogMessage.value = `¿Estás seguro de que deseas crear las ${selectedItems.value.length} publicaciones seleccionadas?`
  confirmDialogAction.value = () => createMultiplePublications(false)
  showConfirmDialog.value = true
}

// Confirmar creación y populación de publicaciones seleccionadas
const createAndPopulateSelectedPublications = () => {
  if (selectedItems.value.length === 0) return

  // Mostrar diálogo de confirmación
  confirmDialogTitle.value = 'Crear y popular publicaciones seleccionadas'
  confirmDialogMessage.value = `¿Estás seguro de que deseas crear y popular las ${selectedItems.value.length} publicaciones seleccionadas? Este proceso puede tardar varios minutos.`
  confirmDialogAction.value = () => createMultiplePublications(true)
  showConfirmDialog.value = true
}

// Crear múltiples publicaciones
const createMultiplePublications = async (populateAfterCreate: boolean = false) => {
  if (!hasAccount.value || selectedItems.value.length === 0) return

  try {
    processingMultiple.value = true
    emit('update:loading', true)

    // Crear un array para almacenar los resultados
    const results: { id: string; success: boolean; populated?: boolean; message?: string }[] = []
    let successCount = 0
    let errorCount = 0
    let populateSuccessCount = 0
    let populateErrorCount = 0

    // Procesar cada publicación seleccionada
    for (const productId of selectedItems.value) {
      try {
        // Paso 1: Llamar al servicio para crear la publicación
        const result = await migrationService.createPublication(accountId.value, productId)

        if (result && result.length > 0 && result.includes(productId)) {
          // Publicación creada con éxito
          successCount++

          // Paso 2 (opcional): Popular la publicación si se solicitó
          if (populateAfterCreate) {
            try {
              const populateResult = await populateProduct(accountId.value, productId)

              if (populateResult.success) {
                results.push({ id: productId, success: true, populated: true })
                populateSuccessCount++
              } else {
                results.push({
                  id: productId,
                  success: true,
                  populated: false,
                  message: 'Creada pero error al popular',
                })
                populateErrorCount++
              }
            } catch (populateErr) {
              console.error(`Error al popular la publicación ${productId}:`, populateErr)
              results.push({
                id: productId,
                success: true,
                populated: false,
                message: 'Creada pero error al popular',
              })
              populateErrorCount++
            }
          } else {
            // Sin populación, solo registrar éxito en la creación
            results.push({ id: productId, success: true })
          }
        } else {
          // Error al crear la publicación
          results.push({ id: productId, success: false, message: 'Respuesta inesperada' })
          errorCount++
        }
      } catch (err) {
        console.error(`Error al crear la publicación ${productId}:`, err)
        let errorMsg = 'Error desconocido'
        if (err instanceof Error) {
          errorMsg = err.message
        }
        results.push({ id: productId, success: false, message: errorMsg })
        errorCount++
      }
    }

    // Mostrar notificación con el resultado
    if (populateAfterCreate) {
      // Mensaje para creación + populación
      if (errorCount === 0 && populateErrorCount === 0) {
        notificationMessage.value = `Se han creado y populado ${successCount} publicaciones correctamente`
        notificationType.value = 'success'
      } else if (successCount === 0) {
        notificationMessage.value = `Error al crear las ${errorCount} publicaciones seleccionadas`
        notificationType.value = 'error'
      } else if (populateErrorCount > 0) {
        notificationMessage.value = `Creadas ${successCount} publicaciones. Populadas con éxito: ${populateSuccessCount}. Errores al popular: ${populateErrorCount}. Errores al crear: ${errorCount}.`
        notificationType.value = 'warning'
      } else {
        notificationMessage.value = `Creadas ${successCount} publicaciones. Fallaron ${errorCount} publicaciones.`
        notificationType.value = 'warning'
      }
    } else {
      // Mensaje para solo creación
      if (errorCount === 0) {
        notificationMessage.value = `Se han creado ${successCount} publicaciones correctamente`
        notificationType.value = 'success'
      } else if (successCount === 0) {
        notificationMessage.value = `Error al crear las ${errorCount} publicaciones seleccionadas`
        notificationType.value = 'error'
      } else {
        notificationMessage.value = `Creadas ${successCount} publicaciones. Fallaron ${errorCount} publicaciones.`
        notificationType.value = 'warning'
      }
    }

    // Recargar la lista de publicaciones faltantes
    await loadMissingPublications()

    // Limpiar selección
    selectedItems.value = []
  } catch (err) {
    console.error('Error al crear publicaciones seleccionadas:', err)
    notificationMessage.value = 'Error al crear las publicaciones seleccionadas'
    notificationType.value = 'error'
  } finally {
    showNotification.value = true
    processingMultiple.value = false
    emit('update:loading', false)
  }
}

// Copiar IDs al portapapeles
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(syncedPublicationIds.value.join('\n'))
    notificationMessage.value = 'IDs copiadas al portapapeles'
    notificationType.value = 'success'
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err)
    notificationMessage.value = 'Error al copiar al portapapeles'
    notificationType.value = 'error'
  } finally {
    showNotification.value = true
  }
}

// Exponer funciones para el componente padre
defineExpose({
  loadMissingPublications,
})
</script>

<template>
  <div>
    <!-- Título y botones -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 text-info font-weight-medium mb-1">Publicaciones Faltantes</h3>
        <p class="text-caption text-grey">
          Publicaciones que existen en Mercado Libre pero no en la base de datos
        </p>
      </div>
      <div class="d-flex gap-2">
        <v-menu>
          <template v-slot:activator="{ props: menuProps }">
            <v-tooltip location="top">
              <template v-slot:activator="{ props: tooltipProps }">
                <v-btn
                  color="success"
                  variant="outlined"
                  :loading="syncLoading"
                  size="small"
                  v-bind="{ ...menuProps, ...tooltipProps }"
                >
                  <v-icon start>mdi-sync</v-icon>
                  Sincronizar IDs
                  <v-icon end>mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <span>Sincroniza las publicaciones de Mercado Libre con la base de datos</span>
            </v-tooltip>
          </template>
          <v-list density="compact">
            <v-list-item @click="confirmSyncNormalMode">
              <v-list-item-title>Modo normal (guardar en BD)</v-list-item-title>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item @click="syncProductIds(true)">
              <v-list-item-title>Modo solo lectura (ver IDs)</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-btn
          color="info"
          variant="outlined"
          @click="loadMissingPublications"
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
          @keyup.enter="loadMissingPublications"
        ></v-text-field>
      </div>

      <!-- Pills de filtros -->
      <div class="filter-pills-container d-flex flex-wrap align-center gap-0">
        <!-- Filtro de estado -->
        <v-menu location="bottom" offset-y :close-on-content-click="false">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              :color="!isDefaultStatusFilter ? getStatusColor(statusFilter) : 'grey-lighten-3'"
              :variant="!isDefaultStatusFilter ? 'elevated' : 'flat'"
              :prepend-icon="!isDefaultStatusFilter ? 'mdi-check-circle' : 'mdi-filter-variant'"
              class="filter-pill-IZQUIERDA"
              label
            >
              <span class="text-body-2"> Estado: {{ getStatusLabel(statusFilter) }} </span>
            </v-chip>
          </template>

          <v-card min-width="280" max-width="320" class="filter-menu pa-2">
            <v-card-title class="text-subtitle-2 pa-2">Estado de publicaciones</v-card-title>
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
                  :color="getStatusColor(option.value)"
                  density="compact"
                ></v-radio>
              </v-radio-group>
            </v-card-text>
            <v-card-actions class="pa-2 pt-0">
              <v-spacer></v-spacer>
              <v-btn variant="text" color="primary" size="small" @click="resetStatusFilter">
                Restablecer
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Filtro de canales -->
        <v-menu location="bottom" offset-y :close-on-content-click="false">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              :color="!isDefaultChannelsFilter ? 'primary' : 'grey-lighten-3'"
              :variant="!isDefaultChannelsFilter ? 'elevated' : 'flat'"
              :prepend-icon="!isDefaultChannelsFilter ? 'mdi-check-circle' : 'mdi-store'"
              class="filter-pill"
              label
            >
              <span class="text-body-2"> Canal: {{ getChannelsLabel(channelsFilter) }} </span>
            </v-chip>
          </template>

          <v-card min-width="280" max-width="320" class="filter-menu pa-2">
            <v-card-title class="text-subtitle-2 pa-2">Canales de venta</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-2">
              <v-radio-group
                v-model="channelsFilter"
                @update:model-value="handleChannelsFilterChange"
                hide-details
                density="compact"
              >
                <v-radio
                  v-for="option in channelsOptions"
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
              <v-btn variant="text" color="primary" size="small" @click="resetChannelsFilter">
                Restablecer
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Chip de resultados -->
        <v-chip
          v-if="total > 0"
          :color="hasActiveFilters ? 'info-lighten-4' : 'grey-lighten-4'"
          variant="flat"
          :prepend-icon="hasActiveFilters ? 'mdi-filter' : 'mdi-information'"
          class="filter-pill ms-auto"
          label
        >
          <span class="text-body-2">{{ total }} publicaciones faltantes</span>
        </v-chip>

        <!-- Botón limpiar filtros -->
        <v-btn
          v-if="hasActiveFilters"
          color="grey-darken-1"
          variant="text"
          size="small"
          @click="clearAllFilters"
          class="filter-clear-btn"
          density="comfortable"
        >
          <v-icon start size="small">mdi-filter-remove</v-icon>
          Limpiar filtros
        </v-btn>
      </div>
    </div>

    <!-- Mensaje de error -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      title="Error al cargar publicaciones faltantes"
      :text="error"
      @click:close="error = null"
    >
      <template v-slot:append>
        <v-btn color="error" variant="text" size="small" @click="loadMissingPublications">
          <v-icon start>mdi-refresh</v-icon>
          Reintentar
        </v-btn>
      </template>
    </v-alert>

    <div class="position-relative">
      <v-data-table
        v-model="selectedItems"
        show-select
        :headers="missingPublicationsHeaders"
        :items="
          Array.isArray(missingPublicationIds) && missingPublicationIds.length > 0
            ? missingPublicationIds.map((id) => ({
                id,
                account: accountName,
              }))
            : []
        "
        :loading="loading"
        :items-per-page="itemsPerPage"
        class="elevation-1 rounded-lg"
        :no-data-text="
          hasAccount
            ? 'No hay publicaciones faltantes'
            : 'Selecciona una cuenta para ver las publicaciones faltantes'
        "
        item-value="id"
      >
        <!-- Columna de ID -->
        <template #[`item.id`]="{ item }">
          <div class="d-flex align-center">
            <span class="text-truncate">{{ item.id }}</span>
          </div>
        </template>

        <!-- Columna de acciones -->
        <template #[`item.actions`]="{ item }">
          <div class="d-flex">
            <v-menu>
              <template v-slot:activator="{ props: menuProps }">
                <v-btn
                  icon
                  size="small"
                  color="success"
                  class="mr-2"
                  :disabled="loading || processingId === item.id"
                  :loading="processingId === item.id"
                  v-bind="menuProps"
                >
                  <v-icon v-if="processingId !== item.id">mdi-plus-circle</v-icon>
                  <v-tooltip activator="parent" location="top">Crear publicación</v-tooltip>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item @click="createPublication(item.id)">
                  <v-list-item-title>Crear</v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item @click="createAndPopulatePublication(item.id)">
                  <v-list-item-title>Crear y popular</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>

            <v-btn icon size="small" color="info" @click="openProductInNewTab(item.id)">
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
            <v-menu>
              <template v-slot:activator="{ props: menuProps }">
                <v-btn
                  color="success"
                  variant="outlined"
                  size="small"
                  :disabled="selectedItems.length === 0"
                  class="me-4"
                  v-bind="menuProps"
                >
                  <v-icon start>mdi-plus-circle</v-icon>
                  Crear {{ selectedItems.length }} seleccionadas
                  <v-icon end>mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item @click="createSelectedPublications">
                  <v-list-item-title>Crear</v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item @click="createAndPopulateSelectedPublications">
                  <v-list-item-title>Crear y popular</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
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
              @update:model-value="loadMissingPublications"
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
        <v-card-title class="text-subtitle-1 pa-4 pb-0">{{ confirmDialogTitle }}</v-card-title>
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

    <!-- Diálogo para mostrar los IDs sincronizados en modo lectura -->
    <v-dialog v-model="showIdsDialog" max-width="700" content-class="elevation-0">
      <v-card class="rounded-lg" elevation="3">
        <v-card-title class="text-subtitle-1 pa-4 pb-0">
          <v-icon class="mr-2" color="info" size="small">mdi-information-outline</v-icon>
          IDs de publicaciones encontradas
        </v-card-title>
        <v-card-text class="pa-4">
          <p class="text-caption text-medium-emphasis mb-2">Modo solo lectura</p>
          <v-textarea
            v-model="syncIds"
            readonly
            rows="10"
            auto-grow
            hide-details
            density="compact"
            variant="outlined"
            bg-color="grey-lighten-5"
          ></v-textarea>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn
            color="info"
            variant="text"
            size="small"
            @click="copyToClipboard"
            :loading="copyingToClipboard"
            :disabled="copyingToClipboard"
          >
            <v-icon start size="small">mdi-content-copy</v-icon>
            Copiar
          </v-btn>
          <v-btn color="grey-darken-1" variant="text" size="small" @click="showIdsDialog = false"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.text-truncate {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.v-data-table {
  border: 1px solid rgba(0, 0, 0, 0.05);
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

/* Estilos para los filtros modernos */
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
  border-radius: 0px !important; /* REDONDEO DE FILTROS */
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
  border-radius: 0px !important; /* REDONDEO DE FILTROS */
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
</style>
