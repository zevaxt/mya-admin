<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import { compareService } from '@/services/compareService'

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

// Computed properties
const currentAccount = computed(() => accountStore.currentAccount)
const accountId = computed(() => currentAccount.value?.ID || 0)
const hasAccount = computed(() => !!currentAccount.value)

// Nombre de la cuenta formateado
const accountName = computed(() => {
  if (!currentAccount.value) return 'N/A'
  return currentAccount.value.Nickname || currentAccount.value.Email || `Cuenta #${accountId.value}`
})

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
    const response = await compareService.getMissingPublications(accountId.value)
    missingPublicationIds.value = response.missing_publication_ids
    total.value = response.total
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

// Abrir publicación en Mercado Libre
const openProductInNewTab = (productId: string) => {
  // Insertar un guion después de los primeros 3 caracteres (MCO-1233526781)
  const formattedId = productId.slice(0, 3) + '-' + productId.slice(3)
  window.open(`https://articulo.mercadolibre.com.co/${formattedId}`, '_blank')
}

// Crear publicación
const createPublication = (productId: string) => {
  // Aquí se implementaría la lógica para crear la publicación
  // Por ahora solo mostramos un mensaje en la consola
  console.log(`Crear publicación para el ID: ${productId}`)
  alert(`Funcionalidad para crear publicación ${productId} en desarrollo`)
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
    <!-- Header con información y botón de actualizar -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 text-primary font-weight-medium mb-1">Publicaciones Faltantes</h3>
        <p class="text-caption text-grey">Publicaciones que existen en Mercado Libre pero no en la base de datos</p>
      </div>
      <v-btn 
        color="primary" 
        variant="outlined" 
        @click="loadMissingPublications"
        :loading="loading"
        size="small"
      >
        <v-icon start>mdi-refresh</v-icon>
        Actualizar
      </v-btn>
    </div>
    
    <!-- Contador de resultados -->
    <div v-if="total > 0" class="mb-2">
      <v-chip color="info" size="small" variant="outlined">
        <v-icon start size="small">mdi-information</v-icon>
        {{ total }} publicaciones faltantes encontradas
      </v-chip>
    </div>
    
    <v-data-table
      :headers="missingPublicationsHeaders"
      :items="missingPublicationIds.map(id => ({ 
        id, 
        account: accountName 
      }))"
      :loading="loading"
      :items-per-page="100"
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
            :disabled="loading"
          >
            <v-icon>mdi-plus-circle</v-icon>
            <v-tooltip activator="parent" location="top">Crear publicación</v-tooltip>
          </v-btn>

          <v-btn icon size="small" color="info" @click="openProductInNewTab(item.id)">
            <v-icon>mdi-open-in-new</v-icon>
            <v-tooltip activator="parent" location="top">Ver en Mercado Libre</v-tooltip>
          </v-btn>
        </div>
      </template>
    </v-data-table>
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
</style>
