<template>
  <div>
    <!-- Título y botones -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 text-primary font-weight-medium mb-1">
          Sincronizaciones de Publicaciones
        </h3>
        <p class="text-caption text-grey">
          Relaciones de sincronización entre publicaciones de diferentes cuentas
        </p>
      </div>
      <div class="d-flex gap-2">
        <v-btn
          color="primary"
          variant="outlined"
          @click="loadSyncRelations"
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
            v-model="syncStatusFilter"
            :items="syncStatusOptions"
            label="Estado de Sincronización"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="loadSyncRelations"
          >
            <template v-slot:prepend>
              <v-icon color="primary">mdi-sync</v-icon>
            </template>
            <template v-slot:append>
              <v-icon
                v-if="syncStatusFilter !== 'all'"
                color="primary"
                @click.stop="
                  () => {
                    syncStatusFilter = 'all'
                    loadSyncRelations()
                  }
                "
              >
                mdi-close
              </v-icon>
            </template>
          </v-select>
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="syncCountFilter"
            :items="syncCountOptions"
            label="Cantidad de Sincronizaciones"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="loadSyncRelations"
          >
            <template v-slot:prepend>
              <v-icon color="primary">mdi-counter</v-icon>
            </template>
            <template v-slot:append>
              <v-icon
                v-if="syncCountFilter !== 'all'"
                color="primary"
                @click.stop="
                  () => {
                    syncCountFilter = 'all'
                    loadSyncRelations()
                  }
                "
              >
                mdi-close
              </v-icon>
            </template>
          </v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="searchQuery"
            label="Buscar por ID de publicación"
            variant="outlined"
            density="compact"
            hide-details
            append-inner-icon="mdi-magnify"
            @update:model-value="loadSyncRelations"
            @click:append-inner="loadSyncRelations"
          ></v-text-field>
        </v-col>
      </v-row>
    </div>

    <!-- Estadísticas -->
    <div class="mb-4">
      <v-card variant="outlined">
        <v-card-text class="d-flex justify-space-around">
          <div class="text-center">
            <div class="text-h6">{{ totalPublications }}</div>
            <div class="text-caption">Total Publicaciones</div>
          </div>
          <div class="text-center">
            <div class="text-h6">{{ originCount }}</div>
            <div class="text-caption">Origen</div>
          </div>
          <div class="text-center">
            <div class="text-h6">{{ destinationCount }}</div>
            <div class="text-caption">Destino</div>
          </div>
          <div class="text-center">
            <div class="text-h6">{{ bothCount }}</div>
            <div class="text-caption">Ambos</div>
          </div>
          <div class="text-center">
            <div class="text-h6">{{ noneCount }}</div>
            <div class="text-caption">Ninguno</div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Tabla de publicaciones -->
    <v-card variant="outlined">
      <v-data-table
        v-model:expanded="expanded"
        :headers="headers"
        :items="filteredPublications"
        :loading="loading"
        :items-per-page="10"
        :items-per-page-options="[10, 25, 50, 100]"
        density="compact"
        hover
        item-value="publication_id"
        class="elevation-0"
        show-expand
      >
        <template #no-data>
          <div class="text-center py-4">
            <v-icon size="large" color="grey">mdi-database-off</v-icon>
            <div class="text-subtitle-1 mt-2">No se encontraron publicaciones</div>
            <div class="text-caption text-grey">
              Intenta cambiar los filtros o recargar la página
            </div>
          </div>
        </template>

        <!-- Columna de ID de Publicación -->
        <template #[`item.publication_id`]="slotProps">
          <div class="d-flex align-center">
            <span>{{ slotProps.item.publication_id }}</span>
          </div>
        </template>

        <!-- Columna de Sincronizaciones Salientes -->
        <template #[`item.outgoing_syncs`]="slotProps">
          <div class="d-flex align-center">
            <!-- Cuando hay exactamente una sincronización, mostrar el ID directamente -->
            <div v-if="slotProps.item.to_syncs.length === 1" class="d-flex align-center">
              <v-chip color="primary" size="small" variant="outlined" class="mr-2"> 1 </v-chip>
              <div class="d-flex align-center">
                <span class="text-caption text-truncate" style="max-width: 180px">
                  {{ slotProps.item.to_syncs[0].to_sync_id }}
                </span>
              </div>
            </div>

            <!-- Cuando hay múltiples o ninguna sincronización -->
            <div v-else>
              <v-chip
                :color="slotProps.item.to_syncs.length > 0 ? 'primary' : 'grey'"
                size="small"
                variant="outlined"
                class="mr-2"
              >
                {{ slotProps.item.to_syncs.length }}
              </v-chip>
              <v-tooltip v-if="slotProps.item.to_syncs.length > 0" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="x-small"
                    icon
                    variant="text"
                    color="primary"
                    @click.stop="expanded = [slotProps.item.publication_id]"
                  >
                    <v-icon size="small">mdi-eye</v-icon>
                  </v-btn>
                </template>
                <span>Ver sincronizaciones salientes</span>
              </v-tooltip>
            </div>
          </div>
        </template>

        <!-- Columna de Sincronizaciones Entrantes -->
        <template #[`item.incoming_syncs`]="slotProps">
          <div class="d-flex align-center">
            <!-- Cuando hay exactamente una sincronización, mostrar el ID directamente -->
            <div v-if="slotProps.item.from_syncs.length === 1" class="d-flex align-center">
              <v-chip color="success" size="small" variant="outlined" class="mr-2"> 1 </v-chip>
              <div class="d-flex align-center">
                <span class="text-caption text-truncate" style="max-width: 180px">
                  {{ slotProps.item.from_syncs[0].from_publication_id }}
                </span>
              </div>
            </div>

            <!-- Cuando hay múltiples o ninguna sincronización -->
            <div v-else>
              <v-chip
                :color="slotProps.item.from_syncs.length > 0 ? 'success' : 'grey'"
                size="small"
                variant="outlined"
                class="mr-2"
              >
                {{ slotProps.item.from_syncs.length }}
              </v-chip>
              <v-tooltip v-if="slotProps.item.from_syncs.length > 0" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="x-small"
                    icon
                    variant="text"
                    color="success"
                    @click.stop="expanded = [slotProps.item.publication_id]"
                  >
                    <v-icon size="small">mdi-eye</v-icon>
                  </v-btn>
                </template>
                <span>Ver sincronizaciones entrantes</span>
              </v-tooltip>
            </div>
          </div>
        </template>

        <!-- Columna de Estado -->
        <template #[`item.sync_status`]="slotProps">
          <v-chip :color="getSyncStatusColor(slotProps.item)" size="small">
            {{ getSyncStatusText(slotProps.item) }}
          </v-chip>
        </template>

        <!-- Columna de Acciones -->
        <template #[`item.actions`]="slotProps">
          <div class="d-flex">
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  icon
                  variant="text"
                  color="primary"
                  @click="viewProductDetails(slotProps.item.publication_id)"
                >
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
              </template>
              <span>Ver detalles</span>
            </v-tooltip>
            
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  icon
                  variant="text"
                  color="success"
                  @click="openAddSyncDialog(slotProps.item.publication_id, 'outgoing')"
                >
                  <v-icon>mdi-arrow-right-bold-box-outline</v-icon>
                </v-btn>
              </template>
              <span>Agregar sincronización saliente</span>
            </v-tooltip>
            
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  icon
                  variant="text"
                  color="info"
                  @click="openAddSyncDialog(slotProps.item.publication_id, 'incoming')"
                >
                  <v-icon>mdi-arrow-left-bold-box-outline</v-icon>
                </v-btn>
              </template>
              <span>Agregar sincronización entrante</span>
            </v-tooltip>
            
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  icon
                  variant="text"
                  color="primary"
                  @click="openInMercadoLibre(slotProps.item.publication_id)"
                >
                  <v-icon size="small">mdi-open-in-new</v-icon>
                </v-btn>
              </template>
              <span>Ver en Mercado Libre</span>
            </v-tooltip>
          </div>
        </template>

        <!-- Filas expandibles -->
        <template #expanded-row="slotProps">
          <tr>
            <td :colspan="slotProps.columns.length">
              <div class="pa-4">
                <v-row>
                  <!-- Sincronizaciones Salientes -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center mb-2">
                      <v-icon size="small" color="primary" class="mr-1"
                        >mdi-arrow-right-bold</v-icon
                      >
                      <div class="text-subtitle-2 font-weight-medium">Sincroniza hacia</div>
                      <v-chip size="x-small" color="primary" class="ml-2">{{
                        slotProps.item.to_syncs.length
                      }}</v-chip>
                    </div>
                    <v-table
                      v-if="slotProps.item.to_syncs.length > 0"
                      density="compact"
                      class="border rounded"
                    >
                      <thead>
                        <tr>
                          <th>ID Publicación</th>
                          <th>Cuenta Destino</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="sync in slotProps.item.to_syncs" :key="sync.to_sync_id">
                          <td>
                            <div class="d-flex align-center">
                              <v-tooltip location="top">
                                <template #activator="{ props }">
                                  <v-btn
                                    v-bind="props"
                                    size="x-small"
                                    icon
                                    variant="text"
                                    color="primary"
                                    class="mr-1"
                                    @click="copyToClipboard(sync.to_sync_id)"
                                  >
                                    <v-icon size="small">mdi-content-copy</v-icon>
                                  </v-btn>
                                </template>
                                <span>Copiar ID</span>
                              </v-tooltip>
                              <span>{{ sync.to_sync_id }}</span>
                            </div>
                          </td>
                          <td>
                            <v-chip
                              size="small"
                              color="primary"
                              variant="flat"
                              class="font-weight-medium"
                            >
                              {{ getAccountName(sync.to_account_id) }}
                            </v-chip>
                          </td>
                          <td>
                            <div class="d-flex">
                              <v-tooltip location="top">
                                <template #activator="{ props }">
                                  <v-btn
                                    v-bind="props"
                                    size="x-small"
                                    icon
                                    variant="text"
                                    color="primary"
                                    @click="viewProductDetails(sync.to_sync_id)"
                                  >
                                    <v-icon size="small">mdi-eye</v-icon>
                                  </v-btn>
                                </template>
                                <span>Ver detalles</span>
                              </v-tooltip>
                              <v-tooltip location="top">
                                <template #activator="{ props }">
                                  <v-btn
                                    v-bind="props"
                                    size="x-small"
                                    icon
                                    variant="text"
                                    color="primary"
                                    @click="openInMercadoLibre(sync.to_sync_id)"
                                  >
                                    <v-icon size="small">mdi-open-in-new</v-icon>
                                  </v-btn>
                                </template>
                                <span>Ver en Mercado Libre</span>
                              </v-tooltip>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                    <div v-else class="text-caption text-grey text-center pa-2 border rounded">
                      No hay sincronizaciones salientes
                    </div>
                  </v-col>

                  <!-- Sincronizaciones Entrantes -->
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center mb-2">
                      <v-icon size="small" color="success" class="mr-1">mdi-arrow-left-bold</v-icon>
                      <div class="text-subtitle-2 font-weight-medium">Sincronizada desde</div>
                      <v-chip size="x-small" color="success" class="ml-2">{{
                        slotProps.item.from_syncs.length
                      }}</v-chip>
                    </div>
                    <v-table
                      v-if="slotProps.item.from_syncs.length > 0"
                      density="compact"
                      class="border rounded"
                    >
                      <thead>
                        <tr>
                          <th>ID Publicación</th>
                          <th>Cuenta Origen</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="sync in slotProps.item.from_syncs"
                          :key="sync.from_publication_id"
                        >
                          <td>
                            <div class="d-flex align-center">
                              <v-tooltip location="top">
                                <template #activator="{ props }">
                                  <v-btn
                                    v-bind="props"
                                    size="x-small"
                                    icon
                                    variant="text"
                                    color="success"
                                    class="mr-1"
                                    @click="copyToClipboard(sync.from_publication_id)"
                                  >
                                    <v-icon size="small">mdi-content-copy</v-icon>
                                  </v-btn>
                                </template>
                                <span>Copiar ID</span>
                              </v-tooltip>
                              <span>{{ sync.from_publication_id }}</span>
                            </div>
                          </td>
                          <td>
                            <v-chip
                              size="small"
                              color="success"
                              variant="flat"
                              class="font-weight-medium"
                            >
                              {{ getAccountName(sync.from_account_id) }}
                            </v-chip>
                          </td>
                          <td>
                            <div class="d-flex">
                              <v-tooltip location="top">
                                <template #activator="{ props }">
                                  <v-btn
                                    v-bind="props"
                                    size="x-small"
                                    icon
                                    variant="text"
                                    color="success"
                                    @click="viewProductDetails(sync.from_publication_id)"
                                  >
                                    <v-icon size="small">mdi-eye</v-icon>
                                  </v-btn>
                                </template>
                                <span>Ver detalles</span>
                              </v-tooltip>
                              <v-tooltip location="top">
                                <template #activator="{ props }">
                                  <v-btn
                                    v-bind="props"
                                    size="x-small"
                                    icon
                                    variant="text"
                                    color="success"
                                    @click="openInMercadoLibre(sync.from_publication_id)"
                                  >
                                    <v-icon size="small">mdi-open-in-new</v-icon>
                                  </v-btn>
                                </template>
                                <span>Ver en Mercado Libre</span>
                              </v-tooltip>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                    <div v-else class="text-caption text-grey text-center pa-2 border rounded">
                      No hay sincronizaciones entrantes
                    </div>
                  </v-col>
                </v-row>
              </div>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card>

    <!-- Snackbar para notificaciones -->
    <v-snackbar v-model="showNotification" :color="notificationType" timeout="3000">
      {{ notificationMessage }}
      <template #actions>
        <v-btn variant="text" icon="mdi-close" @click="showNotification = false"></v-btn>
      </template>
    </v-snackbar>

    <!-- Diálogo para agregar sincronización -->
    <v-dialog v-model="showAddSyncDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          {{ syncDialogTitle }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="syncForm" @submit.prevent="submitAddSync">
            <!-- Selección de cuenta -->
            <v-select
              v-model="selectedAccountId"
              :items="availableAccounts"
              item-title="title"
              item-value="value"
              label="Seleccionar cuenta"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Selecciona una cuenta']"
              class="mb-4"
            ></v-select>

            <!-- ID de publicación -->
            <v-text-field
              v-model="targetPublicationId"
              label="ID de publicación"
              variant="outlined"
              density="comfortable"
              :rules="[
                v => !!v || 'Ingresa un ID de publicación',
                v => /^[A-Z]{3}\d+$/.test(v) || 'Formato inválido. Ejemplo: MCO123456789'
              ]"
              placeholder="Ejemplo: MCO123456789"
              class="mb-4"
            ></v-text-field>

            <div class="text-caption text-grey mb-4">
              <v-icon size="small" color="info" class="mr-1">mdi-information-outline</v-icon>
              {{ syncDialogType === 'outgoing' ? 
                'Esta publicación se sincronizará hacia la publicación especificada.' : 
                'La publicación especificada se sincronizará hacia esta publicación.' }}
            </div>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showAddSyncDialog = false">
            Cancelar
          </v-btn>
          <v-btn 
            color="primary" 
            variant="elevated" 
            :loading="addingSyncRelation"
            @click="submitAddSync"
          >
            Agregar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import migrationService from '@/services/migrationService'
