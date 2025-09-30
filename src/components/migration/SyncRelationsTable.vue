<template>
  <div>
    <!-- Título y botones -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 text-primary font-weight-medium mb-1">Sincronizaciones</h3>
        <p class="text-caption text-grey">
          Gestiona las relaciones de sincronización entre publicaciones de diferentes cuentas.
          <span class="font-weight-medium">{{ totalPublications }}</span> publicaciones disponibles.
        </p>
      </div>
      <div class="d-flex gap-2">
        <v-btn
          color="success"
          variant="outlined"
          size="small"
          :loading="syncingAll"
          :disabled="syncingAll"
          @click="syncAllPublications"
        >
          <v-icon start>mdi-sync</v-icon>
          Sincronizar Todo
        </v-btn>
        <v-btn
          color="primary"
          variant="outlined"
          size="small"
          :loading="loading"
          @click="loadSyncRelations"
        >
          <v-icon start>mdi-refresh</v-icon>
          Actualizar
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
                mdi-close-circle
              </v-icon>
            </template>
          </v-select>
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="catalogFilter"
            :items="catalogOptions"
            label="Catálogo"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="loadSyncRelations"
          >
            <template v-slot:prepend>
              <v-icon color="purple">mdi-book-open-variant</v-icon>
            </template>
            <template v-slot:append>
              <v-icon
                v-if="catalogFilter !== 'all'"
                color="primary"
                @click.stop="
                  () => {
                    catalogFilter = 'all'
                    loadSyncRelations()
                  }
                "
              >
                mdi-close-circle
              </v-icon>
            </template>
          </v-select>
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="statusFilter"
            :items="statusOptions"
            label="Estado"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="loadSyncRelations"
          >
            <template v-slot:prepend>
              <v-icon color="success">mdi-check-circle</v-icon>
            </template>
            <template v-slot:append>
              <v-icon
                v-if="statusFilter !== 'all'"
                color="primary"
                @click.stop="
                  () => {
                    statusFilter = 'all'
                    loadSyncRelations()
                  }
                "
              >
                mdi-close-circle
              </v-icon>
            </template>
          </v-select>
        </v-col>
      </v-row>
    </div>

    <!-- Estadísticas -->
    <div class="mb-4">
      <v-card variant="outlined">
        <v-card-text class="d-flex justify-space-around flex-wrap">
          <div class="text-center px-2">
            <div class="text-h6">{{ totalPublications }}</div>
            <div class="text-caption">Total Publicaciones</div>
          </div>

          <!-- Grupo de estado de sincronización -->
          <div class="d-flex flex-column align-center px-4 border-start">
            <div class="text-caption text-primary font-weight-medium mb-2">
              Estado de sincronización
            </div>
            <div class="d-flex">
              <div class="text-center px-3">
                <div class="text-h6">{{ originCount }}</div>
                <div class="text-caption">Origen</div>
              </div>
              <div class="text-center px-3">
                <div class="text-h6">{{ destinationCount }}</div>
                <div class="text-caption">Destino</div>
              </div>
              <div class="text-center px-3">
                <div class="text-h6">{{ bothCount }}</div>
                <div class="text-caption">Ambos</div>
              </div>
              <div class="text-center px-3">
                <div class="text-h6">{{ noneCount }}</div>
                <div class="text-caption">Ninguno</div>
              </div>
            </div>
          </div>

          <!-- Grupo de tipo de publicación -->
          <div class="d-flex flex-column align-center px-4 border-start">
            <div class="text-caption text-primary font-weight-medium mb-2">Tipo de publicación</div>
            <div class="d-flex">
              <div class="text-center px-3">
                <div class="text-h6">{{ catalogCount }}</div>
                <div class="text-caption">Catálogo</div>
              </div>
              <div class="text-center px-3">
                <div class="text-h6">{{ nonCatalogCount }}</div>
                <div class="text-caption">Estándar</div>
              </div>
            </div>
          </div>

          <!-- Grupo de estado de publicación -->
          <div class="d-flex flex-column align-center px-4 border-start">
            <div class="text-caption text-primary font-weight-medium mb-2">
              Estado de publicación
            </div>
            <div class="d-flex">
              <div class="text-center px-2">
                <div class="text-h6 text-success">{{ activeCount }}</div>
                <div class="text-caption">Activo</div>
              </div>
              <div class="text-center px-2">
                <div class="text-h6 text-warning">{{ pausedCount }}</div>
                <div class="text-caption">Pausado</div>
              </div>
              <div class="text-center px-2">
                <div class="text-h6 text-error">{{ closedCount }}</div>
                <div class="text-caption">Cerrado</div>
              </div>
              <div class="text-center px-2">
                <div class="text-h6 text-grey">{{ otherStatusCount }}</div>
                <div class="text-caption">Otros</div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Tabla de publicaciones -->
    <v-card variant="outlined">
      <v-data-table
        ref="dataTable"
        v-model:expanded="expanded"
        v-model="publicationsSelected"
        :headers="headers"
        :items="publications"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :page="page"
        @update:page="handlePageChange"
        @update:items-per-page="handleItemsPerPageChange"
        item-value="publication_id"
        density="comfortable"
        hover
        show-select
        class="elevation-0"
        :server-items-length="totalPublications"
      >
        <!-- No usamos el slot bottom para poder tener un paginador fijo -->
        <template #bottom></template>

        <!-- Template para el encabezado personalizado de la columna ID -->
        <template #[`header.publication_id`]="{ column }">
          <div
            class="d-flex align-center header-content"
            style="position: relative; min-width: 150px"
          >
            <!-- Contenedor con posición absoluta para evitar cambios en el layout -->
            <div style="position: absolute; width: 100%; z-index: 1">
              <v-fade-transition>
                <div
                  v-if="!showSearchField"
                  class="d-flex align-center sortable-header"
                  @click="handleSort(column.key || '')"
                >
                  <span class="mr-2">{{ column.title }}</span>
                  <!-- Icono de ordenamiento (similar al que usa Vuetify internamente) -->
                  <v-icon
                    v-if="column.sortable"
                    size="x-small"
                    :icon="getSortIcon()"
                    class="sort-icon"
                    :class="{ 'visible-on-hover': !isSorted(column) }"
                  ></v-icon>
                  <v-btn
                    icon="mdi-magnify"
                    size="x-small"
                    variant="text"
                    color="primary"
                    class="ml-2"
                    @click.stop="activateSearch"
                  ></v-btn>
                </div>
              </v-fade-transition>
            </div>

            <!-- Contenedor con posición absoluta para la caja de búsqueda -->
            <div style="position: absolute; width: 100%; z-index: 2">
              <v-fade-transition>
                <v-text-field
                  v-if="showSearchField"
                  v-model="searchQuery"
                  variant="outlined"
                  density="compact"
                  hide-details
                  placeholder="Buscar ID"
                  class="search-field"
                  clearable
                  ref="searchInput"
                  @update:model-value="handleSearchQueryChange"
                  @click:clear="clearSearchQuery"
                  @blur="handleSearchBlur"
                  @keydown.esc="deactivateSearch"
                  @click.stop
                ></v-text-field>
              </v-fade-transition>
            </div>

            <!-- Espacio invisible para mantener el ancho de la columna -->
            <div style="height: 1px; visibility: hidden">
              <div style="width: 150px"></div>
            </div>
          </div>
        </template>

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
            <!-- Mostrar el número de sincronizaciones -->
            <v-chip
              :color="slotProps.item.to_syncs.length > 0 ? 'primary' : 'grey'"
              size="small"
              variant="outlined"
              class="mr-2"
            >
              {{ slotProps.item.to_syncs.length }}
            </v-chip>

            <!-- Cuando hay exactamente una sincronización, mostrar el ID directamente -->
            <div v-if="slotProps.item.to_syncs.length === 1" class="d-flex align-center">
              <span class="text-caption text-truncate" style="max-width: 150px">
                {{ slotProps.item.to_syncs[0].to_sync_id }}
              </span>
            </div>

            <!-- Botón para expandir/contraer, mostrar siempre que haya al menos una sincronización -->
            <v-tooltip v-if="slotProps.item.to_syncs.length > 0" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="x-small"
                  icon
                  variant="text"
                  :color="expanded.includes(slotProps.item.publication_id) ? 'warning' : 'primary'"
                  @click.stop="toggleExpanded(slotProps.item.publication_id)"
                  class="ml-2"
                >
                  <v-icon size="small">
                    {{
                      expanded.includes(slotProps.item.publication_id) ? 'mdi-eye-off' : 'mdi-eye'
                    }}
                  </v-icon>
                </v-btn>
              </template>
              <span>{{
                expanded.includes(slotProps.item.publication_id)
                  ? 'Ocultar detalles'
                  : 'Ver sincronizaciones salientes'
              }}</span>
            </v-tooltip>
          </div>
        </template>

        <!-- Columna de Sincronizaciones Entrantes -->
        <template #[`item.incoming_syncs`]="slotProps">
          <div class="d-flex align-center">
            <!-- Mostrar el número de sincronizaciones -->
            <v-chip
              :color="slotProps.item.from_syncs.length > 0 ? 'success' : 'grey'"
              size="small"
              variant="outlined"
              class="mr-2"
            >
              {{ slotProps.item.from_syncs.length }}
            </v-chip>

            <!-- Cuando hay exactamente una sincronización, mostrar el ID directamente -->
            <div v-if="slotProps.item.from_syncs.length === 1" class="d-flex align-center">
              <span class="text-caption text-truncate" style="max-width: 150px">
                {{ slotProps.item.from_syncs[0].from_publication_id }}
              </span>
            </div>

            <!-- Botón para expandir/contraer, mostrar siempre que haya al menos una sincronización -->
            <v-tooltip v-if="slotProps.item.from_syncs.length > 0" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="x-small"
                  icon
                  variant="text"
                  :color="expanded.includes(slotProps.item.publication_id) ? 'warning' : 'success'"
                  @click.stop="toggleExpanded(slotProps.item.publication_id)"
                  class="ml-2"
                >
                  <v-icon size="small">
                    {{
                      expanded.includes(slotProps.item.publication_id) ? 'mdi-eye-off' : 'mdi-eye'
                    }}
                  </v-icon>
                </v-btn>
              </template>
              <span>{{
                expanded.includes(slotProps.item.publication_id)
                  ? 'Ocultar detalles'
                  : 'Ver sincronizaciones entrantes'
              }}</span>
            </v-tooltip>
          </div>
        </template>

        <!-- Columna de Estado de Sincronización -->
        <template #[`item.sync_status`]="slotProps">
          <v-chip :color="getSyncStatusColor(slotProps.item)" size="small">
            {{ getSyncStatusText(slotProps.item) }}
          </v-chip>
        </template>

        <!-- Columna de Estado de la Publicación -->
        <template #[`item.status`]="slotProps">
          <v-chip :color="getStatusColor(slotProps.item.status)" size="small" variant="flat">
            {{ getStatusText(slotProps.item.status) }}
          </v-chip>
        </template>

        <!-- Columna de Catálogo -->
        <template #[`item.catalog`]="slotProps">
          <v-chip
            :color="slotProps.item.is_catalog_listing ? 'purple' : 'grey-lighten-1'"
            size="small"
            variant="flat"
          >
            {{ slotProps.item.is_catalog_listing ? 'SÍ' : 'NO' }}
          </v-chip>
        </template>

        <!-- Columna de Acciones -->
        <template #[`item.actions`]="slotProps">
          <div class="d-flex align-center">
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

            <v-divider vertical class="mx-2"></v-divider>

            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  icon
                  variant="elevated"
                  color="warning"
                  :loading="syncingItem === slotProps.item.publication_id"
                  @click="syncPublication(slotProps.item.publication_id)"
                  class="ml-1"
                >
                  <v-icon>mdi-sync</v-icon>
                </v-btn>
              </template>
              <span>Actualizar sincronización</span>
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
                      density="compact"
                      class="border rounded"
                      v-if="slotProps.item.to_syncs.length > 0"
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

                              <v-tooltip location="top">
                                <template #activator="{ props }">
                                  <v-btn
                                    v-bind="props"
                                    size="x-small"
                                    icon
                                    variant="elevated"
                                    color="warning"
                                    class="ml-1"
                                    :loading="
                                      syncingItem ===
                                      `${slotProps.item.publication_id}-${sync.to_sync_id}`
                                    "
                                    @click="
                                      syncRelation(
                                        slotProps.item.publication_id,
                                        sync.to_sync_id,
                                        'outgoing',
                                      )
                                    "
                                  >
                                    <v-icon size="small">mdi-sync</v-icon>
                                  </v-btn>
                                </template>
                                <span>Sincronizar esta relación</span>
                              </v-tooltip>

                              <v-tooltip location="top">
                                <template #activator="{ props }">
                                  <v-btn
                                    v-bind="props"
                                    size="x-small"
                                    icon
                                    variant="elevated"
                                    color="error"
                                    class="ml-1"
                                    :loading="
                                      syncingItem ===
                                      `${slotProps.item.publication_id}-${sync.to_sync_id}-delete`
                                    "
                                    @click="
                                      deleteSyncRelation(
                                        slotProps.item.publication_id,
                                        sync.to_sync_id,
                                        'outgoing',
                                      )
                                    "
                                  >
                                    <v-icon size="small">mdi-link-variant-remove</v-icon>
                                  </v-btn>
                                </template>
                                <span>Eliminar esta relación</span>
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
                      density="compact"
                      class="border rounded"
                      v-if="slotProps.item.from_syncs.length > 0"
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

                              <v-tooltip location="top">
                                <template #activator="{ props }">
                                  <v-btn
                                    v-bind="props"
                                    size="x-small"
                                    icon
                                    variant="elevated"
                                    color="warning"
                                    class="ml-1"
                                    :loading="
                                      syncingItem ===
                                      `${sync.from_publication_id}-${slotProps.item.publication_id}`
                                    "
                                    @click="
                                      syncRelation(
                                        sync.from_publication_id,
                                        slotProps.item.publication_id,
                                        'incoming',
                                      )
                                    "
                                  >
                                    <v-icon size="small">mdi-sync</v-icon>
                                  </v-btn>
                                </template>
                                <span>Sincronizar esta relación</span>
                              </v-tooltip>

                              <v-tooltip location="top">
                                <template #activator="{ props }">
                                  <v-btn
                                    v-bind="props"
                                    size="x-small"
                                    icon
                                    variant="elevated"
                                    color="error"
                                    class="ml-1"
                                    :loading="
                                      syncingItem ===
                                      `${sync.from_publication_id}-${slotProps.item.publication_id}-delete`
                                    "
                                    @click="
                                      deleteSyncRelation(
                                        sync.from_publication_id,
                                        slotProps.item.publication_id,
                                        'incoming',
                                      )
                                    "
                                  >
                                    <v-icon size="small">mdi-link-variant-remove</v-icon>
                                  </v-btn>
                                </template>
                                <span>Eliminar esta relación</span>
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
          <!-- Mostrar el ID de la publicación de origen -->
          <div class="d-flex align-center mb-4 pa-2 border rounded">
            <v-icon
              size="small"
              :color="syncDialogType === 'outgoing' ? 'primary' : 'success'"
              class="mr-2"
            >
              {{ syncDialogType === 'outgoing' ? 'mdi-arrow-right-bold' : 'mdi-arrow-left-bold' }}
            </v-icon>
            <span class="text-subtitle-2">ID de publicación: </span>
            <span class="font-weight-medium ml-1">{{ sourcePublicationId }}</span>
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="x-small"
                  icon
                  variant="text"
                  color="primary"
                  class="ml-2"
                  @click="copyToClipboard(sourcePublicationId)"
                >
                  <v-icon size="small">mdi-content-copy</v-icon>
                </v-btn>
              </template>
              <span>Copiar ID</span>
            </v-tooltip>
          </div>
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
              :rules="[(v) => !!v || 'Selecciona una cuenta']"
              class="mb-4"
              :loading="loadingAccountPublications"
              @update:model-value="loadPublicationsForAccount"
            ></v-select>

            <!-- Selección de ID de publicación con botón para crear nueva publicación -->
            <div class="d-flex align-center mb-4">
              <div class="flex-grow-1">
                <v-autocomplete
                  v-model="targetPublicationId"
                  :items="accountPublications"
                  :loading="loadingAccountPublications"
                  label="ID de publicación"
                  variant="outlined"
                  item-title="id"
                  item-value="id"
                  return-object
                  :disabled="!selectedAccountId"
                  :hint="!selectedAccountId ? 'Selecciona una cuenta primero' : ''"
                  persistent-hint
                  @update:search="publicationSearchQuery = $event"
                >
                  <template #item="{ item, props }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-icon
                          :color="item.raw.status ? 'success' : 'error'"
                          size="small"
                          class="mr-2"
                        >
                          {{ item.raw.status ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                        </v-icon>
                      </template>
                      <template #title>
                        <span>{{ item.raw.id }}</span>
                      </template>
                      <template #subtitle>
                        <span>{{ item.raw.title || 'Sin título' }}</span>
                      </template>
                    </v-list-item>
                  </template>

                  <!-- Personalizar cómo se muestra el elemento seleccionado -->
                  <template #selection="{ item }">
                    <div class="d-flex align-center">
                      <span class="font-weight-medium">{{ item.raw.id }}</span>
                      <v-tooltip location="top">
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            size="x-small"
                            icon
                            variant="text"
                            color="primary"
                            class="ml-2"
                            @click.stop="copyToClipboard(item.raw.id)"
                          >
                            <v-icon size="small">mdi-content-copy</v-icon>
                          </v-btn>
                        </template>
                        <span>Copiar ID</span>
                      </v-tooltip>
                    </div>
                  </template>
                </v-autocomplete>
              </div>

              <!-- Botón para crear nueva publicación (fuera de la caja de texto) -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    size="small"
                    color="primary"
                    variant="elevated"
                    :disabled="!selectedAccountId"
                    :loading="creatingPublication"
                    @click="createNewPublication"
                    class="ml-2"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </template>
                <span>Crear nueva publicación</span>
              </v-tooltip>
            </div>

            <div class="text-caption text-grey mb-4 pa-2 bg-grey-lighten-4 rounded">
              <v-icon size="small" color="info" class="mr-1">mdi-information-outline</v-icon>
              <span class="font-weight-medium">
                {{
                  syncDialogType === 'outgoing'
                    ? `La publicación ${sourcePublicationId} se sincronizará HACIA la publicación seleccionada.`
                    : `La publicación seleccionada se sincronizará HACIA la publicación ${sourcePublicationId}.`
                }}
              </span>
            </div>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showAddSyncDialog = false"> Cancelar </v-btn>
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

    <!-- Paginador fijo -->
    <div class="pagination-fixed">
      <div class="d-flex align-center justify-space-between w-100 px-4 py-2 bg-white elevation-1">
        <!-- Grupo de botones de acciones -->
        <div class="d-flex align-center">
          <div class="d-flex align-center border rounded pa-1 bg-grey-lighten-5">
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              :disabled="!publicationsSelected || publicationsSelected.length === 0"
              :loading="syncingSelected"
              @click="syncSelectedPublications"
              class="me-1"
            >
              <v-icon class="me-1">mdi-sync</v-icon>
              <span class="font-weight-medium"
                >Sincronizar {{ publicationsSelected ? publicationsSelected.length : 0 }}</span
              >
            </v-btn>

            <v-divider vertical class="mx-1"></v-divider>

            <v-btn
              color="error"
              variant="tonal"
              size="small"
              :disabled="
                !publicationsSelected ||
                publicationsSelected.length === 0 ||
                getTotalSyncRelations() === 0
              "
              :loading="deletingSelected"
              @click="deleteSelectedSyncRelations"
            >
              <v-icon class="me-1">mdi-link-variant-remove</v-icon>
              <span class="font-weight-medium">Eliminar {{ getTotalSyncRelations() }}</span>
            </v-btn>
          </div>
        </div>

        <!-- Controles de paginación -->
        <div class="d-flex align-center">
          <div class="text-body-2 text-grey-darken-1 font-weight-medium me-4">
            {{
              totalPublications > 0
                ? `${(page - 1) * itemsPerPage + 1}-${Math.min(
                    page * itemsPerPage,
                    totalPublications,
                  )} de ${totalPublications}`
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
              @update:model-value="handleItemsPerPageChange"
            ></v-select>
          </div>

          <v-pagination
            v-model="page"
            :length="Math.ceil(totalPublications / itemsPerPage)"
            @update:model-value="handlePageChange"
            :disabled="loading"
            :total-visible="5"
            show-first
            show-last
            class="pagination-centered flex-grow-1"
            density="comfortable"
            rounded="circle"
          ></v-pagination>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import migrationService, {
  type PublicationSyncData,
  type SyncAllPublicationsResponse,
} from '@/services/migrationService'
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
const targetPublicationId = ref<{ id: string; title?: string; status: boolean } | null>(null)
const selectedAccountId = ref<number | null>(null)
const addingSyncRelation = ref(false)
const creatingPublication = ref(false)
const syncForm = ref<any>(null)

// Estado para la carga de publicaciones de la cuenta seleccionada
const loadingAccountPublications = ref(false)
const accountPublications = ref<Array<{ id: string; title?: string; status: boolean }>>([])
const publicationSearchQuery = ref('')

// Estado para la sincronización
const publicationsSelected = ref<any[]>([])
const syncingAll = ref(false)
const syncingSelected = ref(false)
// Variable compartida para operaciones de sincronización y eliminación individual
const syncingItem = ref<string | null>(null)
// Variable para el estado de eliminación múltiple
const deletingSelected = ref(false)

// Estado para la paginación
const page = ref(1)
const itemsPerPage = ref(10)
const itemsPerPageOptions = [5, 10, 25, 50, 100]

// Filtros
const searchQuery = ref('')
const syncStatusFilter = ref('all')
const syncCountFilter = ref('all')
const catalogFilter = ref('all')
const statusFilter = ref('all') // Filtro para el status de la publicación

// Estado para el campo de búsqueda
const showSearchField = ref(false)
const searchInput = ref<HTMLElement | null>(null)
const dataTable = ref<any>(null)

// Opciones para los filtros
const syncStatusOptions = [
  { title: 'Todos', value: 'all' },
  { title: 'Salientes', value: 'origin' },
  { title: 'Entrantes', value: 'destination' },
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

// Opciones para el filtro de catálogo
const catalogOptions = [
  { title: 'Todos', value: 'all' },
  { title: 'SÍ', value: 'yes' },
  { title: 'NO', value: 'no' },
]

// Opciones para el filtro de status
const statusOptions = [
  { title: 'Todos', value: 'all' },
  { title: 'Activo', value: 'active' },
  { title: 'Pausado', value: 'paused' },
  { title: 'Cerrado', value: 'closed' },
  { title: 'Otros', value: 'other' },
]

// Encabezados de la tabla
const headers = [
  { title: 'ID', key: 'publication_id', sortable: true },
  { title: 'Sincr. Salientes', key: 'outgoing_syncs', sortable: true },
  { title: 'Sincr. Entrantes', key: 'incoming_syncs', sortable: true },
  { title: 'Estado Sincr.', key: 'sync_status', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Catálogo', key: 'catalog', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false },
]

// Ya no necesitamos la función filteredPublications computada
// porque ahora aplicamos los filtros directamente en loadSyncRelations

// Contadores para estadísticas (usando allPublications para contar todas las publicaciones)
const originCount = computed(() => {
  return allPublications.value.filter(
    (item) => item.to_syncs.length > 0 && item.from_syncs.length === 0,
  ).length
})

const destinationCount = computed(() => {
  return allPublications.value.filter(
    (item) => item.to_syncs.length === 0 && item.from_syncs.length > 0,
  ).length
})

const bothCount = computed(() => {
  return allPublications.value.filter(
    (item) => item.to_syncs.length > 0 && item.from_syncs.length > 0,
  ).length
})

const noneCount = computed(() => {
  return allPublications.value.filter(
    (item) => item.to_syncs.length === 0 && item.from_syncs.length === 0,
  ).length
})

// Contador para publicaciones de catálogo
const catalogCount = computed(() => {
  return allPublications.value.filter((item) => item.is_catalog_listing === true).length
})

// Contador para publicaciones estándar (no catálogo)
const nonCatalogCount = computed(() => {
  return allPublications.value.filter((item) => item.is_catalog_listing === false).length
})

// Contadores para los diferentes estados de publicación
const activeCount = computed(() => {
  return allPublications.value.filter((item) => item.status?.toLowerCase() === 'active').length
})

const pausedCount = computed(() => {
  return allPublications.value.filter((item) => item.status?.toLowerCase() === 'paused').length
})

const closedCount = computed(() => {
  return allPublications.value.filter((item) => item.status?.toLowerCase() === 'closed').length
})

const otherStatusCount = computed(() => {
  return allPublications.value.filter(
    (item) => item.status && !['active', 'paused', 'closed'].includes(item.status.toLowerCase()),
  ).length
})

// No se necesitan datos para el gráfico ya que se ha eliminado

// Variable para almacenar todas las publicaciones (para estadísticas)
const allPublications = ref<PublicationSyncData[]>([])

// Métodos
const loadSyncRelations = async () => {
  const accountId = accountStore.currentAccount?.ID
  if (!accountId) {
    showNotification.value = true
    notificationMessage.value = 'Selecciona una cuenta primero'
    notificationType.value = 'warning'
    return
  }

  loading.value = true

  try {
    // Primero, obtener las estadísticas de sincronización
    const syncResponse = await migrationService.getSyncStats(accountId)

    // Obtener los detalles de todas las publicaciones en una sola llamada
    const productsResponse = await migrationService.getProductIds(
      accountId,
      undefined,
      0,
      syncResponse.publications.length,
    )

    // Crear un mapa para buscar rápidamente los detalles de cada publicación por ID
    const productDetailsMap = new Map()
    productsResponse.products.forEach((product) => {
      // Verificar si es una publicación de catálogo
      const isCatalogListing =
        product.Attributes &&
        typeof product.Attributes === 'object' &&
        'catalog_listing' in product.Attributes
          ? Boolean(product.Attributes.catalog_listing)
          : false

      // Extraer el status de los atributos
      const publicationStatus =
        product.Attributes &&
        typeof product.Attributes === 'object' &&
        'status' in product.Attributes
          ? String(product.Attributes.status)
          : 'unknown'

      productDetailsMap.set(product.ID, {
        isCatalogListing,
        status: product.Status, // Estado booleano (activo/inactivo)
        publicationStatus: publicationStatus, // Status de la publicación (active, paused, etc.)
        title: (product.Attributes?.title as string) || '',
      })
    })

    // Combinar los datos de sincronización con los detalles de las publicaciones
    const allPublicationsWithDetails = syncResponse.publications.map((pub) => {
      const details = productDetailsMap.get(pub.publication_id)
      return {
        ...pub,
        is_catalog_listing: details ? details.isCatalogListing : false,
        status: details ? details.publicationStatus : 'unknown',
      }
    })

    // Guardar todas las publicaciones para estadísticas
    allPublications.value = allPublicationsWithDetails

    // Aplicar filtros
    let filteredPublications = [...allPublicationsWithDetails]

    // Filtrar por búsqueda
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filteredPublications = filteredPublications.filter((item) => {
        return item.publication_id.toLowerCase().includes(query)
      })
    }

    // Filtrar por estado de sincronización
    if (syncStatusFilter.value !== 'all') {
      filteredPublications = filteredPublications.filter((item) => {
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
      filteredPublications = filteredPublications.filter((item) => {
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

    // Filtrar por catálogo
    if (catalogFilter.value !== 'all') {
      filteredPublications = filteredPublications.filter((item) => {
        switch (catalogFilter.value) {
          case 'yes':
            return item.is_catalog_listing === true
          case 'no':
            return item.is_catalog_listing === false
          default:
            return true
        }
      })
    }

    // Filtrar por status de la publicación
    if (statusFilter.value !== 'all') {
      filteredPublications = filteredPublications.filter((item) => {
        if (!item.status) return false

        const status = item.status.toLowerCase()

        switch (statusFilter.value) {
          case 'active':
            return status === 'active'
          case 'paused':
            return status === 'paused'
          case 'closed':
            return status === 'closed'
          case 'other':
            return !['active', 'paused', 'closed'].includes(status)
          default:
            return true
        }
      })
    }

    // Actualizar el total de publicaciones filtradas
    totalPublications.value = filteredPublications.length

    // Aplicar paginación
    const offset = (page.value - 1) * itemsPerPage.value
    const limit = itemsPerPage.value
    const paginatedPublications = filteredPublications.slice(offset, offset + limit)

    // Actualizar el estado
    publications.value = paginatedPublications
  } catch (error) {
    console.error('Error al cargar las sincronizaciones:', error)
    showNotification.value = true
    notificationMessage.value = 'Error al cargar las sincronizaciones'
    notificationType.value = 'error'
    publications.value = []
    allPublications.value = []
    totalPublications.value = 0
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

// Función para obtener el color según el status de la publicación
const getStatusColor = (status: string | undefined) => {
  if (!status) return 'grey'

  // Convertir a minúsculas para la comparación
  const statusLower = status.toLowerCase()

  switch (statusLower) {
    case 'active':
      return 'success'
    case 'paused':
      return 'warning'
    case 'closed':
      return 'error'
    case 'under_review':
      return 'info'
    default:
      // Para otros estados, usar un color distintivo
      return 'deep-purple-lighten-3' // Color distintivo para estados no estándar
  }
}

// Función para obtener el texto según el status de la publicación
const getStatusText = (status: string | undefined) => {
  if (!status) return 'Desconocido'

  // Convertir a minúsculas para la comparación
  const statusLower = status.toLowerCase()

  switch (statusLower) {
    case 'active':
      return 'Activo'
    case 'paused':
      return 'Pausado'
    case 'closed':
      return 'Cerrado'
    case 'under_review':
      return 'En revisión'
    default:
      // Para otros estados, mostrar el valor original con la primera letra en mayúscula
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
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

const toggleExpanded = (publicationId: string) => {
  const index = expanded.value.indexOf(publicationId)
  if (index >= 0) {
    // Si ya está expandido, lo quitamos para contraer
    expanded.value.splice(index, 1)
  } else {
    // Si no está expandido, lo agregamos para expandir
    expanded.value.push(publicationId)
  }
}

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
    .filter((account) => account.ID !== accountStore.currentAccount?.ID)
    .map((account) => ({
      title: account.Nickname || account.Email || `Cuenta #${account.ID}`,
      value: account.ID,
    }))
})

// Función de filtro personalizado para el autocomplete
const customFilter = (item: { id: string; title?: string; status: boolean }, queryText: string) => {
  const id = item.id.toLowerCase()
  const title = (item.title || '').toLowerCase()
  const query = queryText.toLowerCase()

  return id.includes(query) || title.includes(query)
}

// Cargar publicaciones para la cuenta seleccionada
const loadPublicationsForAccount = async (accountId: number | null) => {
  if (!accountId) {
    accountPublications.value = []
    return
  }

  loadingAccountPublications.value = true

  try {
    // Usar la API para obtener las publicaciones de la cuenta seleccionada
    const response = await migrationService.getProductIds(accountId, undefined, 0, 100)

    // Transformar los datos al formato que necesitamos
    accountPublications.value = response.products.map((product) => ({
      id: product.ID,
      title: (product.Attributes?.title as string) || '',
      status: product.Status,
    }))
  } catch (error) {
    console.error('Error al cargar publicaciones de la cuenta:', error)
    showNotification.value = true
    notificationMessage.value = 'Error al cargar publicaciones de la cuenta'
    notificationType.value = 'error'
    accountPublications.value = []
  } finally {
    loadingAccountPublications.value = false
  }
}

// Abrir el diálogo para agregar sincronización
const openAddSyncDialog = (publicationId: string, type: 'outgoing' | 'incoming') => {
  syncDialogType.value = type
  sourcePublicationId.value = publicationId
  targetPublicationId.value = null
  selectedAccountId.value = null
  accountPublications.value = []

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

    // Obtener el ID de publicación destino (debe ser un objeto)
    if (!targetPublicationId.value) {
      showNotification.value = true
      notificationMessage.value = 'Selecciona una publicación válida'
      notificationType.value = 'error'
      addingSyncRelation.value = false
      return
    }

    const targetId =
      typeof targetPublicationId.value === 'object' ? targetPublicationId.value.id : ''

    if (syncDialogType.value === 'outgoing') {
      // Sincronización saliente: esta publicación -> publicación destino
      publication_id = sourcePublicationId.value
      to_sync_id = targetId
    } else {
      // Sincronización entrante: publicación origen -> esta publicación
      publication_id = targetId
      to_sync_id = sourcePublicationId.value
    }

    const response = await migrationService.createSyncRelation({
      sync_relations: [
        {
          publication_id,
          to_sync_id,
          account_id_to: selectedAccountId.value as number,
        },
      ],
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

// Función para crear una nueva publicación
const createNewPublication = async () => {
  if (!selectedAccountId.value) {
    showNotification.value = true
    notificationMessage.value = 'Selecciona una cuenta primero'
    notificationType.value = 'warning'
    return
  }

  // Verificar si hay una publicación seleccionada para usar como base
  const sourceId = sourcePublicationId.value
  if (!sourceId) {
    showNotification.value = true
    notificationMessage.value = 'Error: No se pudo identificar la publicación de origen'
    notificationType.value = 'error'
    return
  }

  creatingPublication.value = true

  try {
    // Usar el ID de la publicación seleccionada como base para crear la nueva
    // Llamar a la API para publicar el producto
    const response = await migrationService.publishProduct(sourceId, selectedAccountId.value)

    if (response.success) {
      showNotification.value = true
      notificationMessage.value = 'Publicación creada exitosamente'
      notificationType.value = 'success'

      // Recargar las publicaciones de la cuenta
      await loadPublicationsForAccount(selectedAccountId.value)

      // Si se devuelve un ID de producto, seleccionarlo
      if (response.publication_id) {
        const newPublication = accountPublications.value.find(
          (p) => p.id === response.publication_id,
        )
        if (newPublication) {
          targetPublicationId.value = newPublication
        }
      }
    } else {
      showNotification.value = true

      // Manejar específicamente el error de catálogo
      if (
        response.message &&
        (response.message.includes('ErrorCatalog Listing') ||
          response.message.includes('Code: 004') ||
          response.message.includes('Status: 409'))
      ) {
        notificationMessage.value =
          'No se puede crear una publicación basada en un ítem de catálogo. Por favor, seleccione una publicación que no sea de catálogo.'
      } else {
        notificationMessage.value = `Error: ${response.message || 'No se pudo crear la publicación'}`
      }

      notificationType.value = 'error'
    }
  } catch (error) {
    console.error('Error al crear publicación:', error)
    showNotification.value = true
    notificationMessage.value = 'Error al crear la publicación'
    notificationType.value = 'error'
  } finally {
    creatingPublication.value = false
  }
}

// Ciclo de vida
onMounted(() => {
  loadSyncRelations()
})

// Función para sincronizar todas las publicaciones
const syncAllPublications = async () => {
  syncingAll.value = true

  try {
    const accountId = accountStore.currentAccount?.ID
    if (!accountId) {
      showNotification.value = true
      notificationMessage.value = 'Selecciona una cuenta primero'
      notificationType.value = 'warning'
      return
    }

    // Iniciar el proceso de sincronización sin esperar a que termine
    // Usamos Promise.race con un timeout para evitar esperar demasiado tiempo
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Sincronización iniciada. Este proceso puede tardar varios minutos.',
        })
      }, 5000) // Esperamos máximo 5 segundos por una respuesta inicial
    })

    // Iniciamos la sincronización pero no esperamos a que termine completamente
    const syncPromise = migrationService.syncAllPublications(accountId)

    // Esperamos solo la confirmación de inicio o el timeout, lo que ocurra primero
    const result = (await Promise.race([syncPromise, timeoutPromise])) as {
      success: boolean
      message: string
      data?: SyncAllPublicationsResponse
    }

    showNotification.value = true
    notificationMessage.value =
      result.message || 'Sincronización de todas las publicaciones iniciada'
    notificationType.value = 'success'

    // Recargar los datos después de un tiempo para ver los cambios iniciales
    setTimeout(() => {
      loadSyncRelations()

      // Mostrar mensaje adicional explicando que el proceso continuará en segundo plano
      showNotification.value = true
      notificationMessage.value =
        'La sincronización continuará en segundo plano. Puedes seguir usando la aplicación.'
      notificationType.value = 'success' // Usamos success en lugar de info que no es un tipo válido
    }, 3000)

    // Continuamos con la promesa original en segundo plano
    syncPromise.catch((error: unknown) => {
      console.error('Error en la sincronización en segundo plano:', error)
    })
  } catch (error) {
    console.error('Error al iniciar la sincronización de publicaciones:', error)
    showNotification.value = true
    notificationMessage.value =
      error instanceof Error ? error.message : 'Error al sincronizar todas las publicaciones'
    notificationType.value = 'error'
  } finally {
    syncingAll.value = false
  }
}

// Función para sincronizar las publicaciones seleccionadas
const syncSelectedPublications = async () => {
  if (!publicationsSelected.value || publicationsSelected.value.length === 0) return

  syncingSelected.value = true

  try {
    // Sincronizar cada publicación seleccionada
    for (const publicationId of publicationsSelected.value) {
      await syncPublication(publicationId)
    }

    showNotification.value = true
    notificationMessage.value = `${publicationsSelected.value.length} publicaciones sincronizadas correctamente`
    notificationType.value = 'success'
  } catch (error) {
    console.error('Error al sincronizar publicaciones seleccionadas:', error)
    showNotification.value = true
    notificationMessage.value = 'Error al sincronizar publicaciones seleccionadas'
    notificationType.value = 'error'
  } finally {
    syncingSelected.value = false
  }
}

// Función para sincronizar una publicación específica
const syncPublication = async (publicationId: string) => {
  const accountId = accountStore.currentAccount?.ID
  if (!accountId) {
    showNotification.value = true
    notificationMessage.value = 'Selecciona una cuenta primero'
    notificationType.value = 'warning'
    return
  }

  syncingItem.value = publicationId

  try {
    // Llamar al endpoint para actualizar la publicación y sus sincronizaciones
    const response = await migrationService.updateProduct(accountId, publicationId)

    showNotification.value = true
    notificationMessage.value =
      response.message || `Sincronización de la publicación ${publicationId} iniciada`
    notificationType.value = 'success'

    // Recargar los datos para ver los cambios
    await loadSyncRelations()
  } catch (error) {
    console.error(`Error al sincronizar la publicación ${publicationId}:`, error)
    showNotification.value = true
    notificationMessage.value = `Error al sincronizar la publicación ${publicationId}`
    notificationType.value = 'error'
  } finally {
    syncingItem.value = null
  }
}

// Función para sincronizar una relación específica
const syncRelation = async (
  sourceId: string,
  targetId: string,
  direction: 'outgoing' | 'incoming',
) => {
  // Creamos un ID único para esta relación
  const relationId = `${sourceId}-${targetId}`
  syncingItem.value = relationId

  try {
    const accountId = accountStore.currentAccount?.ID
    if (!accountId) {
      showNotification.value = true
      notificationMessage.value = 'Selecciona una cuenta primero'
      notificationType.value = 'warning'
      return
    }

    let response
    if (direction === 'outgoing') {
      // Sincronizar de sourceId hacia targetId
      // En este caso, sourceId es la publicación de origen y targetId es la publicación de destino
      // Necesitamos el ID de la cuenta actual como cuenta de origen
      response = await migrationService.updateProduct(accountId, sourceId, undefined, targetId)
    } else {
      // 'incoming'
      // Sincronizar de targetId hacia sourceId (inverso)
      // En este caso, targetId es la publicación de origen y sourceId es la publicación de destino
      // Necesitamos encontrar el ID de la cuenta a la que pertenece sourceId
      const targetAccountId = findAccountIdByPublicationId(sourceId)
      if (!targetAccountId) {
        throw new Error(`No se pudo determinar la cuenta para la publicación ${sourceId}`)
      }
      response = await migrationService.updateProduct(
        accountId,
        targetId,
        targetAccountId,
        sourceId,
      )
    }

    showNotification.value = true
    notificationMessage.value =
      response.message ||
      (direction === 'outgoing'
        ? `Sincronización de ${sourceId} hacia ${targetId} iniciada`
        : `Sincronización desde ${sourceId} hacia ${targetId} iniciada`)
    notificationType.value = 'success'

    // Recargar los datos para ver los cambios
    await loadSyncRelations()
  } catch (error) {
    console.error(`Error al sincronizar la relación ${sourceId}-${targetId}:`, error)
    showNotification.value = true
    notificationMessage.value =
      error instanceof Error ? error.message : `Error al sincronizar la relación`
    notificationType.value = 'error'
  } finally {
    syncingItem.value = null
  }
}

// Función auxiliar para encontrar el ID de cuenta por ID de publicación
const findAccountIdByPublicationId = (publicationId: string): number | undefined => {
  // Buscar en las publicaciones cargadas
  const publication = publications.value.find((item) => item.publication_id === publicationId)
  if (publication) {
    return publication.account_id
  }

  // Si no se encuentra, buscar en las sincronizaciones entrantes y salientes
  for (const item of publications.value) {
    // Buscar en sincronizaciones salientes
    const outgoingSync = item.to_syncs?.find((sync) => sync.to_sync_id === publicationId)
    if (outgoingSync) {
      return outgoingSync.to_account_id
    }

    // Buscar en sincronizaciones entrantes
    const incomingSync = item.from_syncs?.find((sync) => sync.from_publication_id === publicationId)
    if (incomingSync) {
      return incomingSync.from_account_id
    }
  }

  return undefined
}

// Nota: La función updateSyncRelations fue eliminada porque no se utilizaba y
// su funcionalidad ya está cubierta por la función syncPublication

// Función para eliminar una relación específica
const deleteSyncRelation = async (
  sourceId: string,
  targetId: string,
  direction: 'outgoing' | 'incoming',
) => {
  // Creamos un ID único para esta relación con sufijo para diferenciar de sincronización
  const relationId = `${sourceId}-${targetId}-delete`
  syncingItem.value = relationId

  try {
    // Llamada a la API para eliminar la relación
    const request = {
      sync_relations: [
        {
          publication_id: direction === 'outgoing' ? sourceId : targetId,
          to_sync_id: direction === 'outgoing' ? targetId : sourceId,
        },
      ],
    }

    const response = await migrationService.deleteSyncRelation(request)

    if (response.success) {
      showNotification.value = true
      notificationMessage.value = `Relación de sincronización eliminada correctamente`
      notificationType.value = 'success'

      // Recargar los datos para ver los cambios
      loadSyncRelations()
    } else {
      showNotification.value = true
      notificationMessage.value = `Error al eliminar la relación: ${response.errors?.[0]?.message || 'Error desconocido'}`
      notificationType.value = 'error'
    }
  } catch (error) {
    console.error(`Error al eliminar la relación ${sourceId}-${targetId}:`, error)
    showNotification.value = true
    notificationMessage.value = `Error al eliminar la relación`
    notificationType.value = 'error'
  } finally {
    syncingItem.value = null
  }
}

// Función para calcular el total de relaciones de sincronización de las publicaciones seleccionadas
const getTotalSyncRelations = (): number => {
  if (!publicationsSelected.value || publicationsSelected.value.length === 0) {
    return 0
  }

  let totalRelations = 0

  // Contar todas las relaciones de sincronización (salientes y entrantes)
  publicationsSelected.value.forEach((publicationId) => {
    const publication = publications.value.find((p) => p.publication_id === publicationId)
    if (publication) {
      // Contar relaciones salientes
      totalRelations += publication.to_syncs.length

      // Contar relaciones entrantes
      totalRelations += publication.from_syncs.length
    }
  })

  return totalRelations
}

// Función para eliminar todas las relaciones de sincronización seleccionadas
const deleteSelectedSyncRelations = async () => {
  const totalRelations = getTotalSyncRelations()

  if (
    !publicationsSelected.value ||
    publicationsSelected.value.length === 0 ||
    totalRelations === 0
  ) {
    showNotification.value = true
    notificationMessage.value = 'No hay relaciones de sincronización para eliminar'
    notificationType.value = 'warning'
    return
  }

  deletingSelected.value = true

  try {
    // Obtener todas las relaciones de sincronización de las publicaciones seleccionadas
    const syncRelations: Array<{ publication_id: string; to_sync_id: string }> = []

    // Recopilar todas las relaciones de sincronización (salientes y entrantes)
    publicationsSelected.value.forEach((publicationId) => {
      const publication = publications.value.find((p) => p.publication_id === publicationId)
      if (publication) {
        // Agregar relaciones salientes
        publication.to_syncs.forEach((sync) => {
          syncRelations.push({
            publication_id: publication.publication_id,
            to_sync_id: sync.to_sync_id,
          })
        })

        // Agregar relaciones entrantes
        publication.from_syncs.forEach((sync) => {
          syncRelations.push({
            publication_id: sync.from_publication_id,
            to_sync_id: publication.publication_id,
          })
        })
      }
    })

    // Ya verificamos que hay relaciones para eliminar con getTotalSyncRelations()

    // Llamada a la API para eliminar todas las relaciones
    const request = { sync_relations: syncRelations }
    const response = await migrationService.deleteSyncRelation(request)

    showNotification.value = true
    if (response.success) {
      notificationMessage.value = `${response.total_deleted || response.deleted_relations || 0} relaciones de sincronización eliminadas correctamente`
      notificationType.value = 'success'
    } else {
      notificationMessage.value = `${response.total_deleted || response.deleted_relations || 0} relaciones eliminadas, ${response.total_failed || 0} con errores`
      notificationType.value =
        (response.total_deleted || response.deleted_relations || 0) > 0 ? 'warning' : 'error'
    }

    // Recargar los datos para ver los cambios
    loadSyncRelations()
  } catch (error) {
    console.error('Error al eliminar las relaciones de sincronización:', error)
    showNotification.value = true
    notificationMessage.value = 'Error al eliminar las relaciones de sincronización'
    notificationType.value = 'error'
  } finally {
    deletingSelected.value = false
  }
}

// Watcher para recargar datos cuando cambia la cuenta
watch(
  () => accountStore.currentAccount?.ID,
  (newAccountId, oldAccountId) => {
    if (newAccountId !== oldAccountId) {
      loadSyncRelations()
    }
  },
)

// Watcher para depurar la selección
watch(
  publicationsSelected,
  (newSelected) => {
    console.log('Elementos seleccionados:', newSelected)
  },
  { deep: true },
)

// Función para manejar la paginación
const handlePageChange = (newPage: number) => {
  page.value = newPage
  loadSyncRelations() // Recargar los datos para la nueva página
}

// Función para manejar el cambio en el número de elementos por página
const handleItemsPerPageChange = (newItemsPerPage: number) => {
  itemsPerPage.value = newItemsPerPage
  page.value = 1 // Reiniciar a la primera página cuando cambia el número de elementos por página
  loadSyncRelations()
}

// Funciones para manejar la búsqueda
// Función para activar la búsqueda
const activateSearch = () => {
  showSearchField.value = true
  // Enfocar el campo de búsqueda después de que se muestre
  setTimeout(() => {
    if (searchInput.value) {
      const input = searchInput.value.querySelector('input')
      if (input) input.focus()
    }
  }, 100)
}

// Función para desactivar la búsqueda
const deactivateSearch = () => {
  showSearchField.value = false
}

// Función para manejar cuando se pierde el foco en el campo de búsqueda
const handleSearchBlur = () => {
  // Usar setTimeout para permitir que otros eventos (como click) se procesen primero
  setTimeout(() => {
    // Verificar si el campo de búsqueda sigue teniendo el foco
    const activeElement = document.activeElement
    const searchField = searchInput.value

    // Si el elemento activo no es el campo de búsqueda o un elemento dentro de él
    if (searchField && !searchField.contains(activeElement)) {
      // Solo desactivar si el campo está vacío
      if (!searchQuery.value) {
        deactivateSearch()
      }
    }
  }, 100)
}

// Función para manejar el cambio en la búsqueda
const handleSearchQueryChange = () => {
  // Cargar los datos cuando cambia la búsqueda
  loadSyncRelations()
}

// Función para limpiar la búsqueda
const clearSearchQuery = () => {
  searchQuery.value = ''
  loadSyncRelations()
}

// Función para manejar el ordenamiento
const handleSort = (key: string) => {
  if (dataTable.value) {
    // Intentar usar el método sort de la tabla si está disponible
    if (typeof dataTable.value.sort === 'function') {
      dataTable.value.sort(key)
    }
  }
}

// Función para verificar si una columna está ordenada
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isSorted = (column: any) => {
  // Para simplificar, asumimos que no está ordenada
  // En una implementación real, esto debería verificar el estado actual de ordenamiento
  return false
}

// Función para obtener el icono de ordenamiento
const getSortIcon = () => {
  // Usar el icono neutral de Vuetify
  return 'mdi-arrow-up-down'
}
</script>

<style scoped>
.border {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.rounded {
  border-radius: 4px;
}

.pagination-fixed {
  position: sticky;
  bottom: 0;
  z-index: 2;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.items-per-page-select :deep(.v-field__field) {
  min-height: 32px;
  height: 32px;
}

/* Estilos para el encabezado ordenable */
.sortable-header {
  cursor: pointer;
  user-select: none;
}

.sortable-header:hover {
  color: var(--v-theme-primary);
}

.sort-icon {
  opacity: 0.7;
  margin-left: 4px;
}

.visible-on-hover {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.sortable-header:hover .visible-on-hover {
  opacity: 0.7;
}

/* Estilos para la transición suave */
.header-content {
  min-height: 40px;
}

.search-field {
  width: 100%;
}

/* Ajustes para las transiciones */
.v-fade-transition-enter-active,
.v-fade-transition-leave-active {
  transition: opacity 0.3s ease;
}

.v-fade-transition-enter-from,
.v-fade-transition-leave-to {
  opacity: 0;
}

.pagination-centered {
  display: flex;
  justify-content: center;
}

/* Estilos para las filas expandidas */
.v-data-table__expanded {
  background-color: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

/* Efecto hover para los botones de expandir/contraer */
.v-btn.v-btn--icon.v-btn--density-default.v-btn--size-x-small:hover {
  opacity: 0.8;
  transform: scale(1.1);
  transition: all 0.2s ease;
}
</style>
