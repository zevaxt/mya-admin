<template>
  <div>
    <!-- Botón de actualización -->
    <div class="mb-4">
      <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="loadOrphanPublications"
      >
        Actualizar
      </v-btn>
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
        :headers="orphanPublicationsHeaders"
        :items="
          Array.isArray(orphanPublicationIds) && orphanPublicationIds.length > 0
            ? orphanPublicationIds.map((id) => ({
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
          <div class="text-caption text-grey me-4">
            {{
              total > 0
                ? `${(page - 1) * itemsPerPage + 1}-${Math.min(page * itemsPerPage, total)} de ${total}`
                : '0-0 de 0'
            }}
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
const orphanPublicationIds = ref<string[]>([])
const total = ref(0)
const error = ref<string | null>(null)
const page = ref(1)
const itemsPerPage = ref(100)
const processingDeleteId = ref<string | null>(null)

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

// No se utilizan filtros

// Cabeceras de tabla
const orphanPublicationsHeaders = [
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

// Cargar publicaciones huérfanas
const loadOrphanPublications = async () => {
  if (!hasAccount.value) {
    error.value = 'Selecciona una cuenta para ver las publicaciones deprecadas'
    emit('error', error.value)
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

    const response = await compareService.getOrphanPublications(accountId.value, options)
    orphanPublicationIds.value = response.orphan_publication_ids || []
    total.value = response.total || 0
  } catch (err) {
    console.error('Error al cargar publicaciones deprecadas:', err)
    if (err instanceof Error) {
      error.value = `Error al cargar publicaciones deprecadas: ${err.message}`
    } else {
      error.value = 'Error al cargar publicaciones deprecadas'
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