import type { PublicationSyncData } from '@/services/migrationService'
import { openInMercadoLibre } from '@/utils/mercadoLibreUtils'

// Estado
const accountStore = useAccountStore()
const loading = ref(false)
const publications = ref<PublicationSyncData[]>([])
const totalPublications = ref(0)
const expanded = ref<string[]>([])
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'warning'>('success')

// Estado para el diálogo de agregar sincronización
const showAddSyncDialog = ref(false)
const syncDialogTitle = ref('')
const syncDialogType = ref<'outgoing' | 'incoming'>('outgoing')
const sourcePublicationId = ref('')
const targetPublicationId = ref('')
const selectedAccountId = ref<number | null>(null)
const addingSyncRelation = ref(false)
const syncForm = ref<any>(null)

// Filtros
const searchQuery = ref('')
const syncStatusFilter = ref('all')
const syncCountFilter = ref('all')

// Opciones para los filtros
const syncStatusOptions = [
  { title: 'Todos', value: 'all' },
  { title: 'Origen', value: 'origin' },
  { title: 'Destino', value: 'destination' },
  { title: 'Ambos', value: 'both' },
  { title: 'Ninguno', value: 'none' },
]

const syncCountOptions = [
  { title: 'Todos', value: 'all' },
  { title: 'Ninguna', value: 'none' },
  { title: '1-5', value: 'few' },
  { title: '6-10', value: 'medium' },
  { title: 'Más de 10', value: 'many' },
]

