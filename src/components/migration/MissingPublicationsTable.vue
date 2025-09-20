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

// Cabeceras de tabla para publicaciones faltantes
const missingPublicationsHeaders = [
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
    <v-data-table
      :headers="missingPublicationsHeaders"
      :items="missingPublicationIds.map(id => ({ id }))"
      :loading="loading"
      :items-per-page="100"
      class="elevation-1"
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
</style>
