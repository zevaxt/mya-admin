<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import { compareService } from '@/services/compareService'
import { migrationService } from '@/services/migrationService'

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
const itemsPerPageOptions = [10, 50, 100, 300, 500, 1000]

// Filtros
const statusFilter = ref<'active' | 'paused' | 'inactive' | ''>('')
const channelsFilter = ref<'marketplace' | 'marketplace,mshops'>('marketplace')

// Opciones para los filtros
const statusOptions = [
  { title: 'Todas', value: '' },
  { title: 'Activas', value: 'active' },
  { title: 'Pausadas', value: 'paused' },
  { title: 'Inactivas', value: 'inactive' },
]

const channelsOptions = [
  { title: 'Marketplace', value: 'marketplace' },
  { title: 'Marketplace y Tiendas', value: 'marketplace,mshops' },
]

// Computed properties
const currentAccount = computed(() => accountStore.currentAccount)
const accountId = computed(() => currentAccount.value?.ID || 0)
const hasAccount = computed(() => !!currentAccount.value)

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
    default:
      return 'primary'
  }
}

// Cabeceras de tabla para publicaciones faltantes
const missingPublicationsHeaders = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Cuenta', key: 'account', sortable: true },
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
    const options = {
      status: statusFilter.value,
      channels: channelsFilter.value,
      offset: (page.value - 1) * itemsPerPage.value,
      limit: itemsPerPage.value
    }

    const response = await compareService.getMissingPublications(accountId.value, options)
    missingPublicationIds.value = response.missing_publication_ids || []
    total.value = response.total || 0
  } catch (err) {
    console.error('Error al cargar publicaciones faltantes:', err)
    if (err instanceof Error) {
      error.value = `Error al cargar publicaciones faltantes: ${err.message}`
    } else {
      error.value = 'Error al cargar publicaciones faltantes'
    }
    emit('error', error.value)
  } finally {
    emit('update:loading', false)
  }
}

// Manejar cambio de página
const handlePageChange = () => {
  loadMissingPublications()
}

// Abrir publicación en Mercado Libre
const openProductInNewTab = (productId: string) => {
  // Insertar un guion después de los primeros 3 caracteres (MCO-1233526781)
  const formattedId = productId.slice(0, 3) + '-' + productId.slice(3)
  window.open(`https://articulo.mercadolibre.com.co/${formattedId}`, '_blank')
}

// Estado para el diálogo de notificación
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'warning'>('success')
const processingId = ref<string | null>(null)