// Encabezados de la tabla
const headers = [
  { title: 'ID Publicación', key: 'publication_id', sortable: true },
  { title: 'Sincr. Salientes', key: 'outgoing_syncs', sortable: true },
  { title: 'Sincr. Entrantes', key: 'incoming_syncs', sortable: true },
  { title: 'Estado', key: 'sync_status', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false },
]

// Datos filtrados para la tabla
const filteredPublications = computed(() => {
  let result = [...publications.value]

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((item) => item.publication_id.toLowerCase().includes(query))
  }

  // Filtrar por estado de sincronización
  if (syncStatusFilter.value !== 'all') {
    result = result.filter((item) => {
      const hasOutgoing = item.to_syncs.length > 0
      const hasIncoming = item.from_syncs.length > 0

      switch (syncStatusFilter.value) {
        case 'origin':
          return hasOutgoing && !hasIncoming
        case 'destination':
          return !hasOutgoing && hasIncoming
        case 'both':
          return hasOutgoing && hasIncoming
        case 'none':
          return !hasOutgoing && !hasIncoming
        default:
          return true
      }
    })
  }

  // Filtrar por cantidad de sincronizaciones
  if (syncCountFilter.value !== 'all') {
    result = result.filter((item) => {
      const totalSyncs = item.to_syncs.length + item.from_syncs.length

      switch (syncCountFilter.value) {
        case 'none':
          return totalSyncs === 0
        case 'few':
          return totalSyncs >= 1 && totalSyncs <= 5
        case 'medium':
          return totalSyncs >= 6 && totalSyncs <= 10
        case 'many':
          return totalSyncs > 10
        default:
          return true
      }
    })
  }

  return result
})

