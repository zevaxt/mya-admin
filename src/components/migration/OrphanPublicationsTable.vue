<template>
  <div>
    <!-- Título y botones -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 text-warning font-weight-medium mb-1">Publicaciones Huérfanas</h3>
        <p class="text-caption text-grey">
          Publicaciones que no están sincronizadas y no están activas en el catálogo
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
            @update:model-value="loadOrphanPublications"
            :color="statusFilter !== 'all' ? 'primary' : undefined"
            :bg-color="statusFilter !== 'all' ? 'primary-lighten-5' : undefined"
          >
            <template v-slot:append-inner>
              <v-icon
                v-if="statusFilter !== 'all'"
                color="primary"
                @click.stop="() => { statusFilter = 'all'; loadOrphanPublications(); }"
              >
                mdi-close
              </v-icon>
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="soldQuantityFilter"
            :items="soldQuantityOptions"
            item-title="title"
            item-value="value"
            label="Filtrar por ventas"
            variant="outlined"
            density="comfortable"
            @update:model-value="loadOrphanPublications"
            :color="soldQuantityFilter !== 'all' ? 'primary' : undefined"
            :bg-color="soldQuantityFilter !== 'all' ? 'primary-lighten-5' : undefined"
          >
            <template v-slot:append-inner>
              <v-icon
                v-if="soldQuantityFilter !== 'all'"
                color="primary"
                @click.stop="() => { soldQuantityFilter = 'all'; loadOrphanPublications(); }"
              >
                mdi-close
              </v-icon>
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="6" class="d-flex justify-end align-center gap-2">
          <v-btn
            v-if="statusFilter !== 'all' || soldQuantityFilter !== 'all'"
            color="secondary"
            variant="outlined"
            @click="clearFilters"
            class="mr-2"
            size="small"
          >
            <v-icon start>mdi-filter-remove</v-icon>
            Limpiar filtros
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <!-- Contador de resultados -->
    <div v-if="total > 0" class="mb-2">
      <v-chip color="warning" size="small" variant="outlined">
        <v-icon start size="small">mdi-information</v-icon>
        {{ total }} publicaciones huérfanas encontradas
      </v-chip>
    </div>

    <div class="position-relative">
      <v-data-table
        v-model="selectedItems"
        :headers="orphanPublicationsHeaders"
        :items="
          Array.isArray(orphanPublicationIds) && orphanPublicationIds.length > 0
            ? orphanPublicationIds.map((id) => ({
                id,
                account: accountName,
                status: getStatusFromFilter(),
                sales: getSalesFromFilter(),
              }))
            : []
        "
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

        <!-- Columna de Cuenta -->
        <template #[`item.account`]="{ item }">
          <div class="d-flex align-center">
            <span>{{ item.account }}</span>
          </div>
        </template>

        <!-- Columna de Estado -->
        <template #[`item.status`]="{ item }">
          <v-chip
            :color="item.status === true ? 'success' : 'error'"
            size="small"
            variant="outlined"
          >
            <v-icon start size="small">
              {{ item.status === true ? 'mdi-check-circle' : 'mdi-close-circle' }}
            </v-icon>
            {{ item.status === true ? 'Activa' : 'Inactiva' }}
          </v-chip>
        </template>

        <!-- Columna de Ventas -->
        <template #[`item.sales`]="{ item }">
          <v-chip
            :color="item.sales === true ? 'success' : 'grey'"
            size="small"
            variant="outlined"
          >
            <v-icon start size="small">
              {{ item.sales === true ? 'mdi-cart' : 'mdi-cart-off' }}
            </v-icon>
            {{ item.sales === true ? 'Con ventas' : 'Sin ventas' }}
          </v-chip>
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
              @update:model-value="loadOrphanPublications"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import { compareService, type OrphanPublicationsOptions } from '@/services/compareService'
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
const orphanPublicationIds = ref<string[]>([])
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
const itemsPerPageOptions = [10, 50, 100, 300, 500, 1000]

// Filtros
const statusFilter = ref<boolean | 'all'>('all')
const soldQuantityFilter = ref<boolean | 'all'>('all')

// Opciones para los filtros
const statusOptions = [
  { title: 'Todos los estados', value: 'all' },
  { title: 'Activas', value: true },
  { title: 'Inactivas', value: false },
]

const soldQuantityOptions = [
  { title: 'Todas las ventas', value: 'all' },
  { title: 'Con ventas', value: true },
  { title: 'Sin ventas', value: false },
]

// Función para limpiar todos los filtros
const clearFilters = () => {
  statusFilter.value = 'all'
  soldQuantityFilter.value = 'all'
  loadOrphanPublications()
}

// Cabeceras de tabla
const orphanPublicationsHeaders = [
  { title: '', key: 'select', sortable: false },
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Cuenta', key: 'account', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Ventas', key: 'sales', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false },
]

// Funciones para obtener el estado y las ventas según los filtros aplicados
const getStatusFromFilter = () => {
  if (statusFilter.value === true) return true
  if (statusFilter.value === false) return false
  // Si es 'all', asignamos un valor aleatorio para demostración
  // En un caso real, esto vendría de la API
  return Math.random() > 0.5
}

const getSalesFromFilter = () => {
  if (soldQuantityFilter.value === true) return true
  if (soldQuantityFilter.value === false) return false
  // Si es 'all', asignamos un valor aleatorio para demostración
  return Math.random() > 0.5
}

// Computed properties
const currentAccount = computed(() => accountStore.currentAccount)
const accountId = computed(() => currentAccount.value?.ID || 0)
const accountName = computed(
  () =>
    currentAccount.value?.Nickname || currentAccount.value?.Email || `Cuenta #${accountId.value}`,
)
const hasAccount = computed(() => !!currentAccount.value)

// Cargar publicaciones huérfanas
const loadOrphanPublications = async () => {
  if (!hasAccount.value) {
    error.value = 'Selecciona una cuenta para ver las publicaciones huérfanas'
    emit('error', error.value)
    return
  }

  emit('update:loading', true)
  error.value = null

  try {
    // Configurar opciones de paginación y filtros
    const options: OrphanPublicationsOptions = {
      offset: (page.value - 1) * itemsPerPage.value,
      limit: itemsPerPage.value,
      status: statusFilter.value as boolean | 'all',
      withSoldQuantity: soldQuantityFilter.value as boolean | 'all',
    }

    const response = await compareService.getOrphanPublications(accountId.value, options)
    orphanPublicationIds.value = response.publication_ids || []
    total.value = response.count || 0
  } catch (err) {
    console.error('Error al cargar publicaciones huérfanas:', err)
    if (err instanceof Error) {
      error.value = `Error al cargar publicaciones huérfanas: ${err.message}`
    } else {
      error.value = 'Error al cargar publicaciones huérfanas'
    }
    emit('error', error.value)
  } finally {
    emit('update:loading', false)
  }
}

// Manejar cambio de página
const handlePageChange = () => {
  loadOrphanPublications()
}

// Abrir publicación en Mercado Libre
const openProductInNewTab = (productId: string) => {
  // Insertar un guion después de los primeros 3 caracteres (MCO-1233526781)
  const formattedId = productId.slice(0, 3) + '-' + productId.slice(3)
  window.open(`https://articulo.mercadolibre.com.co/${formattedId}`, '_blank')
}

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
    loadOrphanPublications()
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

.filter-select {
  width: 200px;
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