// Sincronizar IDs de productos desde Mercado Libre
const syncProductIds = async () => {
  if (!hasAccount.value) {
    notificationMessage.value = 'Selecciona una cuenta para sincronizar las publicaciones'
    notificationType.value = 'error'
    showNotification.value = true
    return
  }

  syncLoading.value = true
  error.value = null

  try {
    // Llamar al servicio para sincronizar IDs de productos
    const result = await migrationService.updateProductIds(
      accountId.value,
      statusFilter.value,
      channelsFilter.value,
      false // No es modo lectura, queremos almacenar los IDs
    )

    // Verificar que la respuesta sea válida
    if (result && result.success) {
      notificationMessage.value = result.message || 'Sincronización de IDs iniciada correctamente'
      notificationType.value = 'success'
    } else {
      notificationMessage.value = 'La sincronización se completó pero con un resultado inesperado'
      notificationType.value = 'warning'
    }

    showNotification.value = true

    // Recargar la lista de publicaciones faltantes después de sincronizar
    await loadMissingPublications()
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
  if (!hasAccount.value) {
    notificationMessage.value = 'Selecciona una cuenta para crear la publicación'
    notificationType.value = 'error'
    showNotification.value = true
    return
  }

  try {
    processingId.value = productId
    emit('update:loading', true)

    // Llamar al servicio para crear la publicación
    const result = await migrationService.createPublication(accountId.value, productId)

    // Verificar que la respuesta contiene el ID de la publicación creada
    if (result && result.length > 0 && result.includes(productId)) {
      notificationMessage.value = `Publicación ${productId} creada exitosamente`
      notificationType.value = 'success'

      // Recargar la lista de publicaciones faltantes para actualizar la vista
      await loadMissingPublications()
    } else {
      notificationMessage.value = `Respuesta inesperada al crear la publicación ${productId}`
      notificationType.value = 'error'
    }
  } catch (err) {
    console.error(`Error al crear la publicación ${productId}:`, err)
    if (err instanceof Error) {
      notificationMessage.value = `Error al crear la publicación: ${err.message}`
    } else {
      notificationMessage.value = 'Error al crear la publicación'
    }
    notificationType.value = 'error'
  } finally {
    emit('update:loading', false)
    showNotification.value = true
    processingId.value = null
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
  }
)

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
        <p class="text-caption text-grey">Publicaciones que existen en Mercado Libre pero no en la base de datos</p>
      </div>
      <div class="d-flex gap-2">
        <v-btn
          color="success"
          variant="outlined"
          @click="syncProductIds"
          :loading="syncLoading"
          size="small"
        >
          <v-icon start>mdi-sync</v-icon>
          Sincronizar IDs
          <v-tooltip activator="parent" location="top">
            Sincroniza todas las publicaciones de Mercado Libre con la base de datos
          </v-tooltip>
        </v-btn>
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
    
    <!-- Filtros -->
    <v-row class="mb-4">
      <v-col cols="12" md="4" lg="3">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          item-title="title"
          item-value="value"
          label="Estado de publicaciones"
          variant="outlined"
          density="comfortable"
          hide-details
          @update:model-value="loadMissingPublications"
          :color="statusFilter ? getStatusColor(statusFilter) : undefined"
          :bg-color="statusFilter ? `${getStatusColor(statusFilter)}-lighten-5` : undefined"
        >
          <template v-slot:append-inner>
            <v-icon v-if="statusFilter !== ''" :color="getStatusColor(statusFilter)" @click.stop="statusFilter = ''; loadMissingPublications()">mdi-close</v-icon>
          </template>
        </v-select>
      </v-col>

      <v-col cols="12" md="4" lg="3">
        <v-select
          v-model="channelsFilter"
          :items="channelsOptions"
          item-title="title"
          item-value="value"
          label="Canales de venta"
          variant="outlined"
          density="comfortable"
          hide-details
          @update:model-value="loadMissingPublications"
          :color="channelsFilter !== 'marketplace' ? 'primary' : undefined"
          :bg-color="channelsFilter !== 'marketplace' ? 'primary-lighten-5' : undefined"
        >
          <template v-slot:append-inner>
            <v-icon v-if="channelsFilter !== 'marketplace'" color="primary" @click.stop="channelsFilter = 'marketplace'; loadMissingPublications()">mdi-close</v-icon>
          </template>
        </v-select>
      </v-col>

    </v-row>

    <!-- Contador de resultados -->
    <div v-if="total > 0" class="mb-2">
      <v-chip color="info" size="small" variant="outlined">
        <v-icon start size="small">mdi-information</v-icon>
        {{ total }} publicaciones faltantes encontradas
      </v-chip>
    </div>

    <div class="position-relative">
      <v-data-table
        :headers="missingPublicationsHeaders"
        :items="Array.isArray(missingPublicationIds) && missingPublicationIds.length > 0 ? missingPublicationIds.map(id => ({
          id,
          account: accountName
        })) : []"
        :loading="loading"
        :items-per-page="itemsPerPage"
        class="elevation-1 rounded-lg"
        :no-data-text="
          hasAccount
            ? 'No hay publicaciones faltantes'
            : 'Selecciona una cuenta para ver las publicaciones faltantes'
        "
      >
      <!-- Columna de ID -->
      <template #[`item.id`]="{ item }">
        <div class="d-flex align-center">
          <span class="text-truncate">{{ item.id }}</span>
        </div>
      </template>

      <!-- Columna de Cuenta -->
      <template #[`item.account`]="{ item }">
        <div class="d-flex align-center">
          <v-chip size="small" color="primary" variant="outlined" class="text-truncate">
            {{ item.account }}
          </v-chip>
        </div>
      </template>

      <!-- Columna de acciones -->
      <template #[`item.actions`]="{ item }">
        <div class="d-flex">
          <v-btn
            icon
            size="small"
            color="success"
            class="mr-2"
            @click="createPublication(item.id)"
            :disabled="loading || processingId === item.id"
            :loading="processingId === item.id"
          >
            <v-icon v-if="processingId !== item.id">mdi-plus-circle</v-icon>
            <v-tooltip activator="parent" location="top">Crear publicación</v-tooltip>
          </v-btn>

          <v-btn icon size="small" color="info" @click="openProductInNewTab(item.id)">
            <v-icon>mdi-open-in-new</v-icon>
            <v-tooltip activator="parent" location="top">Ver en Mercado Libre</v-tooltip>
          </v-btn>
        </div>
      </template>

      <!-- No usamos el slot bottom para poder tener un paginador fijo -->
      <template #bottom>
      </template>
      </v-data-table>

      <!-- Paginador fijo -->
      <div class="pagination-fixed">
        <div class="d-flex align-center w-100 px-4 py-2 bg-white">
          <div class="text-caption text-grey me-4">
            {{ total > 0 ?
              `${(page - 1) * itemsPerPage + 1}-${Math.min(page * itemsPerPage, total)} de ${total}` :
              '0-0 de 0' }}
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
    <v-snackbar
      v-model="showNotification"
      :color="notificationType"
      :timeout="3000"
      location="top"
    >
      {{ notificationMessage }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="showNotification = false"
        ></v-btn>
      </template>
    </v-snackbar>
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
</style>