// Contadores para estadísticas
const originCount = computed(() => {
  return publications.value.filter(
    (item) => item.to_syncs.length > 0 && item.from_syncs.length === 0,
  ).length
})

const destinationCount = computed(() => {
  return publications.value.filter(
    (item) => item.to_syncs.length === 0 && item.from_syncs.length > 0,
  ).length
})

const bothCount = computed(() => {
  return publications.value.filter((item) => item.to_syncs.length > 0 && item.from_syncs.length > 0)
    .length
})

const noneCount = computed(() => {
  return publications.value.filter(
    (item) => item.to_syncs.length === 0 && item.from_syncs.length === 0,
  ).length
})

// No se necesitan datos para el gráfico ya que se ha eliminado

// Métodos
const loadSyncRelations = async () => {
  const accountId = accountStore.currentAccount?.ID
  if (!accountId) {
    showNotification.value = true
    notificationMessage.value = 'Selecciona una cuenta para ver las sincronizaciones'
    notificationType.value = 'error'
    return
  }

  loading.value = true

  try {
    const response = await migrationService.getSyncStats(accountId)
    publications.value = response.publications
    totalPublications.value = response.total_publications
  } catch (error) {
    console.error('Error al cargar las sincronizaciones:', error)
    showNotification.value = true
    notificationMessage.value = 'Error al cargar las sincronizaciones'
    notificationType.value = 'error'
  } finally {
    loading.value = false
  }
}

