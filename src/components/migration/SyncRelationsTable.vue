<template>
  <div>
    <!-- Título y botones -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 text-primary font-weight-medium mb-1">Sincronizaciones</h3>
        <p class="text-caption text-grey">
          Gestiona las relaciones de sincronización entre publicaciones de diferentes cuentas.
          <span class="font-weight-medium">{{ totalPublicationsFiltered }}</span> publicaciones
          disponibles.
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
          @click="loadSyncRelations(true)"
        >
          <v-icon start>mdi-refresh</v-icon>
          Actualizar
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
          placeholder="Buscar ID o SKU..."
          class="search-field modern-search"
          prepend-inner-icon="mdi-magnify"
          clearable
          rounded
          bg-color="grey-lighten-4"
          @update:model-value="handleSearchInputChange"
          @click:clear="clearSearchField"
          @keyup.enter="loadSyncRelations"
        ></v-text-field>
      </div>

      <!-- Pills de filtros -->
      <div class="filter-pills-container d-flex flex-wrap align-center gap-0">
        <!-- Filtro de estado -->
        <v-menu location="bottom" offset-y :close-on-content-click="false">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              :color="statusFilter !== 'active' ? 'success' : 'grey-lighten-3'"
              :variant="statusFilter !== 'active' ? 'elevated' : 'flat'"
              :prepend-icon="statusFilter !== 'active' ? 'mdi-check-circle' : 'mdi-filter-variant'"
              class="filter-pill ct-border-right"
              label
            >
              <span class="text-body-2">Estado: {{ getStatusLabel(statusFilter) }}</span>
            </v-chip>
          </template>

          <v-card min-width="280" max-width="320" class="filter-menu pa-2">
            <v-card-title class="text-subtitle-2 pa-2">Estado</v-card-title>
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
                  color="success"
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

        <!-- Estado de sincronización -->
        <v-menu location="bottom" offset-y :close-on-content-click="false">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              :color="syncStatusFilter !== 'all' ? 'primary' : 'grey-lighten-3'"
              :variant="syncStatusFilter !== 'all' ? 'elevated' : 'flat'"
              :prepend-icon="syncStatusFilter !== 'all' ? 'mdi-check-circle' : 'mdi-sync'"
              class="filter-pill"
              label
            >
              <span class="text-body-2"
                >Sincronizaciones: {{ getSyncStatusLabel(syncStatusFilter) }}</span
              >
            </v-chip>
          </template>

          <v-card min-width="280" max-width="320" class="filter-menu pa-2">
            <v-card-title class="text-subtitle-2 pa-2">Estado de Sincronización</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-2">
              <v-radio-group
                v-model="syncStatusFilter"
                @update:model-value="handleSyncStatusFilterChange"
                hide-details
                density="compact"
              >
                <v-radio
                  v-for="option in syncStatusOptions"
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
              <v-btn variant="text" color="primary" size="small" @click="resetSyncStatusFilter">
                Restablecer
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Cantidad de sincronizaciones -->
        <v-menu location="bottom" offset-y :close-on-content-click="false">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              :color="syncCountFilter !== 'all' ? 'primary' : 'grey-lighten-3'"
              :variant="syncCountFilter !== 'all' ? 'elevated' : 'flat'"
              :prepend-icon="syncCountFilter !== 'all' ? 'mdi-check-circle' : 'mdi-counter'"
              class="filter-pill"
              label
            >
              <span class="text-body-2">Cantidad: {{ getSyncCountLabel(syncCountFilter) }}</span>
            </v-chip>
          </template>

          <v-card min-width="280" max-width="320" class="filter-menu pa-2">
            <v-card-title class="text-subtitle-2 pa-2">Cantidad de Sincronizaciones</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-2">
              <v-radio-group
                v-model="syncCountFilter"
                @update:model-value="handleSyncCountFilterChange"
                hide-details
                density="compact"
              >
                <v-radio
                  v-for="option in syncCountOptions"
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
              <v-btn variant="text" color="primary" size="small" @click="resetSyncCountFilter">
                Restablecer
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Filtro de catálogo -->
        <v-menu location="bottom" offset-y :close-on-content-click="false">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              :color="catalogFilter !== 'all' ? 'purple' : 'grey-lighten-3'"
              :variant="catalogFilter !== 'all' ? 'elevated' : 'flat'"
              :prepend-icon="catalogFilter !== 'all' ? 'mdi-check-circle' : 'mdi-book-open-variant'"
              class="filter-pill"
              label
            >
              <span class="text-body-2">Catálogo: {{ getCatalogLabel(catalogFilter) }}</span>
            </v-chip>
          </template>

          <v-card min-width="280" max-width="320" class="filter-menu pa-2">
            <v-card-title class="text-subtitle-2 pa-2">Catálogo</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-2">
              <v-radio-group
                v-model="catalogFilter"
                @update:model-value="handleCatalogFilterChange"
                hide-details
                density="compact"
              >
                <v-radio
                  v-for="option in catalogOptions"
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
              <v-btn variant="text" color="primary" size="small" @click="resetCatalogFilter">
                Restablecer
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Chip de resultados -->
        <v-chip
          v-if="totalRelations > 0"
          :color="hasFilters ? 'info-lighten-4' : 'grey-lighten-4'"
          variant="flat"
          :prepend-icon="hasFilters ? 'mdi-filter' : 'mdi-information'"
          class="filter-pill ms-auto"
          label
        >
          <span class="text-body-2">{{ totalPublicationsFiltered }} registros encontrados</span>
        </v-chip>

        <!-- Botón limpiar filtros -->
        <v-btn
          v-if="hasFilters"
          color="grey-darken-1"
          variant="text"
          size="small"
          @click="resetAllFilters"
          class="filter-clear-btn"
          density="comfortable"
        >
          <v-icon start size="small">mdi-filter-remove</v-icon>
          Limpiar filtros
        </v-btn>
      </div>
    </div>

    <!-- Estadísticas -->
    <section class="mb-4">
      <v-toolbar density="compact" flat class="stats-toolbar px-0">
        <v-toolbar-title class="text-subtitle-1 font-weight-medium">Estadísticas</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn size="small" variant="text" color="primary" @click="showStats = !showStats">
          <v-icon size="small" class="mr-1">
            {{ showStats ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
          </v-icon>
          {{ showStats ? 'Ocultar' : 'Mostrar' }}
        </v-btn>
      </v-toolbar>

      <v-expand-transition>
        <v-container v-if="showStats" fluid class="stats-columns pa-0">
          <v-row dense class="ma-0" align="stretch">
            <v-col cols="12" md="3" class="pa-0 pr-md-3 mb-3 mb-md-0">
              <v-list density="compact" lines="one" class="stats-column">
                <v-list-subheader class="text-caption text-uppercase"
                  >Resumen general</v-list-subheader
                >
                <v-list-item>
                  <v-list-item-title class="stats-label">Publicaciones filtradas</v-list-item-title>
                  <template #append>
                    <v-chip color="primary" variant="flat" class="font-weight-medium">
                      {{ totalPublicationsFiltered }} / {{ totalPublicationsAll }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" md="3" class="pa-0 px-md-3 mb-3 mb-md-0">
              <v-list density="compact" lines="one" class="stats-column">
                <v-list-subheader class="text-caption text-uppercase"
                  >Estado de sincronización</v-list-subheader
                >
                <v-list-item>
                  <v-list-item-title class="stats-label">Origen</v-list-item-title>
                  <template #append>
                    <v-chip color="primary" variant="elevated" class="font-weight-medium">
                      {{ statsCounters.origin }}
                    </v-chip>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="stats-label">Destino</v-list-item-title>
                  <template #append>
                    <v-chip color="success" variant="elevated" class="font-weight-medium">
                      {{ statsCounters.destination }}
                    </v-chip>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="stats-label">Ambos</v-list-item-title>
                  <template #append>
                    <v-chip color="purple" variant="elevated" class="font-weight-medium">
                      {{ statsCounters.both }}
                    </v-chip>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="stats-label">Ninguno</v-list-item-title>
                  <template #append>
                    <v-chip color="grey" variant="elevated" class="font-weight-medium">
                      {{ statsCounters.none }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" md="3" class="pa-0 px-md-3 mb-3 mb-md-0">
              <v-list density="compact" lines="one" class="stats-column">
                <v-list-subheader class="text-caption text-uppercase"
                  >Tipo de publicación</v-list-subheader
                >
                <v-list-item>
                  <v-list-item-title class="stats-label">Catálogo</v-list-item-title>
                  <template #append>
                    <v-chip color="secondary" variant="elevated" class="font-weight-medium">
                      {{ statsCounters.catalog }}
                    </v-chip>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="stats-label">Estándar</v-list-item-title>
                  <template #append>
                    <v-chip color="indigo" variant="elevated" class="font-weight-medium">
                      {{ statsCounters.nonCatalog }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" md="3" class="pa-0 pl-md-3">
              <v-list density="compact" lines="one" class="stats-column">
                <v-list-subheader class="text-caption text-uppercase"
                  >Estado de publicación</v-list-subheader
                >
                <v-list-item>
                  <v-list-item-title class="stats-label">Activo</v-list-item-title>
                  <template #append>
                    <v-chip color="success" variant="elevated" class="font-weight-medium">
                      {{ statsCounters.active }}
                    </v-chip>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="stats-label">Pausado</v-list-item-title>
                  <template #append>
                    <v-chip color="warning" variant="elevated" class="font-weight-medium">
                      {{ statsCounters.paused }}
                    </v-chip>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="stats-label">Cerrado</v-list-item-title>
                  <template #append>
                    <v-chip color="error" variant="elevated" class="font-weight-medium">
                      {{ statsCounters.closed }}
                    </v-chip>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="stats-label">Otros</v-list-item-title>
                  <template #append>
                    <v-chip color="grey" variant="elevated" class="font-weight-medium">
                      {{ statsCounters.otherStatus }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-container>
      </v-expand-transition>
    </section>

    <!-- Tabla de publicaciones -->
    <v-card variant="flat">
      <v-data-table-virtual
        ref="dataTable"
        v-model:expanded="expanded"
        v-model="publicationsSelected"
        :headers="headers"
        :items="publicationsShow"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :page="page"
        :height="tableHeight"
        :item-height="virtualRowHeight"
        :bench="virtualScrollBench"
        :get-row-height="getRowHeight"
        :item-transition="virtualScrollItemTransition"
        :expand-transition="expandTransition"
        @update:items-per-page="handleItemsPerPageChange"
        item-value="publication_id"
        density="comfortable"
        hover
        show-select
        class="elevation-0"
        :server-items-length="totalPublicationsFiltered"
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
          <div class="d-flex align-center justify-space-between">
            <!-- ID de la publicación -->
            <div class="d-flex align-center">
              <span>{{ slotProps.item.publication_id }}</span>
            </div>

            <!-- Botones de acción -->
            <div class="d-flex align-center">
              <!-- Botón Ver detalles -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="x-small"
                    icon
                    variant="text"
                    color="primary"
                    @click="viewProductDetails(slotProps.item.publication_id)"
                  >
                    <v-icon size="small">mdi-eye</v-icon>
                  </v-btn>
                </template>
                <span>Ver detalles</span>
              </v-tooltip>

              <!-- Botón Ver en Mercado Libre -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="x-small"
                    icon
                    variant="text"
                    color="primary"
                    @click="openInMercadoLibre(slotProps.item.publication_id)"
                    class="ml-1"
                  >
                    <v-icon size="small">mdi-open-in-new</v-icon>
                  </v-btn>
                </template>
                <span>Ver en Mercado Libre</span>
              </v-tooltip>
            </div>
          </div>
        </template>

        <!-- Columna de Sincronizaciones Salientes -->
        <template #[`item.outgoing_syncs`]="slotProps">
          <div class="d-flex align-center justify-space-between">
            <!-- Lado izquierdo: contador, botón de agregar y ID -->
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

              <!-- Botón para agregar sincronización saliente -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="x-small"
                    icon
                    variant="text"
                    color="success"
                    @click="openAddSyncDialog(slotProps.item.publication_id, 'outgoing')"
                    class="mr-2"
                  >
                    <v-icon size="small">mdi-arrow-right-bold-box-outline</v-icon>
                  </v-btn>
                </template>
                <span>Agregar sincronización saliente</span>
              </v-tooltip>

              <!-- Cuando hay exactamente una sincronización, mostrar el ID directamente -->
              <div v-if="slotProps.item.to_syncs.length === 1" class="d-flex align-center">
                <span class="text-caption text-truncate" style="max-width: 150px">
                  {{ slotProps.item.to_syncs[0].to_sync_id }}
                </span>
              </div>
            </div>

            <!-- Lado derecho: botones alineados a la derecha -->
            <div class="d-flex align-center">
              <!-- Botón para expandir/contraer, mostrar siempre que haya al menos una sincronización -->
              <v-tooltip v-if="slotProps.item.to_syncs.length > 0" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="x-small"
                    icon
                    variant="text"
                    :color="
                      expanded.includes(slotProps.item.publication_id) ? 'warning' : 'primary'
                    "
                    @click.stop="toggleExpanded(slotProps.item.publication_id)"
                    class="ml-1"
                  >
                    <v-icon size="small">
                      {{
                        expanded.includes(slotProps.item.publication_id)
                          ? 'mdi-chevron-up'
                          : 'mdi-chevron-down'
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

              <!-- Botón para sincronizar todas las relaciones salientes -->
              <v-tooltip v-if="slotProps.item.to_syncs.length > 0" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="x-small"
                    icon
                    variant="elevated"
                    color="warning"
                    :loading="syncingItem === `${slotProps.item.publication_id}-outgoing-all`"
                    @click.stop="syncAllRelations(slotProps.item.publication_id, 'outgoing')"
                    class="ml-1"
                  >
                    <v-icon size="small">mdi-sync</v-icon>
                  </v-btn>
                </template>
                <span>Sincronizar todas las relaciones salientes</span>
              </v-tooltip>
            </div>
          </div>
        </template>

        <!-- Columna de Sincronizaciones Entrantes -->
        <template #[`item.incoming_syncs`]="slotProps">
          <div class="d-flex align-center justify-space-between">
            <!-- Lado izquierdo: contador, botón de agregar y ID -->
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

              <!-- Botón para agregar sincronización entrante -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="x-small"
                    icon
                    variant="text"
                    color="info"
                    @click="openAddSyncDialog(slotProps.item.publication_id, 'incoming')"
                    class="mr-2"
                  >
                    <v-icon size="small">mdi-arrow-left-bold-box-outline</v-icon>
                  </v-btn>
                </template>
                <span>Agregar sincronización entrante</span>
              </v-tooltip>

              <!-- Cuando hay exactamente una sincronización, mostrar el ID directamente -->
              <div v-if="slotProps.item.from_syncs.length === 1" class="d-flex align-center">
                <span class="text-caption text-truncate" style="max-width: 150px">
                  {{ slotProps.item.from_syncs[0].from_publication_id }}
                </span>
              </div>
            </div>

            <!-- Lado derecho: botones alineados a la derecha -->
            <div class="d-flex align-center">
              <!-- Botón para expandir/contraer, mostrar siempre que haya al menos una sincronización -->
              <v-tooltip v-if="slotProps.item.from_syncs.length > 0" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="x-small"
                    icon
                    variant="text"
                    :color="
                      expanded.includes(slotProps.item.publication_id) ? 'warning' : 'success'
                    "
                    @click.stop="toggleExpanded(slotProps.item.publication_id)"
                    class="ml-1"
                  >
                    <v-icon size="small">
                      {{
                        expanded.includes(slotProps.item.publication_id)
                          ? 'mdi-chevron-up'
                          : 'mdi-chevron-down'
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

              <!-- Botón para sincronizar todas las relaciones entrantes -->
              <v-tooltip v-if="slotProps.item.from_syncs.length > 0" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="x-small"
                    icon
                    variant="elevated"
                    color="warning"
                    :loading="syncingItem === `${slotProps.item.publication_id}-incoming-all`"
                    @click.stop="syncAllRelations(slotProps.item.publication_id, 'incoming')"
                    class="ml-1"
                  >
                    <v-icon size="small">mdi-sync</v-icon>
                  </v-btn>
                </template>
                <span>Sincronizar todas las relaciones entrantes</span>
              </v-tooltip>
            </div>
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
          <v-chip
            :color="getStatusColor(slotProps.item.status_ml)"
            size="small"
            class="text-capitalize"
          >
            {{ slotProps.item.status_ml || 'unknown' }}
          </v-chip>
        </template>

        <!-- Columna de Catálogo -->
        <template #[`item.catalog`]="slotProps">
          <v-chip :color="slotProps.item.catalog_active ? 'success' : 'error'" size="small">
            {{ slotProps.item.catalog_active ? 'Sí' : 'No' }}
          </v-chip>
        </template>

        <!-- La columna de Acciones ha sido eliminada y sus botones movidos a las columnas de sincronizaciones -->

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
                          <th>Estado</th>
                          <th></th>
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
                            <v-chip size="small" color="primary">
                              {{ getAccountName(sync.to_account_id) }}
                            </v-chip>
                          </td>
                          <td>
                            <v-chip
                              :color="getStatusColor(sync.status_ml)"
                              size="small"
                              class="text-capitalize"
                            >
                              {{ sync.status_ml || 'unknown' }}
                            </v-chip>
                          </td>
                          <td>
                            <div class="d-flex align-center">
                              <!-- Menú único con todas las acciones -->
                              <v-menu location="bottom">
                                <template v-slot:activator="{ props }">
                                  <v-btn
                                    v-bind="props"
                                    size="x-small"
                                    icon
                                    variant="text"
                                    color="primary"
                                    class="ml-1"
                                    :loading="
                                      syncingItem ===
                                        `${slotProps.item.publication_id}-${sync.to_sync_id}` ||
                                      syncingItem ===
                                        `${slotProps.item.publication_id}-${sync.to_sync_id}-delete`
                                    "
                                  >
                                    <v-icon size="small">mdi-dots-vertical</v-icon>
                                  </v-btn>
                                </template>

                                <v-list density="compact" nav>
                                  <!-- Acciones de visualización -->
                                  <v-list-item @click="viewProductDetails(sync.to_sync_id)">
                                    <template v-slot:prepend>
                                      <v-icon color="primary" size="small">mdi-eye</v-icon>
                                    </template>
                                    <v-list-item-title class="text-caption"
                                      >Ver detalles</v-list-item-title
                                    >
                                  </v-list-item>

                                  <v-list-item @click="openInMercadoLibre(sync.to_sync_id)">
                                    <template v-slot:prepend>
                                      <v-icon color="primary" size="small">mdi-open-in-new</v-icon>
                                    </template>
                                    <v-list-item-title class="text-caption"
                                      >Ver en Mercado Libre</v-list-item-title
                                    >
                                  </v-list-item>

                                  <v-divider class="my-1"></v-divider>

                                  <!-- Acciones de sincronización -->
                                  <v-list-item
                                    @click="
                                      syncRelation(
                                        slotProps.item.publication_id,
                                        sync.to_sync_id,
                                        'outgoing',
                                      )
                                    "
                                    :disabled="
                                      syncingItem ===
                                      `${slotProps.item.publication_id}-${sync.to_sync_id}`
                                    "
                                  >
                                    <template v-slot:prepend>
                                      <v-icon color="warning" size="small">mdi-sync</v-icon>
                                    </template>
                                    <v-list-item-title class="text-caption"
                                      >Sincronizar</v-list-item-title
                                    >
                                  </v-list-item>

                                  <v-list-item
                                    @click="
                                      deleteSyncRelation(
                                        slotProps.item.publication_id,
                                        sync.to_sync_id,
                                        'outgoing',
                                      )
                                    "
                                    :disabled="
                                      syncingItem ===
                                      `${slotProps.item.publication_id}-${sync.to_sync_id}-delete`
                                    "
                                  >
                                    <template v-slot:prepend>
                                      <v-icon color="error" size="small"
                                        >mdi-link-variant-remove</v-icon
                                      >
                                    </template>
                                    <v-list-item-title class="text-caption"
                                      >Eliminar relación</v-list-item-title
                                    >
                                  </v-list-item>
                                </v-list>
                              </v-menu>
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
                          <th>Estado</th>
                          <th></th>
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
                            <v-chip size="small" color="success">
                              {{ getAccountName(sync.from_account_id) }}
                            </v-chip>
                          </td>
                          <td>
                            <v-chip
                              :color="getStatusColor(sync.status_ml)"
                              size="small"
                              class="text-capitalize"
                            >
                              {{ sync.status_ml || 'unknown' }}
                            </v-chip>
                          </td>
                          <td>
                            <div class="d-flex align-center">
                              <!-- Menú único con todas las acciones -->
                              <v-menu location="bottom">
                                <template v-slot:activator="{ props }">
                                  <v-btn
                                    v-bind="props"
                                    size="x-small"
                                    icon
                                    variant="text"
                                    color="success"
                                    class="ml-1"
                                    :loading="
                                      syncingItem ===
                                        `${sync.from_publication_id}-${slotProps.item.publication_id}` ||
                                      syncingItem ===
                                        `${sync.from_publication_id}-${slotProps.item.publication_id}-delete`
                                    "
                                  >
                                    <v-icon size="small">mdi-dots-vertical</v-icon>
                                  </v-btn>
                                </template>

                                <v-list density="compact" nav>
                                  <!-- Acciones de visualización -->
                                  <v-list-item
                                    @click="viewProductDetails(sync.from_publication_id)"
                                  >
                                    <template v-slot:prepend>
                                      <v-icon color="success" size="small">mdi-eye</v-icon>
                                    </template>
                                    <v-list-item-title class="text-caption"
                                      >Ver detalles</v-list-item-title
                                    >
                                  </v-list-item>

                                  <v-list-item
                                    @click="openInMercadoLibre(sync.from_publication_id)"
                                  >
                                    <template v-slot:prepend>
                                      <v-icon color="success" size="small">mdi-open-in-new</v-icon>
                                    </template>
                                    <v-list-item-title class="text-caption"
                                      >Ver en Mercado Libre</v-list-item-title
                                    >
                                  </v-list-item>

                                  <v-divider class="my-1"></v-divider>

                                  <!-- Acciones de sincronización -->
                                  <v-list-item
                                    @click="
                                      syncRelation(
                                        sync.from_publication_id,
                                        slotProps.item.publication_id,
                                        'incoming',
                                      )
                                    "
                                    :disabled="
                                      syncingItem ===
                                      `${sync.from_publication_id}-${slotProps.item.publication_id}`
                                    "
                                  >
                                    <template v-slot:prepend>
                                      <v-icon color="warning" size="small">mdi-sync</v-icon>
                                    </template>
                                    <v-list-item-title class="text-caption"
                                      >Sincronizar</v-list-item-title
                                    >
                                  </v-list-item>

                                  <v-list-item
                                    @click="
                                      deleteSyncRelation(
                                        sync.from_publication_id,
                                        slotProps.item.publication_id,
                                        'incoming',
                                      )
                                    "
                                    :disabled="
                                      syncingItem ===
                                      `${sync.from_publication_id}-${slotProps.item.publication_id}-delete`
                                    "
                                  >
                                    <template v-slot:prepend>
                                      <v-icon color="error" size="small"
                                        >mdi-link-variant-remove</v-icon
                                      >
                                    </template>
                                    <v-list-item-title class="text-caption"
                                      >Eliminar relación</v-list-item-title
                                    >
                                  </v-list-item>
                                </v-list>
                              </v-menu>
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
      </v-data-table-virtual>
    </v-card>

    <!-- Snackbar para notificaciones -->
    <v-snackbar
      v-model="showNotification"
      :color="notificationType"
      :timeout="notificationType === 'error' ? 6000 : 3000"
      multi-line
      class="error-snackbar"
    >
      <div v-html="notificationMessage"></div>
      <template #actions>
        <v-btn variant="text" icon="mdi-close" @click="showNotification = false"></v-btn>
      </template>
    </v-snackbar>

    <!-- Overlay con indicador de progreso y resultados -->
    <v-overlay
      v-model="showProgressOverlay"
      class="align-center justify-center"
      persistent
      :scrim="true"
      scrim-class="bg-primary"
      :opacity="0.8"
    >
      <v-card class="pa-4 rounded-xl" min-width="600" max-width="800" elevation="10">
        <v-card-title class="d-flex align-center pb-1">
          <v-icon
            :icon="
              syncComplete ? (syncHasErrors ? 'mdi-alert-circle' : 'mdi-check-circle') : 'mdi-sync'
            "
            :class="{ 'mr-2 rotating-icon': !syncComplete, 'mr-2': syncComplete }"
            :color="syncComplete ? (syncHasErrors ? 'error' : 'success') : 'primary'"
            size="small"
          ></v-icon>
          <span class="text-h6">
            {{
              syncComplete
                ? syncHasErrors
                  ? 'Sincronización con errores'
                  : 'Sincronización completada'
                : 'Sincronizando'
            }}
          </span>

          <!-- Botón de cerrar solo visible cuando se completa la sincronización -->
          <v-spacer></v-spacer>
          <v-btn
            v-if="syncComplete"
            icon="mdi-close"
            variant="text"
            density="compact"
            @click="showProgressOverlay = false"
          ></v-btn>
        </v-card-title>

        <v-card-text class="pt-2">
          <!-- Mensaje de progreso -->
          <p class="text-body-1 mb-4">{{ progressMessage }}</p>

          <!-- Barra de progreso -->
          <template v-if="!syncComplete">
            <div class="d-flex align-center mb-1">
              <span class="text-caption text-medium-emphasis">Progreso:</span>
              <span class="ml-auto font-weight-bold">{{ Math.round(progressValue * 100) }}%</span>
            </div>

            <v-progress-linear
              v-model="progressValue"
              color="primary"
              height="12"
              :buffer-value="0"
              striped
              rounded
            ></v-progress-linear>

            <p class="text-caption text-medium-emphasis mt-3 text-center">
              Por favor, espere mientras se completa el proceso...
            </p>
          </template>

          <!-- Resultados cuando se completa la sincronización -->
          <template v-else>
            <v-alert
              v-if="syncSuccessCount > 0"
              type="success"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              <strong>{{ syncSuccessCount }}</strong> relaciones sincronizadas correctamente
            </v-alert>

            <v-alert
              v-if="syncErrorCount > 0"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              <strong>{{ syncErrorCount }}</strong> relaciones fallaron

              <!-- Mostrar los detalles de los errores en una tabla con paginación -->
              <div v-if="syncErrorMessages.length > 0" class="mt-3">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="font-weight-medium">Detalles de los errores:</div>
                  <div class="d-flex align-center">
                    <v-btn
                      size="small"
                      variant="text"
                      color="primary"
                      prepend-icon="mdi-content-copy"
                      @click="copyAllErrorsToClipboard"
                      class="mr-2"
                    >
                      Copiar todos
                    </v-btn>
                    <v-chip size="small" color="error" variant="outlined"
                      >{{ syncErrorMessages.length }} errores</v-chip
                    >
                  </div>
                </div>

                <v-data-table
                  :headers="[
                    { title: '#', key: 'index', width: '40px' },
                    { title: 'ID Origen', key: 'sourceId', width: '120px' },
                    { title: 'ID Destino', key: 'targetId', width: '120px' },
                    { title: 'Resumen', key: 'summary' },
                    { title: 'Acciones', key: 'actions', width: '80px', sortable: false },
                  ]"
                  :items="
                    syncErrorMessages.map((msg, idx) => {
                      const { sourceId, targetId } = extractErrorIds(msg)
                      return {
                        index: idx + 1,
                        message: msg,
                        sourceId,
                        targetId,
                        summary: extractErrorSummary(msg),
                      }
                    })
                  "
                  :items-per-page="10"
                  :items-per-page-options="[5, 10, 20, 50, -1]"
                  density="compact"
                  hover
                  class="error-table text-caption"
                >
                  <template #[`item.actions`]="{ item }">
                    <v-btn
                      size="x-small"
                      icon
                      variant="text"
                      color="primary"
                      @click="
                        () => {
                          selectedError = item.message
                          showErrorDialog = true
                        }
                      "
                    >
                      <v-icon size="small">mdi-eye</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>

                <!-- Diálogo para mostrar detalles completos del error -->
                <v-dialog
                  v-model="showErrorDialog"
                  max-width="700"
                  content-class="elevation-0"
                  scrollable
                >
                  <v-card class="rounded-lg" elevation="3">
                    <v-card-title class="text-subtitle-1 pa-4 pb-0 d-flex align-center">
                      <v-icon
                        start
                        icon="mdi-alert-circle"
                        color="error"
                        size="small"
                        class="mr-2"
                      ></v-icon>
                      <span>Detalle del error</span>
                      <v-spacer></v-spacer>
                      <v-btn
                        icon="mdi-content-copy"
                        variant="text"
                        density="compact"
                        size="small"
                        color="grey-darken-1"
                        @click="copyErrorToClipboard(selectedError)"
                      >
                      </v-btn>
                      <v-btn
                        icon="mdi-close"
                        variant="text"
                        density="compact"
                        size="small"
                        color="grey-darken-1"
                        @click="showErrorDialog = false"
                      >
                      </v-btn>
                    </v-card-title>
                    <v-card-text class="pa-4">
                      <div class="d-flex flex-column">
                        <!-- Resumen del error -->
                        <v-alert
                          type="error"
                          class="mb-4"
                          density="compact"
                          variant="tonal"
                          border="start"
                        >
                          {{
                            typeof selectedError === 'string'
                              ? extractErrorSummary(selectedError)
                              : extractErrorSummary(selectedError)
                          }}
                        </v-alert>

                        <!-- Detalles completos del error -->
                        <div class="mt-2">
                          <p class="text-caption text-medium-emphasis mb-1">Detalles completos:</p>
                          <pre
                            class="error-details pa-3 rounded bg-grey-lighten-5 overflow-x-auto text-caption"
                            style="max-height: 350px; font-size: 11px !important"
                            >{{ formatErrorDetails(selectedError) }}</pre
                          >
                        </div>
                      </div>
                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions class="pa-3">
                      <v-spacer></v-spacer>
                      <v-btn
                        color="grey-darken-1"
                        variant="text"
                        size="small"
                        @click="showErrorDialog = false"
                        >Cerrar</v-btn
                      >
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </div>
            </v-alert>

            <div class="d-flex justify-end mt-4">
              <v-btn color="primary" variant="text" @click="showProgressOverlay = false">
                Cerrar
              </v-btn>
            </div>
          </template>
        </v-card-text>
      </v-card>
    </v-overlay>

    <!-- Diálogo para agregar sincronización -->
    <v-dialog v-model="showAddSyncDialog" max-width="500" content-class="elevation-0">
      <v-card class="rounded-lg" elevation="3">
        <v-card-title class="text-subtitle-1 pa-4 pb-0">
          {{ syncDialogTitle }}
        </v-card-title>

        <v-card-text class="pa-4">
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

              <!-- El botón para crear nueva publicación se ha movido al pie del diálogo -->
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

        <v-divider></v-divider>
        <v-card-actions class="pa-3">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                color="success"
                variant="text"
                size="small"
                :disabled="!selectedAccountId"
                :loading="creatingPublication"
                @click="createNewPublication"
              >
                <v-icon size="small" class="mr-1">mdi-plus</v-icon>
                Crear y Agregar
              </v-btn>
            </template>
            <span>Crear nueva publicación</span>
          </v-tooltip>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            size="small"
            @click="showAddSyncDialog = false"
            >Cancelar</v-btn
          >
          <v-btn
            color="primary"
            variant="text"
            size="small"
            :loading="addingSyncRelation"
            :disabled="!targetPublicationId"
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
              totalPublicationsFiltered > 0
                ? `${(page - 1) * itemsPerPage + 1}-${Math.min(
                    page * itemsPerPage,
                    totalPublicationsFiltered,
                  )} de ${totalPublicationsFiltered}`
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
            :length="Math.ceil(totalPublicationsFiltered / itemsPerPage)"
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
const publicationsShow = ref<PublicationSyncData[]>([])
const totalPublicationsAll = ref(0)
const totalPublicationsFiltered = ref(0)
const filteredPublicationsAll = ref(0)
const expanded = ref<string[]>([])
const showStats = ref(true)

// Estado para notificaciones
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'warning'>('success')

// Estado para el indicador de progreso
const showProgressOverlay = ref(false)
const progressMessage = ref('')
const progressValue = ref(0)
const syncComplete = ref(false)
const syncHasErrors = ref(false)
const syncSuccessCount = ref(0)
const syncErrorCount = ref(0)
const syncErrorMessages = ref<string[]>([])

// Estado para el diálogo de detalles de error
const showErrorDialog = ref(false)
const selectedError = ref<string | Record<string, unknown>>('')

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
const itemsPerPage = ref(25)
const itemsPerPageOptions = [10, 25, 50, 100, 250, 500, 1000]

// Filtros
const searchQuery = ref('')
const syncStatusFilter = ref('all')
const syncCountFilter = ref('all')
const catalogFilter = ref('all')
const statusFilter = ref<'all' | 'active' | 'paused' | 'closed' | 'other'>('active')

// Estado para el campo de búsqueda
const showSearchField = ref(false)
const searchInput = ref<HTMLElement | null>(null)
const dataTable = ref<any>(null)

// Configuración de virtual scroll
const tableHeight = 500 // Altura fija para el contenedor de la tabla
const virtualRowHeight = 56 // Altura estándar de una fila (density: comfortable) 56
const expandedRowAdditionalHeight = 100 // Altura adicional cuando una fila está expandida
const virtualScrollBench = 20 // Número de filas adicionales a renderizar fuera de la vista (buffer)

// Opciones de transición para animaciones más suaves
const virtualScrollItemTransition = 'scroll-y-transition'
const expandTransition = 'expand-transition'

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

// Funciones auxiliares para etiquetas
const getSyncStatusLabel = (value: string): string => {
  const option = syncStatusOptions.find((opt) => opt.value === value)
  return option ? option.title : 'Todos'
}

const getSyncCountLabel = (value: string): string => {
  const option = syncCountOptions.find((opt) => opt.value === value)
  return option ? option.title : 'Todos'
}

const getCatalogLabel = (value: string): string => {
  const option = catalogOptions.find((opt) => opt.value === value)
  return option ? option.title : 'Todos'
}

const getStatusLabel = (value: string): string => {
  const option = statusOptions.find((opt) => opt.value === value)
  return option ? option.title : 'Todos'
}

// Funciones para manejo de búsqueda
const handleSearchInputChange = () => {
  page.value = 1
  loadSyncRelations()
}

// Función para limpiar el campo de búsqueda
const clearSearchField = () => {
  searchQuery.value = ''
  loadSyncRelations()
}

const resetAllFilters = () => {
  syncStatusFilter.value = 'all'
  syncCountFilter.value = 'all'
  catalogFilter.value = 'all'
  statusFilter.value = 'active'
  searchQuery.value = ''
  loadSyncRelations()
}

// Propiedades computadas para los filtros
const hasFilters = computed(() => {
  return (
    syncStatusFilter.value !== 'all' ||
    syncCountFilter.value !== 'all' ||
    catalogFilter.value !== 'all' ||
    statusFilter.value !== 'active' ||
    searchQuery.value !== ''
  )
})

// Total de relaciones para mostrar en el contador
const totalRelations = computed(() => {
  return allPublications.value.reduce((acc, pub) => acc + (pub.to_syncs?.length || 0), 0)
})

// Encabezados de la tabla
const headers = [
  { title: 'ID', key: 'publication_id', sortable: true },
  { title: 'Sincr. Salientes', key: 'outgoing_syncs', sortable: true },
  { title: 'Sincr. Entrantes', key: 'incoming_syncs', sortable: true },
  { title: 'Estado Sincr.', key: 'sync_status', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Catálogo', key: 'catalog', sortable: true },
  // La columna de Acciones ha sido eliminada y sus botones movidos a las columnas de sincronizaciones
]

// Ya no necesitamos la función filteredPublications computada
// porque ahora aplicamos los filtros directamente en loadSyncRelations

interface StatsCounters {
  origin: number
  destination: number
  both: number
  none: number
  catalog: number
  nonCatalog: number
  active: number
  paused: number
  closed: number
  otherStatus: number
}

const statsCounters = computed<StatsCounters>(() => {
  const counters: StatsCounters = {
    origin: 0,
    destination: 0,
    both: 0,
    none: 0,
    catalog: 0,
    nonCatalog: 0,
    active: 0,
    paused: 0,
    closed: 0,
    otherStatus: 0,
  }

  allPublications.value.forEach((item) => {
    const hasOutgoing = item.to_syncs.length > 0
    const hasIncoming = item.from_syncs.length > 0

    if (hasOutgoing && hasIncoming) {
      counters.both += 1
    } else if (hasOutgoing) {
      counters.origin += 1
    } else if (hasIncoming) {
      counters.destination += 1
    } else {
      counters.none += 1
    }

    if (item.catalog_active === true) {
      counters.catalog += 1
    } else {
      counters.nonCatalog += 1
    }

    const status = (item.status_ml ?? item.status)?.toLowerCase()
    if (!status) {
      return
    }

    if (status === 'active') {
      counters.active += 1
    } else if (status === 'paused') {
      counters.paused += 1
    } else if (status === 'closed') {
      counters.closed += 1
    } else {
      counters.otherStatus += 1
    }
  })

  return counters
})

interface DataTableVirtualItem {
  type: string
  raw?: PublicationSyncData
}

const getRowHeight = (item: DataTableVirtualItem) => {
  // Para encabezados, pies de página, etc.
  if (item.type !== 'item') {
    return virtualRowHeight
  }

  const publicationId = item.raw?.publication_id
  if (!publicationId) {
    return virtualRowHeight
  }

  if (expanded.value.includes(publicationId)) {
    return virtualRowHeight + expandedRowAdditionalHeight
  }

  return virtualRowHeight
}

// No se necesitan datos para el gráfico ya que se ha eliminado

// Variable para almacenar todas las publicaciones (para estadísticas)
const allPublications = ref<PublicationSyncData[]>([])
const hasLoadedPublications = ref(false)

// Métodos
const loadSyncRelations = async (forceReload?: boolean) => {
  const accountId = accountStore.currentAccount?.ID
  if (!accountId) {
    showNotification.value = true
    notificationMessage.value = 'Selecciona una cuenta primero'
    notificationType.value = 'warning'
    return
  }

  const shouldForceReload = forceReload === true
  const shouldFetchFromApi = shouldForceReload || !hasLoadedPublications.value

  if (shouldFetchFromApi) {
    loading.value = true
  }

  try {
    let publicationsData: PublicationSyncData[] = allPublications.value

    if (shouldFetchFromApi) {
      // Obtener las estadísticas de sincronización que ya incluyen status_ml
      const syncResponse = await migrationService.getSyncStats(accountId)

      // Guardar todas las publicaciones para estadísticas
      publicationsData = syncResponse.publications || []
      allPublications.value = publicationsData
      hasLoadedPublications.value = true
    }

    const query = searchQuery.value ? searchQuery.value.toLowerCase() : null
    const syncStatus = syncStatusFilter.value
    const syncCount = syncCountFilter.value
    const catalog = catalogFilter.value
    const statusFilterValue = statusFilter.value
    totalPublicationsAll.value = publicationsData.length

    const filteredPublications: PublicationSyncData[] = []

    publicationsData.forEach((item) => {
      if (query && !item.publication_id.toLowerCase().includes(query)) {
        return
      }

      const hasOutgoing = item.to_syncs.length > 0
      const hasIncoming = item.from_syncs.length > 0

      if (syncStatus !== 'all') {
        const matchesStatusFilter =
          (syncStatus === 'origin' && hasOutgoing && !hasIncoming) ||
          (syncStatus === 'destination' && !hasOutgoing && hasIncoming) ||
          (syncStatus === 'both' && hasOutgoing && hasIncoming) ||
          (syncStatus === 'none' && !hasOutgoing && !hasIncoming)

        if (!matchesStatusFilter) {
          return
        }
      }

      if (syncCount !== 'all') {
        const totalSyncs = item.to_syncs.length + item.from_syncs.length
        const matchesSyncCount =
          (syncCount === 'none' && totalSyncs === 0) ||
          (syncCount === 'few' && totalSyncs >= 1 && totalSyncs <= 5) ||
          (syncCount === 'medium' && totalSyncs >= 6 && totalSyncs <= 10) ||
          (syncCount === 'many' && totalSyncs > 10)

        if (!matchesSyncCount) {
          return
        }
      }

      if (catalog !== 'all') {
        const isCatalog = item.catalog_active === true
        const matchesCatalogFilter =
          (catalog === 'yes' && isCatalog) || (catalog === 'no' && !isCatalog)

        if (!matchesCatalogFilter) {
          return
        }
      }

      if (statusFilterValue !== 'all') {
        const status = item.status_ml?.toLowerCase()
        if (!status) {
          return
        }

        const matchesStatus =
          (statusFilterValue === 'active' && status === 'active') ||
          (statusFilterValue === 'paused' && status === 'paused') ||
          (statusFilterValue === 'closed' && status === 'closed') ||
          (statusFilterValue === 'other' && !['active', 'paused', 'closed'].includes(status))

        if (!matchesStatus) {
          return
        }
      }

      filteredPublications.push(item)
    })

    // Actualizar las métricas de publicaciones filtradas
    totalPublicationsFiltered.value = filteredPublications.length
    filteredPublicationsAll.value = filteredPublications.length

    // Aplicar paginación
    const offset = (page.value - 1) * itemsPerPage.value
    const limit = itemsPerPage.value
    const paginatedPublications = filteredPublications.slice(offset, offset + limit)

    // Actualizar el estado
    publicationsShow.value = paginatedPublications
  } catch (error) {
    console.error('Error al cargar las sincronizaciones:', error)
    showNotification.value = true
    notificationMessage.value = 'Error al cargar las sincronizaciones'
    notificationType.value = 'error'
    publicationsShow.value = []
    allPublications.value = []
    filteredPublicationsAll.value = 0
    totalPublicationsFiltered.value = 0
    hasLoadedPublications.value = false
  } finally {
    if (shouldFetchFromApi) {
      loading.value = false
    }
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
    case 'inactive':
      return 'grey-darken-1'
    default:
      return 'grey'
  }
}

// La función getStatusText ha sido eliminada para mostrar directamente el valor de status_ml

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
      title: product.ID, // Ya no tenemos acceso al título, usamos el ID como título
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
      await loadSyncRelations(true)
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

    // Log para depurar la respuesta
    console.log('Respuesta de publishProduct:', response)

    // Verificar si la respuesta contiene un ID, lo que indica éxito
    // La API devuelve el ID como response.ID
    const publicationId = response.ID

    if (publicationId) {
      // Recargar las publicaciones de la cuenta para obtener la nueva publicación
      await loadPublicationsForAccount(selectedAccountId.value)

      // Esperar un momento para asegurarnos de que la lista se ha actualizado
      // y la nueva publicación está disponible
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Buscar la nueva publicación en la lista actualizada
      const newPublication = accountPublications.value.find((p) => p.id === publicationId)

      console.log('Buscando publicación con ID:', publicationId)
      console.log(
        'Publicaciones disponibles:',
        accountPublications.value.map((p) => p.id),
      )

      // Seleccionar la nueva publicación si la encontramos en la lista
      if (newPublication) {
        console.log('Publicación encontrada:', newPublication)
        targetPublicationId.value = newPublication
      } else {
        console.log('No se encontró la publicación con ID:', publicationId)
      }

      // Mostrar notificación de éxito
      showNotification.value = true
      notificationMessage.value = 'Publicación creada exitosamente'
      notificationType.value = 'success'
    } else {
      // Manejar específicamente el error de catálogo
      showNotification.value = true

      // Verificar si hay un mensaje de error específico
      if (response.message) {
        if (
          response.message.includes('ErrorCatalog Listing') ||
          response.message.includes('Code: 004') ||
          response.message.includes('Status: 409')
        ) {
          notificationMessage.value =
            'No se puede crear una publicación basada en un ítem de catálogo. Por favor, seleccione una publicación que no sea de catálogo.'
        } else {
          // Mostrar el mensaje de error tal como viene de la API
          notificationMessage.value = `${response.message}`
        }
      } else {
        // Mensaje genérico si no hay mensaje específico
        notificationMessage.value = 'No se pudo crear la publicación'
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
  loadSyncRelations(true)
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
      loadSyncRelations(true)

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

  // Mostrar el overlay de progreso
  showProgressOverlay.value = true
  progressMessage.value = `Sincronizando ${publicationsSelected.value.length} publicaciones...`
  syncComplete.value = false
  progressValue.value = 0
  syncSuccessCount.value = 0
  syncErrorCount.value = 0
  syncErrorMessages.value = []
  syncHasErrors.value = false

  try {
    // Sincronizar cada publicación seleccionada
    let successCount = 0
    let errorCount = 0
    const errorMessages: string[] = [] // Almacenar mensajes de error para mostrarlos después

    // Obtener la publicación actual para determinar sus relaciones
    for (const publicationId of publicationsSelected.value) {
      try {
        const accountId = accountStore.currentAccount?.ID
        if (!accountId) continue

        // Encontrar la publicación en la lista para obtener sus relaciones
        const publication = publicationsShow.value.find(
          (item) => item.publication_id === publicationId,
        )
        if (!publication) {
          console.warn(`No se encontró la publicación ${publicationId} en la lista`)
          continue
        }

        // Procesar sincronizaciones salientes
        if (publication.to_syncs && publication.to_syncs.length > 0) {
          for (const toSync of publication.to_syncs) {
            try {
              // Buscar la cuenta a la que pertenece el destino
              const targetAccountId = toSync.to_account_id
              const targetPublicationId = toSync.to_sync_id

              // Sincronizar de publicationId hacia targetPublicationId
              console.log(
                `Sincronización saliente: accountId=${accountId}, publicationId=${publicationId}, targetAccountId=${targetAccountId}, targetPublicationId=${targetPublicationId}`,
              )

              await migrationService.updateProduct(
                accountId,
                publicationId,
                targetAccountId,
                targetPublicationId,
              )
              successCount++
            } catch (syncError) {
              console.error(
                `Error en sincronización saliente de ${publicationId} a ${toSync.to_sync_id}:`,
                syncError,
              )
              errorCount++

              // Crear un objeto de error enriquecido
              const enrichedError = createEnrichedError(syncError, publicationId, toSync.to_sync_id)
              errorMessages.push(JSON.stringify(enrichedError))
            }
          }
        }

        // Procesar sincronizaciones entrantes
        if (publication.from_syncs && publication.from_syncs.length > 0) {
          for (const fromSync of publication.from_syncs) {
            try {
              const sourceAccountId = fromSync.from_account_id
              const sourcePublicationId = fromSync.from_publication_id

              // Sincronizar de sourcePublicationId hacia publicationId
              console.log(
                `Sincronización entrante: accountId=${sourceAccountId}, publicationId=${sourcePublicationId}, targetAccountId=${accountId}, targetPublicationId=${publicationId}`,
              )

              await migrationService.updateProduct(
                sourceAccountId,
                sourcePublicationId,
                accountId,
                publicationId,
              )
              successCount++
            } catch (syncError) {
              console.error(
                `Error en sincronización entrante de ${fromSync.from_publication_id} a ${publicationId}:`,
                syncError,
              )
              errorCount++

              // Crear un objeto de error enriquecido
              const enrichedError = createEnrichedError(
                syncError,
                fromSync.from_publication_id,
                publicationId,
              )
              errorMessages.push(JSON.stringify(enrichedError))
            }
          }
        }

        // Si no hay relaciones, sincronizar la publicación consigo misma
        if (
          (!publication.to_syncs || publication.to_syncs.length === 0) &&
          (!publication.from_syncs || publication.from_syncs.length === 0)
        ) {
          try {
            // Sincronizar la publicación consigo misma para actualizar sus datos
            await migrationService.updateProduct(accountId, publicationId)
            successCount++
          } catch (syncError) {
            console.error(`Error al sincronizar la publicación ${publicationId}:`, syncError)
            errorCount++

            // Crear un objeto de error enriquecido
            const enrichedError = createEnrichedError(syncError, publicationId, 'N/A')
            errorMessages.push(JSON.stringify(enrichedError))
          }
        }
      } catch (error) {
        console.error(`Error general al procesar la publicación ${publicationId}:`, error)
        errorCount++

        // Crear un objeto de error enriquecido
        const enrichedError = createEnrichedError(error, publicationId, 'N/A')
        errorMessages.push(JSON.stringify(enrichedError))
      } finally {
        // Actualizar el indicador de progreso después de cada publicación procesada
        progressValue.value = (successCount + errorCount) / (publicationsSelected.value.length * 2) // Aproximación del progreso
      }
    }

    // Actualizar el estado del overlay con los resultados
    syncComplete.value = true
    syncSuccessCount.value = successCount
    syncErrorCount.value = errorCount
    syncErrorMessages.value = errorMessages
    syncHasErrors.value = errorCount > 0

    // Mostrar notificación
    showNotification.value = true
    if (errorCount === 0) {
      notificationMessage.value = `${successCount} publicaciones sincronizadas correctamente`
      notificationType.value = 'success'
    } else {
      notificationMessage.value = `${successCount} publicaciones sincronizadas, con ${errorCount} errores`
      notificationType.value = errorCount < successCount ? 'warning' : 'error'
    }

    // Recargar los datos para ver los cambios
    await loadSyncRelations(true)
  } catch (error) {
    console.error('Error al sincronizar publicaciones seleccionadas:', error)
    showNotification.value = true
    notificationMessage.value = 'Error al sincronizar publicaciones seleccionadas'
    notificationType.value = 'error'
  } finally {
    syncingSelected.value = false
  }
}

// Interfaz para el resultado de la sincronización
interface SyncResult {
  success: boolean
  message: string
  payload?: unknown
}

// Función para sincronizar una relación específica
const syncRelation = async (
  sourceId: string,
  targetId: string,
  direction: 'outgoing' | 'incoming',
  showNotifications = true, // Parámetro para controlar si se muestran notificaciones
): Promise<SyncResult> => {
  // Creamos un ID único para esta relación
  const relationId = `${sourceId}-${targetId}`
  syncingItem.value = relationId

  try {
    const accountId = accountStore.currentAccount?.ID
    if (!accountId) {
      if (showNotifications) {
        showNotification.value = true
        notificationMessage.value = 'Selecciona una cuenta primero'
        notificationType.value = 'warning'
      }
      return { success: false, message: 'Selecciona una cuenta primero' }
    }

    let response
    if (direction === 'outgoing') {
      // Sincronizar de sourceId hacia targetId
      // En este caso, sourceId es la publicación de origen y targetId es la publicación de destino

      // Buscar la cuenta a la que pertenece targetId
      const targetAccountId = findAccountIdByPublicationId(targetId)

      // Si no se encuentra la cuenta de destino, usamos la cuenta actual
      // Esto es necesario porque el header account-id-to no puede estar vacío
      const targetAccount = targetAccountId || accountId

      console.log(
        `Sincronización saliente: accountId=${accountId}, publicationId=${sourceId}, targetAccountId=${targetAccount}, targetPublicationId=${targetId}`,
      )

      response = await migrationService.updateProduct(accountId, sourceId, targetAccount, targetId)
    } else {
      // 'incoming'
      // Sincronizar de targetId hacia sourceId (inverso)
      // En este caso, targetId es la publicación de origen y sourceId es la publicación de destino

      // Buscar la cuenta a la que pertenece sourceId
      const targetAccountId = findAccountIdByPublicationId(sourceId)

      // Si no se encuentra la cuenta de destino, usamos la cuenta actual
      // Esto es necesario porque el header account-id-to no puede estar vacío
      const targetAccount = targetAccountId || accountId

      console.log(
        `Sincronización entrante: accountId=${accountId}, publicationId=${targetId}, targetAccountId=${targetAccount}, targetPublicationId=${sourceId}`,
      )

      response = await migrationService.updateProduct(accountId, targetId, targetAccount, sourceId)
    }

    const successMessage =
      response.message ||
      (direction === 'outgoing'
        ? `Sincronización de ${sourceId} hacia ${targetId} iniciada`
        : `Sincronización desde ${sourceId} hacia ${targetId} iniciada`)

    if (showNotifications) {
      showNotification.value = true
      notificationMessage.value = successMessage
      notificationType.value = 'success'

      // Recargar los datos para ver los cambios
      await loadSyncRelations(true)
    }

    return { success: true, message: successMessage }
  } catch (error) {
    console.error(`Error al sincronizar la relación ${sourceId}-${targetId}:`, error)

    // Intentar extraer el payload completo del error
    let errorPayload: unknown = null
    let errorMessage = ''

    // Intentar obtener el payload completo del error
    if (error instanceof Error) {
      errorMessage = error.message

      // Intentar extraer el payload JSON si existe
      try {
        // Buscar un objeto JSON en el mensaje de error
        const jsonMatch = errorMessage.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          errorPayload = JSON.parse(jsonMatch[0])
        }
      } catch {
        // Si no se puede parsear, usar el mensaje original
      }
    } else if (typeof error === 'object' && error !== null) {
      // Si el error ya es un objeto, usarlo directamente
      errorPayload = error
      errorMessage = JSON.stringify(error)
    } else {
      errorMessage = `Error al sincronizar la relación`
    }

    if (showNotifications) {
      showNotification.value = true
      notificationMessage.value = errorMessage
      notificationType.value = 'error'
    }

    // Devolver tanto el mensaje como el payload completo
    return {
      success: false,
      message: errorMessage,
      payload: errorPayload,
    }
  } finally {
    syncingItem.value = null
  }
}

// Función para sincronizar todas las relaciones de un tipo específico (entrantes o salientes)
const syncAllRelations = async (publicationId: string, direction: 'outgoing' | 'incoming') => {
  // Crear un ID único para esta operación de sincronización masiva
  const operationId = `${publicationId}-${direction}-all`
  syncingItem.value = operationId

  try {
    const accountId = accountStore.currentAccount?.ID
    if (!accountId) {
      showNotification.value = true
      notificationMessage.value = 'Selecciona una cuenta primero'
      notificationType.value = 'warning'
      return
    }

    // Encontrar la publicación en la lista
    const publication = publicationsShow.value.find((item) => item.publication_id === publicationId)
    if (!publication) {
      throw new Error(`No se encontró la publicación ${publicationId}`)
    }

    // Determinar qué relaciones sincronizar según la dirección
    const relations = direction === 'outgoing' ? publication.to_syncs : publication.from_syncs

    if (relations.length === 0) {
      showNotification.value = true
      notificationMessage.value = `No hay relaciones ${direction === 'outgoing' ? 'salientes' : 'entrantes'} para sincronizar`
      notificationType.value = 'warning'
      return
    }

    // Inicializar el overlay con indicador de progreso
    showProgressOverlay.value = true
    progressMessage.value = `Sincronizando ${relations.length} relaciones ${direction === 'outgoing' ? 'salientes' : 'entrantes'}...`
    progressValue.value = 0 // Inicializar el indicador de progreso en 0
    syncComplete.value = false
    syncHasErrors.value = false
    syncSuccessCount.value = 0
    syncErrorCount.value = 0
    syncErrorMessages.value = []

    // Sincronizar cada relación una por una
    let successCount = 0
    let errorCount = 0
    const errorMessages: string[] = [] // Almacenar mensajes de error para mostrarlos después

    for (const relation of relations) {
      try {
        let result

        // Definir variables para los IDs de origen y destino
        let sourceId = ''
        let targetId = ''

        if (direction === 'outgoing') {
          // Para relaciones salientes
          // Asegurarnos de que estamos trabajando con una relación saliente
          const outgoingRelation = relation as { to_sync_id: string; to_account_id: number }
          sourceId = publicationId
          targetId = outgoingRelation.to_sync_id

          // Llamar a syncRelation sin mostrar notificaciones individuales
          result = await syncRelation(
            sourceId,
            targetId,
            'outgoing',
            false, // No mostrar notificaciones para cada sincronización individual
          )
        } else {
          // Para relaciones entrantes
          // Asegurarnos de que estamos trabajando con una relación entrante
          const incomingRelation = relation as {
            from_publication_id: string
            from_account_id: number
          }
          sourceId = incomingRelation.from_publication_id
          targetId = publicationId

          // Llamar a syncRelation sin mostrar notificaciones individuales
          result = await syncRelation(
            sourceId,
            targetId,
            'incoming',
            false, // No mostrar notificaciones para cada sincronización individual
          )
        }

        if (result.success) {
          successCount++
        } else {
          errorCount++
          // Crear un objeto de error enriquecido con los IDs
          const enrichedError = {
            sourceId,
            targetId,
            message: result.message,
            payload: result.payload,
          }

          // Guardar el error enriquecido como JSON
          errorMessages.push(JSON.stringify(enrichedError))
        }

        // Actualizar el indicador de progreso después de cada sincronización
        progressValue.value = (successCount + errorCount) / relations.length
      } catch (error) {
        console.error(`Error al sincronizar relación:`, error)
        errorCount++

        // Crear un objeto de error enriquecido con los IDs disponibles en este contexto
        // Aquí usamos los IDs de la publicación actual y la dirección
        let sourceId = ''
        let targetId = ''

        if (direction === 'outgoing') {
          // Para relaciones salientes
          sourceId = publicationId
          // Intentamos obtener el ID de destino si es posible
          if ('to_sync_id' in relation && typeof relation.to_sync_id === 'string') {
            targetId = relation.to_sync_id
          }
        } else {
          // Para relaciones entrantes
          targetId = publicationId
          // Intentamos obtener el ID de origen si es posible
          if (
            'from_publication_id' in relation &&
            typeof relation.from_publication_id === 'string'
          ) {
            sourceId = relation.from_publication_id
          }
        }

        // Extraer el mensaje de error
        let errorMessage = ''
        let errorPayload: unknown = null

        if (error instanceof Error) {
          errorMessage = error.message

          // Intentar extraer el payload JSON si existe
          try {
            const jsonMatch = errorMessage.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              errorPayload = JSON.parse(jsonMatch[0])
            }
          } catch {
            // Si no se puede parsear, usar el mensaje original
          }
        } else if (typeof error === 'object' && error !== null) {
          // Si el error ya es un objeto, usarlo directamente
          errorPayload = error
          errorMessage = JSON.stringify(error)
        } else {
          errorMessage = 'Error desconocido'
        }

        // Crear un objeto de error enriquecido
        const enrichedError = {
          sourceId,
          targetId,
          message: errorMessage,
          payload: errorPayload,
        }

        // Guardar el error enriquecido como JSON
        errorMessages.push(JSON.stringify(enrichedError))
      }
    }

    // Actualizar el estado del overlay con los resultados
    syncComplete.value = true
    syncSuccessCount.value = successCount
    syncErrorCount.value = errorCount
    syncErrorMessages.value = errorMessages
    syncHasErrors.value = errorCount > 0

    // Actualizar el mensaje de progreso con el resultado final
    if (errorCount === 0 && successCount > 0) {
      // Solo éxitos
      progressMessage.value = `Se sincronizaron correctamente ${successCount} relaciones ${direction === 'outgoing' ? 'salientes' : 'entrantes'}`
    } else if (successCount === 0 && errorCount > 0) {
      // Solo errores
      progressMessage.value = `No se pudo sincronizar ninguna relación`
    } else if (successCount > 0 && errorCount > 0) {
      // Combinación de éxitos y errores
      progressMessage.value = `Se sincronizaron ${successCount} relaciones, pero fallaron ${errorCount}`
    } else {
      // Ningún resultado (no debería ocurrir normalmente)
      progressMessage.value = `No se procesaron relaciones para sincronizar`
    }

    // Recargar los datos para ver los cambios
    await loadSyncRelations()
  } catch (error) {
    console.error(`Error al sincronizar relaciones ${direction}:`, error)

    // Mostrar el error en el overlay
    syncComplete.value = true
    syncHasErrors.value = true
    syncSuccessCount.value = 0
    syncErrorCount.value = 1
    const errorMessage = error instanceof Error ? error.message : `Error al sincronizar relaciones`
    syncErrorMessages.value = [errorMessage]
    progressMessage.value = `Error al iniciar la sincronización`
  } finally {
    syncingItem.value = null
    // No ocultamos el overlay aquí para que el usuario pueda ver el resultado
    // El overlay se cerrará cuando el usuario haga clic en el botón de cerrar
  }
}

// Función auxiliar para encontrar el ID de cuenta por ID de publicación
const findAccountIdByPublicationId = (publicationId: string): number | undefined => {
  // Buscar en las publicaciones cargadas
  const publication = publicationsShow.value.find((item) => item.publication_id === publicationId)
  if (publication) {
    return publication.account_id
  }

  // Si no se encuentra, buscar en las sincronizaciones entrantes y salientes
  for (const item of publicationsShow.value) {
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
// su funcionalidad ya está cubierta por otras funciones de sincronización

// Interfaz para los IDs extraídos
interface ExtractedIds {
  sourceId: string
  targetId: string
}

// Interfaz para el error enriquecido
interface EnrichedError {
  sourceId: string
  targetId: string
  message: string
  payload?: unknown
}

// Función para crear un objeto de error enriquecido
const createEnrichedError = (error: unknown, sourceId: string, targetId: string): EnrichedError => {
  let errorMessage = ''
  let errorPayload: unknown = null

  // Extraer el mensaje de error
  if (error instanceof Error) {
    errorMessage = error.message

    // Intentar extraer el payload JSON si existe
    try {
      const jsonMatch = errorMessage.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        errorPayload = JSON.parse(jsonMatch[0])
      }
    } catch {
      // Si no se puede parsear, usar el mensaje original
    }
  } else if (typeof error === 'object' && error !== null) {
    // Si el error ya es un objeto, usarlo directamente
    errorPayload = error
    errorMessage = JSON.stringify(error)
  } else {
    errorMessage = 'Error desconocido'
  }

  // Crear un objeto de error enriquecido
  return {
    sourceId,
    targetId,
    message: errorMessage,
    payload: errorPayload,
  }
}

// Función para extraer los IDs de origen y destino de un mensaje de error
const extractErrorIds = (errorMsg: string | Record<string, unknown>): ExtractedIds => {
  try {
    // Si es un string, intentar parsearlo como JSON (nuestro formato enriquecido)
    if (typeof errorMsg === 'string') {
      try {
        // Intentar parsear como JSON (nuestro formato enriquecido)
        const parsedError = JSON.parse(errorMsg) as EnrichedError

        // Verificar si tiene los campos sourceId y targetId
        if (parsedError && 'sourceId' in parsedError && 'targetId' in parsedError) {
          return {
            sourceId: parsedError.sourceId || 'N/A',
            targetId: parsedError.targetId || 'N/A',
          }
        }
      } catch {
        // Si no se puede parsear como JSON, devolver valores por defecto
      }
    }
    // Si es un objeto, buscar directamente los campos sourceId y targetId
    else if (typeof errorMsg === 'object' && errorMsg !== null) {
      const sourceId =
        'sourceId' in errorMsg && typeof errorMsg.sourceId === 'string' ? errorMsg.sourceId : 'N/A'

      const targetId =
        'targetId' in errorMsg && typeof errorMsg.targetId === 'string' ? errorMsg.targetId : 'N/A'

      return { sourceId, targetId }
    }

    // Si no se encuentra nada, devolver valores por defecto
    return {
      sourceId: 'N/A',
      targetId: 'N/A',
    }
  } catch {
    return {
      sourceId: 'N/A',
      targetId: 'N/A',
    }
  }
}

// Función para copiar todos los errores al portapapeles
const copyAllErrorsToClipboard = () => {
  try {
    // Crear un texto con todos los errores y sus IDs
    const errorText = syncErrorMessages.value
      .map((msg, idx) => {
        // Extraer IDs y resumen
        const { sourceId, targetId } = extractErrorIds(msg)
        const summary = extractErrorSummary(msg)

        // Formatear los detalles técnicos sin duplicación
        let formattedDetails = ''

        try {
          // Si es un string, intentar parsearlo como JSON
          if (typeof msg === 'string') {
            try {
              // Intentar parsear como JSON (nuestro formato enriquecido)
              const parsedError = JSON.parse(msg)

              // Si tiene un payload, usar solo ese payload formateado
              if (parsedError.payload) {
                formattedDetails = formatPayload(parsedError.payload)
              } else if (parsedError.message) {
                // Si no tiene payload pero tiene mensaje, intentar parsearlo
                try {
                  const messageObj = JSON.parse(parsedError.message)
                  formattedDetails = formatPayload(messageObj)
                } catch {
                  // Si no se puede parsear, usar el mensaje original
                  formattedDetails = parsedError.message
                }
              } else {
                // Si no tiene ni payload ni mensaje, usar el objeto completo
                formattedDetails = JSON.stringify(parsedError, null, 2)
              }
            } catch {
              // Si no se puede parsear como JSON, usar el string original
              formattedDetails = msg
            }
          } else {
            // Si no es un string, formatearlo directamente
            formattedDetails = formatPayload(msg)
          }
        } catch {
          // En caso de error, usar un formato simple
          formattedDetails = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2)
        }

        return `Error #${idx + 1}\nID Origen: ${sourceId}\nID Destino: ${targetId}\nResumen: ${summary}\nDetalles:\n${formattedDetails}\n${'='.repeat(80)}`
      })
      .join('\n\n')

    navigator.clipboard.writeText(errorText)

    // Mostrar notificación de éxito
    showNotification.value = true
    notificationMessage.value = `${syncErrorMessages.value.length} errores copiados al portapapeles`
    notificationType.value = 'success'
  } catch (error) {
    console.error('Error al copiar errores al portapapeles:', error)

    // Mostrar notificación de error
    showNotification.value = true
    notificationMessage.value = 'No se pudo copiar al portapapeles'
    notificationType.value = 'error'
  }
}

// Función para copiar el error al portapapeles
const copyErrorToClipboard = (error: string | Record<string, unknown>) => {
  try {
    const textToCopy = typeof error === 'string' ? error : JSON.stringify(error, null, 2)
    navigator.clipboard.writeText(textToCopy)

    // Mostrar notificación de éxito
    showNotification.value = true
    notificationMessage.value = 'Detalles del error copiados al portapapeles'
    notificationType.value = 'success'
  } catch (error) {
    console.error('Error al copiar al portapapeles:', error)

    // Mostrar notificación de error
    showNotification.value = true
    notificationMessage.value = 'No se pudo copiar al portapapeles'
    notificationType.value = 'error'
  }
}

// Función para extraer un resumen del error
const extractErrorSummary = (errorMsg: string | Record<string, unknown>): string => {
  try {
    // Si es un string, intentar parsearlo como JSON (nuestro formato enriquecido)
    if (typeof errorMsg === 'string') {
      try {
        // Intentar parsear como JSON (nuestro formato enriquecido)
        const parsedError = JSON.parse(errorMsg) as EnrichedError

        // Si tiene un campo message, usarlo
        if (parsedError && 'message' in parsedError && typeof parsedError.message === 'string') {
          const message = parsedError.message

          // Buscar patrones comunes en el mensaje
          if (message.includes('Error 004:') || message.includes('Se ha presentado un error')) {
            return 'Error de autorización o permisos'
          }

          if (message.includes('UNAUTHORIZED')) {
            return 'Error de autorización'
          }

          if (message.includes('timeout')) {
            return 'Tiempo de espera agotado'
          }

          if (message.includes('network')) {
            return 'Error de red'
          }

          // Si no hay patrones reconocibles, devolver un resumen del mensaje
          return message.length > 50 ? `${message.substring(0, 50)}...` : message
        }

        // Si tiene un payload con campos reconocibles, usarlos
        if (parsedError.payload && typeof parsedError.payload === 'object') {
          const payload = parsedError.payload as Record<string, unknown>

          // Priorizar el campo Message del payload (formato estándar de la API)
          if ('Message' in payload && typeof payload.Message === 'string') {
            // Evitar mostrar detalles técnicos duplicados
            const message = payload.Message as string
            if (
              message === 'Se ha presentado un error procesando su solicitud' &&
              'TecnicalDetails' in payload &&
              payload.TecnicalDetails
            ) {
              return message
            }
            return message
          }

          // Alternativas si no hay campo Message
          if ('message' in payload && typeof payload.message === 'string') {
            return payload.message as string
          }

          if ('Code' in payload && typeof payload.Code === 'string') {
            return `Error ${payload.Code}`
          }
        }
      } catch {
        // Si no se puede parsear como JSON, tratar como string normal
        const errorString = errorMsg

        // Buscar patrones comunes
        if (
          errorString.includes('Error 004:') ||
          errorString.includes('Se ha presentado un error')
        ) {
          return 'Error de autorización o permisos'
        }

        if (errorString.includes('UNAUTHORIZED')) {
          return 'Error de autorización'
        }

        if (errorString.includes('timeout')) {
          return 'Tiempo de espera agotado'
        }

        if (errorString.includes('network')) {
          return 'Error de red'
        }

        // Si no hay patrones reconocibles, devolver un resumen del mensaje
        return errorString.length > 50 ? `${errorString.substring(0, 50)}...` : errorString
      }
    }
    // Si es un objeto, intentar extraer información relevante
    else if (typeof errorMsg === 'object' && errorMsg !== null) {
      // Si tiene un campo message, usarlo
      if ('message' in errorMsg && typeof errorMsg.message === 'string') {
        return errorMsg.message
      }

      // Si tiene un campo Message, usarlo
      if ('Message' in errorMsg && typeof errorMsg.Message === 'string') {
        return errorMsg.Message
      }

      // Si tiene un campo Code, usarlo
      if ('Code' in errorMsg && typeof errorMsg.Code === 'string') {
        return `Error ${errorMsg.Code}`
      }
    }

    // Si no se encuentra nada relevante, devolver un valor por defecto
    return 'Error de sincronización'
  } catch {
    return 'Error desconocido'
  }
}

// Función para formatear los detalles del error en formato JSON
const formatErrorDetails = (errorMsg: string | Record<string, unknown>): string => {
  try {
    // Si es un string, intentar parsearlo como JSON (nuestro formato enriquecido)
    if (typeof errorMsg === 'string') {
      try {
        // Intentar parsear como JSON (nuestro formato enriquecido)
        const parsedError = JSON.parse(errorMsg) as EnrichedError

        // Si tiene un payload, formatearlo
        if (parsedError.payload) {
          return formatPayload(parsedError.payload)
        }

        // Si no tiene payload pero tiene mensaje, devolverlo
        if (parsedError.message) {
          return parsedError.message
        }

        // Si solo tiene IDs, mostrarlos junto con el mensaje
        return JSON.stringify(
          {
            sourceId: parsedError.sourceId,
            targetId: parsedError.targetId,
            message: 'Error de sincronización',
          },
          null,
          2,
        )
      } catch {
        // Si no se puede parsear como JSON, devolver el string original
        return errorMsg
      }
    }

    // Si es un objeto, formatearlo directamente
    return formatPayload(errorMsg)
  } catch (_error) {
    // Ignoramos el error y simplemente devolvemos el mensaje original
    return typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg, null, 2)
  }
}

// Función auxiliar para formatear el payload de error
const formatPayload = (payload: unknown): string => {
  // Definir una interfaz para el formato de error esperado
  interface ErrorResponse {
    Code?: string
    Status?: number
    Message?: string
    TecnicalDetails?: string
    Details?: unknown
    [key: string]: unknown
  }

  try {
    // Si es un string, intentar parsearlo como JSON
    if (typeof payload === 'string') {
      try {
        // Intentar parsear como JSON
        const jsonObj = JSON.parse(payload)

        // Si tiene detalles técnicos, procesarlos
        if (jsonObj.TecnicalDetails && typeof jsonObj.TecnicalDetails === 'string') {
          try {
            // Intentar parsear los detalles técnicos como JSON
            const technicalDetails = JSON.parse(jsonObj.TecnicalDetails.trim())
            // Crear un objeto combinado para mejor visualización
            const processedObj = {
              ...jsonObj,
              TecnicalDetails: technicalDetails,
            }
            return JSON.stringify(processedObj, null, 2)
          } catch {
            // Si no se puede parsear, mantener el formato original
          }
        }

        // Si no tiene detalles técnicos o no se pudieron parsear, devolver el objeto tal cual
        return JSON.stringify(jsonObj, null, 2)
      } catch {
        // Si no se puede parsear como JSON, devolver el string formateado
        return JSON.stringify(
          {
            Message: payload,
            Source: 'Error en formato texto',
          },
          null,
          2,
        )
      }
    }

    // Si es un objeto, procesarlo directamente
    if (payload && typeof payload === 'object') {
      const errorObj = payload as ErrorResponse

      // Si tiene detalles técnicos, procesarlos
      if (errorObj.TecnicalDetails && typeof errorObj.TecnicalDetails === 'string') {
        try {
          // Intentar parsear los detalles técnicos como JSON
          const technicalDetails = JSON.parse(errorObj.TecnicalDetails.trim())
          // Crear un objeto combinado para mejor visualización
          const processedObj = {
            ...errorObj,
            TecnicalDetails: technicalDetails,
          }
          return JSON.stringify(processedObj, null, 2)
        } catch {
          // Si no se puede parsear, mantener el formato original
        }
      }

      // Si no tiene detalles técnicos o no se pudieron parsear, devolver el objeto tal cual
      return JSON.stringify(errorObj, null, 2)
    }

    // Para cualquier otro tipo, convertirlo a string
    return JSON.stringify(
      {
        Message: String(payload),
        Source: 'Error desconocido',
      },
      null,
      2,
    )
  } catch (error) {
    // En caso de cualquier error, devolver el payload como string
    return typeof payload === 'string' ? payload : String(payload)
  }
}

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
    const publication = publicationsShow.value.find((p) => p.publication_id === publicationId)
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
      const publication = publicationsShow.value.find((p) => p.publication_id === publicationId)
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
      hasLoadedPublications.value = false
      allPublications.value = []
      publicationsShow.value = []
      filteredPublicationsAll.value = []
      totalPublicationsFiltered.value = 0
      loadSyncRelations(true)
    }
  },
)

// Función para manejar la paginación
const handlePageChange = (newPage: number) => {
  page.value = newPage
  console.log('Cambiando a página:', newPage)
  applyLocalFilters() // Aplicar filtros localmente sin recargar de la API
}

// Función para manejar el cambio en el número de elementos por página
const handleItemsPerPageChange = (newItemsPerPage: number) => {
  itemsPerPage.value = newItemsPerPage
  page.value = 1 // Reiniciar a la primera página cuando cambia el número de elementos por página
  applyLocalFilters()
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
  applyLocalFilters()
}

// Función para limpiar la búsqueda
const clearSearchQuery = () => {
  searchQuery.value = ''
  applyLocalFilters()
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

// Funciones para manejar los filtros
// Función para aplicar filtros localmente sin recargar de la API
const applyLocalFilters = () => {
  if (!hasLoadedPublications.value) {
    loadSyncRelations(true)
    return
  }
  loadSyncRelations(false)
}

// Manejadores para el filtro de estado de sincronización
const handleSyncStatusFilterChange = () => {
  applyLocalFilters()
}

const resetSyncStatusFilter = () => {
  syncStatusFilter.value = 'all'
  applyLocalFilters()
}

// Manejadores para el filtro de cantidad de sincronizaciones
const handleSyncCountFilterChange = () => {
  applyLocalFilters()
}

const resetSyncCountFilter = () => {
  syncCountFilter.value = 'all'
  applyLocalFilters()
}

// Manejadores para el filtro de catálogo
const handleCatalogFilterChange = () => {
  applyLocalFilters()
}

const resetCatalogFilter = () => {
  catalogFilter.value = 'all'
  applyLocalFilters()
}

// Manejadores para el filtro de estado
const handleStatusFilterChange = () => {
  applyLocalFilters()
}

const resetStatusFilter = () => {
  statusFilter.value = 'active'
  applyLocalFilters()
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

.ct-border-right {
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

/* Estilo para hover aplicado en la clase .visible-on-hover */

.visible-on-hover {
  opacity: 0;
}

.sortable-header:hover .visible-on-hover {
  opacity: 1;
}

.header-content {
  min-height: 40px;
}

/* Estilos para los mensajes de error en el snackbar */
:deep(.error-snackbar) {
  max-width: 500px !important;
}

:deep(.error-snackbar .text-caption) {
  white-space: normal;
  word-break: break-word;
  margin-top: 4px;
  padding: 4px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.error-details {
  white-space: pre-wrap;
  word-break: break-word;
}

.error-table :deep(th) {
  white-space: nowrap;
}

/* Estilos para mejorar animaciones de la tabla virtual */
:deep(.v-data-table-virtual__wrapper) {
  scroll-behavior: smooth;
  will-change: transform;
}

:deep(.v-data-table-virtual__item) {
  transition:
    transform 0.2s ease-out,
    opacity 0.2s ease-out;
  will-change: transform, opacity;
}

:deep(.v-data-table-virtual__expanded-row) {
  transition: max-height 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
  will-change: max-height;
  overflow: hidden;
}

:deep(.v-data-table-virtual__expanded-content) {
  transition: opacity 0.2s ease-out;
  will-change: opacity;
}

.stats-label {
  font-family: 'Poppins', sans-serif;
  font-weight: 100;
  font-size: 0.8rem;
}

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
