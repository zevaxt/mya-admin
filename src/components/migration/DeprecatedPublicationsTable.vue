<template>
  <div>
    <!-- Título y botones -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 text-error font-weight-medium mb-1">Publicaciones Deprecadas</h3>
        <p class="text-caption text-grey">
          Publicaciones que existen en la base de datos pero no en Mercado Libre
        </p>
      </div>
      <div class="d-flex gap-2">
        <v-btn
          color="error"
          variant="outlined"
          @click="loadDeprecatedPublications"
          :loading="loading"
          size="small"
        >
          <v-icon start>mdi-refresh</v-icon>
          Refrescar
        </v-btn>
      </div>
    </div>

    <!-- Contador de resultados -->
    <div v-if="total > 0" class="mb-2">
      <v-chip color="error" size="small" variant="outlined">
        <v-icon start size="small">mdi-information</v-icon>
        {{ total }} publicaciones deprecadas encontradas (No existen en Mercado Libre)
      </v-chip>
    </div>

    <div class="position-relative">
      <v-data-table
        v-model="selectedItems"
        :headers="deprecatedPublicationsHeaders"
        :items="
          Array.isArray(deprecatedPublicationIds) && deprecatedPublicationIds.length > 0
            ? deprecatedPublicationIds.map((id) => ({
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
            ? 'No hay publicaciones deprecadas'
            : 'Selecciona una cuenta para ver las publicaciones deprecadas'
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

        <!-- Columna de Cuenta -->
        <template #[`item.account`]="{ item }">
          <div class="d-flex align-center">
            <span>{{ item.account }}</span>
          </div>
        </template>

        <!-- Columna de Acciones -->
        <template #[`item.actions`]="{ item }">
          <div class="d-flex">
            <v-btn
              icon
              size="small"
              color="error"
              class="mr-2"
              @click="confirmDeleteProduct(item.id)"
              :disabled="loading || processingDeleteId === item.id"
              :loading="processingDeleteId === item.id"
            >
              <v-icon v-if="processingDeleteId !== item.id">mdi-delete</v-icon>
              <v-tooltip activator="parent" location="top">Eliminar publicación</v-tooltip>
            </v-btn>

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
              @update:model-value="loadDeprecatedPublications"
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
          <v-btn color="grey-darken-1" variant="text" size="small" @click="showConfirmDialog = false">Cancelar</v-btn>
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
import { compareService } from '@/services/compareService'
import migrationService from '@/services/migrationService'

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
const deprecatedPublicationIds = ref<string[]>([])
const total = ref(0)
const error = ref<string | null>(null)
const page = ref(1)
const itemsPerPage = ref(100)
const processingDeleteId = ref<string | null>(null)
const selectedItems = ref<string[]>([])

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

// No se utilizan filtros

// Cabeceras de tabla
const deprecatedPublicationsHeaders = [
  { title: '', key: 'select', sortable: false },
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Cuenta', key: 'account', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false },
]

// Computed properties
const currentAccount = computed(() => accountStore.currentAccount)
const accountId = computed(() => currentAccount.value?.ID || 0)
const accountName = computed(
  () =>
    currentAccount.value?.Nickname || currentAccount.value?.Email || `Cuenta #${accountId.value}`,
)
const hasAccount = computed(() => !!currentAccount.value)

// Cargar publicaciones deprecadas
const loadDeprecatedPublications = async () => {
  if (!hasAccount.value) {
    error.value = 'Selecciona una cuenta para ver las publicaciones deprecadas'
    emit('error', error.value)
    
    // Mostrar notificación cuando no hay cuenta seleccionada
    showNotification.value = true
    notificationMessage.value = 'Selecciona una cuenta para ver las publicaciones deprecadas'
    notificationType.value = 'warning'
    return
  }

  emit('update:loading', true)
  error.value = null

  try {
    // Configurar opciones de paginación
    const options = {
      offset: (page.value - 1) * itemsPerPage.value,
      limit: itemsPerPage.value,
    }

    const response = await compareService.getDeprecatedPublications(accountId.value, options)
    deprecatedPublicationIds.value = response.deprecated_publication_ids || []
    total.value = response.total || 0
  } catch (err) {
    console.error('Error al cargar publicaciones deprecadas:', err)
    
    // Extraer mensaje de error más detallado
    let errorMessage = 'Error al cargar publicaciones deprecadas'
    
    if (err instanceof Error) {
      errorMessage = `Error al cargar publicaciones deprecadas: ${err.message}`
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

// Manejar cambio de página
const handlePageChange = () => {
  loadDeprecatedPublications()
}

// Importar la función compartida
import { openInMercadoLibre } from '@/utils/mercadoLibreUtils'

// Alias para mantener compatibilidad con el código existente
const openProductInNewTab = openInMercadoLibre

// Confirmar eliminación de una publicación
const confirmDeleteProduct = (productId: string) => {
  confirmDialogTitle.value = 'Confirmar eliminación'
  confirmDialogMessage.value = `¿Estás seguro de que deseas eliminar la publicación ${productId}? Esta acción no se puede deshacer.`
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
      await loadDeprecatedPublications()
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
  confirmDialogTitle.value = 'Eliminar publicaciones seleccionadas'
  confirmDialogMessage.value = `¿Estás seguro de que deseas eliminar las ${selectedItems.value.length} publicaciones seleccionadas?`
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
      await loadDeprecatedPublications()

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
      loadDeprecatedPublications()
    } else {
      deprecatedPublicationIds.value = []
      total.value = 0
    }
  },
)

// Cargar datos al montar el componente
onMounted(() => {
  if (hasAccount.value) {
    loadDeprecatedPublications()
  }
})
</script>

<style scoped>
.filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
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