const getSyncStatusText = (item: PublicationSyncData) => {
  const hasOutgoing = item.to_syncs.length > 0
  const hasIncoming = item.from_syncs.length > 0

  if (hasOutgoing && hasIncoming) return 'Ambos'
  if (hasOutgoing) return 'Origen'
  if (hasIncoming) return 'Destino'
  return 'Ninguno'
}

const getSyncStatusColor = (item: PublicationSyncData) => {
  const hasOutgoing = item.to_syncs.length > 0
  const hasIncoming = item.from_syncs.length > 0

  if (hasOutgoing && hasIncoming) return 'purple'
  if (hasOutgoing) return 'primary'
  if (hasIncoming) return 'success'
  return 'grey'
}

const getAccountName = (accountId: number) => {
  // Buscar en las cuentas disponibles
  const accounts = accountStore.accounts
  const account = accounts.find((acc) => acc.ID === accountId)

  if (account) {
    return account.Nickname || account.Email || `Cuenta #${accountId}`
  }

  return `Cuenta #${accountId}`
}

const viewProductDetails = (productId: string) => {
  window.open(`/product-detail/${productId}`, '_blank')
}

// Usando la función importada de mercadoLibreUtils.ts

const copyToClipboard = (text: string) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showNotification.value = true
      notificationMessage.value = 'ID copiado al portapapeles'
      notificationType.value = 'success'
    })
    .catch((err) => {
      console.error('Error al copiar texto: ', err)
      showNotification.value = true
      notificationMessage.value = 'Error al copiar texto'
      notificationType.value = 'error'
    })
}

// Lista de cuentas disponibles para el diálogo
const availableAccounts = computed(() => {
  // Filtrar la cuenta actual para no mostrarla en la lista
  return accountStore.accounts
    .filter(account => account.ID !== accountStore.currentAccount?.ID)
    .map(account => ({
      title: account.Nickname || account.Email || `Cuenta #${account.ID}`,
      value: account.ID
    }))
})

// Abrir el diálogo para agregar sincronización
const openAddSyncDialog = (publicationId: string, type: 'outgoing' | 'incoming') => {
  syncDialogType.value = type
  sourcePublicationId.value = publicationId
  targetPublicationId.value = ''
  selectedAccountId.value = null
  
  if (type === 'outgoing') {
    syncDialogTitle.value = 'Agregar sincronización saliente'
  } else {
    syncDialogTitle.value = 'Agregar sincronización entrante'
  }
  
  showAddSyncDialog.value = true
}

// Enviar el formulario para agregar sincronización
const submitAddSync = async () => {
  // Validar el formulario
  const { valid } = await syncForm.value.validate()
  
  if (!valid) return
  
  addingSyncRelation.value = true
  
  try {
    let publication_id, to_sync_id
    
    if (syncDialogType.value === 'outgoing') {
      // Sincronización saliente: esta publicación -> publicación destino
      publication_id = sourcePublicationId.value
      to_sync_id = targetPublicationId.value
    } else {
      // Sincronización entrante: publicación origen -> esta publicación
      publication_id = targetPublicationId.value
      to_sync_id = sourcePublicationId.value
    }
    
    const response = await migrationService.createSyncRelation({
      sync_relations: [
        {
          publication_id,
          to_sync_id,
          account_id_to: selectedAccountId.value as number
        }
      ]
    })
    
    if (response.success) {
      showNotification.value = true
      notificationMessage.value = 'Sincronización creada exitosamente'
      notificationType.value = 'success'
      showAddSyncDialog.value = false
      
      // Recargar los datos
      loadSyncRelations()
    } else {
      showNotification.value = true
      notificationMessage.value = `Error: ${response.errors?.[0]?.message || 'No se pudo crear la sincronización'}`
      notificationType.value = 'error'
    }
  } catch (error) {
    console.error('Error al crear sincronización:', error)
    showNotification.value = true
    notificationMessage.value = 'Error al crear la sincronización'
    notificationType.value = 'error'
  } finally {
    addingSyncRelation.value = false
  }
}

// Ciclo de vida
onMounted(() => {
  loadSyncRelations()
})

// Watcher para recargar datos cuando cambia la cuenta
watch(
  () => accountStore.currentAccount?.ID,
  (newAccountId, oldAccountId) => {
    if (newAccountId !== oldAccountId) {
      loadSyncRelations()
    }
  },
)
</script>

<style scoped>
.border {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.rounded {
  border-radius: 4px;
}
</style>
