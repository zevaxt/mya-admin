<template>
  <div>
    <!-- Título y botones -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 text-primary font-weight-medium mb-1">Publicaciones</h3>
        <p class="text-caption text-grey">Publicaciones registradas en el sistema</p>
      </div>
      <div class="d-flex gap-2">
        <v-menu v-if="hasAccount">
          <template v-slot:activator="{ props }">
            <v-btn
              color="success"
              variant="outlined"
              v-bind="props"
              class="mr-2"
              size="small"
              :loading="processingPopulateAll"
              :disabled="processingPopulateAll"
            >
              <v-icon start>mdi-database-import</v-icon>
              Populate todas
              <v-icon end>mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="confirmPopulateAllProducts(false)">
              <v-list-item-title>Todas las publicaciones</v-list-item-title>
            </v-list-item>
            <v-list-item @click="confirmPopulateAllProducts(true)">
              <v-list-item-title>Solo publicaciones sin atributos</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn
          color="primary"
          variant="outlined"
          @click="loadProductIds"
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
      <div class="search-container mb-3 d-flex">
        <v-text-field
          v-model="searchQuery"
          variant="outlined"
          density="compact"
          hide-details
          placeholder="Buscar ID..."
          class="search-field modern-search flex-grow-1"
          prepend-inner-icon="mdi-magnify"
          clearable
          rounded
          bg-color="grey-lighten-4"
          @update:model-value="handleSearchInputChange"
          @click:clear="clearSearchField"
          @keyup.enter="executeSearch"
        >
          <template #append-inner>
            <v-btn
              color="primary"
              class="search-action-btn"
              min-width="48"
              height="40"
              variant="flat"
              @click="executeSearch"
            >
              <v-icon>mdi-magnify</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>

      <!-- Pills de filtros -->
      <div class="filter-pills-container d-flex flex-wrap align-center gap-2">
        <!-- Filtro de estado -->
        <v-menu location="bottom" offset-y :close-on-content-click="false">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              :color="statusFilter ? 'primary' : 'grey-lighten-3'"
              :variant="statusFilter ? 'elevated' : 'flat'"
              :prepend-icon="statusFilter ? 'mdi-check-circle' : 'mdi-filter-variant'"
              class="filter-pill-IZQUIERDA"
              label
            >
              <span class="text-body-2"
                >Estado: {{ statusFilter ? getStatusLabel(statusFilter) : 'Todos' }}</span
              >
            </v-chip>
          </template>

          <v-card min-width="280" max-width="320" class="filter-menu pa-2">
            <v-card-title class="text-subtitle-2 pa-2">Filtrar por estado</v-card-title>
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
                  color="primary"
                  density="compact"
                ></v-radio>
              </v-radio-group>
            </v-card-text>
            <v-card-actions class="pa-2 pt-0">
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                color="primary"
                size="small"
                @click="
                  () => {
                    statusFilter = 'active'
                    isDefaultStatusFilter = true
                    handleStatusFilterChange()
                  }
                "
              >
                Restablecer
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Filtro de Sync Activo -->
        <v-menu location="bottom" offset-y :close-on-content-click="false">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              :color="syncActiveFilter ? 'primary' : 'grey-lighten-3'"
              :variant="syncActiveFilter ? 'elevated' : 'flat'"
              :prepend-icon="syncActiveFilter ? 'mdi-check-circle' : 'mdi-sync'"
              class="filter-pill"
              label
            >
              <span class="text-body-2"
                >Sync: {{ syncActiveFilter ? getSyncLabel(syncActiveFilter) : 'Todos' }}</span
              >
            </v-chip>
          </template>

          <v-card min-width="280" max-width="320" class="filter-menu pa-2">
            <v-card-title class="text-subtitle-2 pa-2">Filtrar por Sync Activo</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-2">
              <v-radio-group
                v-model="syncActiveFilter"
                @update:model-value="handleSyncActiveFilterChange"
                hide-details
                density="compact"
              >
                <v-radio
                  v-for="option in booleanFilterOptions"
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
              <v-btn
                variant="text"
                color="primary"
                size="small"
                @click="
                  () => {
                    syncActiveFilter = ''
                    handleSyncActiveFilterChange()
                  }
                "
              >
                Restablecer
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Filtro de Catálogo -->
        <v-menu location="bottom" offset-y :close-on-content-click="false">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              :color="catalogActiveFilter ? 'primary' : 'grey-lighten-3'"
              :variant="catalogActiveFilter ? 'elevated' : 'flat'"
              :prepend-icon="catalogActiveFilter ? 'mdi-check-circle' : 'mdi-book-open-variant'"
              class="filter-pill"
              label
            >
              <span class="text-body-2"
                >Catálogo:
                {{ catalogActiveFilter ? getCatalogLabel(catalogActiveFilter) : 'Todos' }}</span
              >
            </v-chip>
          </template>

          <v-card min-width="280" max-width="320" class="filter-menu pa-2">
            <v-card-title class="text-subtitle-2 pa-2">Filtrar por Catálogo</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-2">
              <v-radio-group
                v-model="catalogActiveFilter"
                @update:model-value="handleCatalogActiveFilterChange"
                hide-details
                density="compact"
              >
                <v-radio
                  v-for="option in booleanFilterOptions"
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
              <v-btn
                variant="text"
                color="primary"
                size="small"
                @click="
                  () => {
                    catalogActiveFilter = ''
                    handleCatalogActiveFilterChange()
                  }
                "
              >
                Restablecer
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Botón de columnas -->
        <v-menu
          location="bottom"
          offset-y
          :close-on-content-click="false"
          v-model="showColumnsMenu"
        >
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              color="grey-lighten-3"
              variant="flat"
              prepend-icon="mdi-eye-settings"
              class="filter-pill"
              label
            >
              <span class="text-body-2">Columnas</span>
            </v-chip>
          </template>

          <v-card min-width="300" max-width="400" class="filter-menu pa-2">
            <v-card-title class="text-subtitle-2 d-flex align-center pa-2">
              <span>Columnas visibles</span>
              <v-spacer></v-spacer>
              <v-btn icon size="small" @click="showColumnsMenu = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text style="max-height: 300px; overflow-y: auto" class="pa-2">
              <v-list density="compact">
                <v-list-item
                  v-for="column in allColumns.filter((col) => !col.required && col.title)"
                  :key="column.key"
                >
                  <template #prepend>
                    <v-checkbox
                      v-model="visibleColumns"
                      :value="column.key"
                      :disabled="column.required"
                      hide-details
                      density="compact"
                      @click="toggleColumnVisibility(column.key)"
                    ></v-checkbox>
                  </template>
                  <v-list-item-title class="text-body-2">{{ column.title }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-2">
              <v-btn color="primary" variant="text" size="small" @click="selectDefaultColumns">
                Por defecto
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn color="primary" variant="text" size="small" @click="resetColumns">
                Mostrar todas
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Chip de resultados -->
        <v-chip
          v-if="productIds.length > 0"
          :color="hasActiveFilters ? 'info-lighten-4' : 'grey-lighten-4'"
          variant="flat"
          :prepend-icon="hasActiveFilters ? 'mdi-filter' : 'mdi-information'"
          class="filter-pill ms-auto"
          label
        >
          <span class="text-body-2">{{ filteredMessage }}</span>
        </v-chip>

        <!-- Botón limpiar filtros -->
        <v-btn
          v-if="hasActiveFilters || searchQuery"
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

    <!-- Tabla de IDs de productos -->
    <div class="position-relative">
      <v-data-table-virtual
        ref="dataTable"
        v-model="selectedItems"
        :headers="productIdsHeaders"
        :items="filteredProductIds"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :height="tableHeight"
        fixed-header
        :item-height="virtualRowHeight"
        :bench="virtualScrollBench"
        class="elevation-1 rounded-lg"
        :no-data-text="
          hasAccount
            ? 'No hay productos disponibles'
            : 'Selecciona una cuenta para ver los productos'
        "
        :ripple="false"
        show-select
        item-value="ID"
      >
        <!-- Template para el encabezado personalizado de la columna ID -->
        <template #[`header.ID`]="{ column }">
          <div class="d-flex align-center header-content" style="min-width: 150px">
            <div class="d-flex align-center sortable-header" @click="handleSort(column.key || '')">
              <span class="mr-2">{{ column.title }}</span>
              <v-icon
                v-if="column.sortable"
                size="x-small"
                :icon="getSortIcon(column)"
                class="sort-icon"
                :class="{ 'visible-on-hover': !isSorted(column) }"
              ></v-icon>
            </div>
          </div>
        </template>

        <template #[`item.SyncActive`]="{ item }">
          <div class="d-flex align-center justify-center w-100">
            <v-switch
              v-model="item.SyncActive"
              color="success"
              hide-details
              density="compact"
              :loading="processingSyncActiveId === item.ID"
              :disabled="processingSyncActiveId === item.ID"
              @click.stop="toggleSyncActive(item.ID, item.SyncActive)"
              class="ma-0 pa-0"
            ></v-switch>
          </div>
        </template>

        <template #[`item.CatalogActive`]="{ item }">
          <v-chip :color="item.CatalogActive ? 'success' : 'error'" size="small">
            {{ item.CatalogActive ? 'Sí' : 'No' }}
          </v-chip>
        </template>

        <template #[`item.Status`]="{ item }">
          <v-chip :color="getStatusColor(item.StatusML)" size="small" class="text-capitalize">
            {{ item.StatusML || (item.Status ? 'active' : 'inactive') }}
          </v-chip>
        </template>

        <template #[`item.IsPopulate`]="{ item }">
          <v-chip :color="item.IsPopulate ? 'success' : 'grey'" size="small">
            {{ item.IsPopulate ? 'Sí' : 'No' }}
          </v-chip>
        </template>

        <template #[`item.updated_at`]="{ item }">
          {{ formatDate(item.updated_at) }}
        </template>

        <template #[`item.ExtUpdatedAt`]="{ item }">
          {{ item.ExtUpdatedAt ? formatDate(item.ExtUpdatedAt) : 'No disponible' }}
        </template>

        <template #[`item.ExtCreatedAt`]="{ item }">
          {{ item.ExtCreatedAt ? formatDate(item.ExtCreatedAt) : 'No disponible' }}
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="text-left">
            <v-menu location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon
                  size="small"
                  color="grey-darken-1"
                  variant="text"
                  v-bind="props"
                  :disabled="loading"
                >
                  <v-icon>mdi-menu</v-icon>
                </v-btn>
              </template>

              <v-list density="compact">
                <!-- Ver detalles -->
                <v-list-item @click="viewProductDetail(item.ID)" :disabled="loading">
                  <template v-slot:prepend>
                    <v-icon color="primary" size="small">mdi-eye</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">Ver detalles</v-list-item-title>
                </v-list-item>

                <!-- Eliminar publicación -->
                <v-list-item
                  @click="confirmDeleteProduct(item.ID)"
                  :disabled="loading || processingDeleteId === item.ID"
                >
                  <template v-slot:prepend>
                    <v-icon color="error" size="small" v-if="processingDeleteId !== item.ID"
                      >mdi-delete</v-icon
                    >
                    <v-progress-circular
                      v-else
                      indeterminate
                      size="16"
                      color="error"
                      class="mr-2"
                    ></v-progress-circular>
                  </template>
                  <v-list-item-title class="text-body-2">Eliminar publicación</v-list-item-title>
                </v-list-item>

                <!-- Populate -->
                <v-list-item
                  @click="confirmPopulateProduct(item.ID)"
                  :disabled="loading || processingPopulateId === item.ID"
                >
                  <template v-slot:prepend>
                    <v-icon color="success" size="small" v-if="processingPopulateId !== item.ID"
                      >mdi-database-import</v-icon
                    >
                    <v-progress-circular
                      v-else
                      indeterminate
                      size="16"
                      color="success"
                      class="mr-2"
                    ></v-progress-circular>
                  </template>
                  <v-list-item-title class="text-body-2">Populate</v-list-item-title>
                </v-list-item>

                <!-- Ver en Mercado Libre -->
                <v-list-item @click="openProductInNewTab(item.ID)">
                  <template v-slot:prepend>
                    <v-icon color="info" size="small">mdi-open-in-new</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">Ver en Mercado Libre</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>
      </v-data-table-virtual>

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

            <v-btn
              color="success"
              variant="outlined"
              size="small"
              :disabled="selectedItems.length === 0 || processingPopulateMultiple"
              @click="confirmPopulateSelectedItems"
              :loading="processingPopulateMultiple"
              class="me-4"
            >
              <v-icon start>mdi-database-import</v-icon>
              Populate {{ selectedItems.length }} seleccionadas
            </v-btn>
            <div class="text-caption text-grey me-4">
              {{ paginationInfo.text || '0-0 de 0' }}
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
              @update:model-value="handleItemsPerPageChange"
            ></v-select>
          </div>

          <v-pagination
            v-model="page"
            :length="Math.ceil(totalProductIds / itemsPerPage)"
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

    <!-- Diálogo de progreso para populate múltiple -->
    <v-dialog v-model="showProgressDialog" persistent max-width="450" content-class="elevation-0">
      <v-card class="rounded-lg" elevation="3">
        <v-card-title class="text-subtitle-1 pa-4 pb-0">
          {{ progressDialogTitle }}
        </v-card-title>

        <v-card-text class="pa-4">
          <p class="text-body-2 text-medium-emphasis mb-4">{{ progressDialogMessage }}</p>

          <div
            class="progress-container pa-3 rounded-lg"
            style="background: rgba(0, 0, 0, 0.02); position: relative"
          >
            <v-progress-linear
              v-model="progressValue"
              color="primary"
              height="6"
              rounded
              bg-opacity="0.1"
            ></v-progress-linear>
            <div class="text-caption text-center mt-2" style="color: rgba(0, 0, 0, 0.6)">
              {{ Math.ceil(progressValue) }}%
            </div>
          </div>

          <div class="d-flex justify-space-between mt-3 text-caption text-medium-emphasis">
            <span>Procesados: {{ processedCount }} de {{ totalItemsToProcess }}</span>
            <span>Exitosos: {{ successCount }}</span>
          </div>
        </v-card-text>

        <v-divider v-if="!isProcessing"></v-divider>

        <v-card-actions v-if="!isProcessing" class="pa-3">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" size="small" @click="showProgressDialog = false"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Notificación de éxito o error -->
    <v-snackbar v-model="showNotification" :color="notificationType" :timeout="3000" location="top">
      {{ notificationMessage }}
      <template v-slot:actions>
        <v-btn variant="text" icon="mdi-close" @click="showNotification = false"></v-btn>
      </template>
    </v-snackbar>

    <!-- Overlay de resultados de populate -->
    <v-overlay
      v-model="showResultsOverlay"
      class="align-center justify-center"
      persistent
      :scrim="true"
      scrim-class="bg-white"
      :opacity="0.3"
    >
      <v-card class="pa-3" min-width="600" max-width="800" elevation="8" rounded="lg">
        <v-card-title class="d-flex align-center py-2 px-3">
          <span class="text-subtitle-2 font-weight-medium">
            {{ resultsMessage }}
          </span>

          <!-- Botón de cerrar -->
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            density="compact"
            size="small"
            color="grey-darken-1"
            @click="showResultsOverlay = false"
          ></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-3">
          <!-- Resultados del populate en formato minimalista -->
          <div
            class="d-flex align-center mb-3 pa-2"
            style="background: rgba(76, 175, 80, 0.05); border-left: 3px solid #4caf50"
          >
            <v-icon color="success" size="small" class="mr-2">mdi-check</v-icon>
            <span class="text-caption"
              >{{ successCount }} publicaciones procesadas correctamente</span
            >
          </div>

          <div v-if="failedCount > 0" class="mb-4">
            <div
              class="d-flex align-center mb-2 pa-2"
              style="background: rgba(244, 67, 54, 0.05); border-left: 3px solid #f44336"
            >
              <v-icon color="error" size="small" class="mr-2">mdi-close</v-icon>
              <span class="text-caption">{{ failedCount }} publicaciones fallaron</span>
            </div>

            <!-- Mostrar los detalles de los errores en una tabla minimalista -->
            <div v-if="errorResults.length > 0" class="mt-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-body-2">Detalles de los errores:</div>
                <div class="d-flex align-center">
                  <v-btn
                    size="small"
                    variant="outlined"
                    color="grey-darken-1"
                    prepend-icon="mdi-content-copy"
                    @click="copyAllErrorsToClipboard"
                    class="mr-2"
                    density="comfortable"
                  >
                    Copiar todos
                  </v-btn>
                  <span class="text-caption">{{ errorResults.length }} errores</span>
                </div>
              </div>

              <v-data-table
                :headers="[
                  { title: '#', key: 'index', width: '30px' },
                  { title: 'ID', key: 'id', width: '120px' },
                  { title: 'Resumen', key: 'summary' },
                  { title: '', key: 'actions', width: '40px', sortable: false },
                ]"
                :items="
                  errorResults.map((item, idx) => ({
                    index: idx + 1,
                    id: item.id,
                    summary: item.message
                      ? item.message.substring(0, 100) + (item.message.length > 100 ? '...' : '')
                      : 'Error desconocido',
                    error: item,
                  }))
                "
                density="compact"
                hover
                class="error-table text-caption"
              >
                <template #item.actions="{ item }">
                  <v-btn
                    icon
                    size="x-small"
                    color="grey-darken-1"
                    variant="text"
                    @click="viewErrorDetails(item.error)"
                  >
                    <v-icon size="small">mdi-eye</v-icon>
                    <v-tooltip activator="parent" location="top">Ver detalles</v-tooltip>
                  </v-btn>
                </template>
              </v-data-table>
            </div>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-2">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            size="small"
            @click="showResultsOverlay = false"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-overlay>

    <!-- Diálogo para mostrar detalles completos del error -->
    <v-dialog
      v-model="showErrorDialog"
      max-width="650"
      scrollable
      content-class="bg-overlay-minimal"
    >
      <v-card class="rounded-lg" elevation="8">
        <v-card-title class="d-flex align-center py-2 px-3">
          <span class="text-subtitle-2">Detalle del error</span>
          <v-spacer></v-spacer>
          <v-btn
            prepend-icon="mdi-content-copy"
            variant="outlined"
            density="comfortable"
            size="small"
            color="grey-darken-1"
            @click="copyErrorToClipboard(selectedError)"
            class="mr-2"
          >
            Copiar
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

        <v-divider></v-divider>

        <v-card-text class="pa-3">
          <div class="d-flex flex-column">
            <!-- Resumen del error -->
            <div
              class="mb-3 pa-3"
              style="background: rgba(244, 67, 54, 0.05); border-left: 3px solid #f44336"
            >
              <p class="text-body-2 mb-0">
                {{
                  typeof selectedError === 'string'
                    ? selectedError
                    : selectedError?.message || 'Error desconocido'
                }}
              </p>
            </div>

            <!-- Detalles completos del error -->
            <div class="mt-2">
              <p class="text-caption mb-1">Detalles completos:</p>
              <pre
                class="error-details pa-3 rounded bg-grey-lighten-5 overflow-x-auto"
                style="max-height: 300px; font-size: 12px; line-height: 1.5"
                >{{ formatErrorDetails(selectedError) }}</pre
              >
            </div>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" size="small" @click="showErrorDialog = false"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- El menú desplegable está ahora en la barra de herramientas -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/account'
import { migrationService } from '@/services/migrationService'
import * as publicationOperations from '@/services/publicationOperations'
import { openInMercadoLibre } from '@/utils/mercadoLibreUtils'
import type { ProductId } from '@/services/migrationService'

const router = useRouter()

// Emits
// No hay emisiones de eventos

// Stores
const accountStore = useAccountStore()

// Estado
const loading = ref(false)
const error = ref<string | null>(null)
const productIds = ref<ProductId[]>([])
// Valor para el filtro de estado (usado tanto para filtrado como para UI)
const statusFilter = ref('active')
// Indica si el filtro de estado es el valor por defecto
const isDefaultStatusFilter = ref(true)
const syncActiveFilter = ref<string>('')
const catalogActiveFilter = ref<string>('')
const searchQuery = ref('')
const totalProductIds = ref(0)
const page = ref(1)
const itemsPerPage = ref(100)
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'warning'>('success')
const processingPopulateId = ref<string | null>(null)
const processingDeleteId = ref<string | null>(null)
const processingSyncActiveId = ref<string | null>(null)
const processingPopulateMultiple = ref<boolean>(false)
const processingPopulateAll = ref<boolean>(false)

// Estado para el diálogo de confirmación
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogAction = ref<() => Promise<void>>(() => Promise.resolve())

// Estado para el diálogo de progreso
const showProgressDialog = ref(false)
const progressDialogTitle = ref('')
const progressDialogMessage = ref('')
const progressValue = ref(0)
const processedCount = ref(0)
const successCount = ref(0)
const failedCount = ref(0)
const totalItemsToProcess = ref(0)
const isProcessing = ref(false)

// Definir la interfaz para el tipo de error
interface ErrorResult {
  id: string
  success: boolean
  message: string
  Code?: string
  Status?: number
  TecnicalDetails?: string
  [key: string]: any // Para otros campos que puedan venir en el error
}

// Estado para el overlay de resultados
const showResultsOverlay = ref(false)
const resultsMessage = ref('')
const populateHasErrors = ref(false)
const errorResults = ref<ErrorResult[]>([])

// Estado para el diálogo de error
const showErrorDialog = ref(false)
const selectedError = ref<ErrorResult | null>(null)

// Opciones para items por página
const itemsPerPageOptions = [10, 25, 50, 100, 250, 500, 1000]

// Opciones de filtro
const statusOptions = [
  { title: 'Todos', value: '' },
  { title: 'Activas', value: 'active' },
  { title: 'Inactivas (Todas)', value: 'inactive' },
  { title: 'Pausado', value: 'paused' },
  { title: 'En revisión', value: 'under_review' },
  { title: 'Finalizado', value: 'closed' },
  { title: 'Eliminado', value: 'deleted' },
]

const booleanFilterOptions = [
  { title: 'Todos', value: '' },
  { title: 'Sí', value: 'true' },
  { title: 'No', value: 'false' },
]

// Configuración de virtual scroll
const tableHeight = 500 // Altura fija para el contenedor de la tabla
const virtualRowHeight = 56 // Altura estándar de una fila (density: comfortable) 56

const virtualScrollBench = 20 // Número de filas adicionales a renderizar fuera de la vista (buffer)

// Estado para los elementos seleccionados (IDs de productos)
const selectedItems = ref<string[]>([])

// Estado para el menú de columnas visibles
const showColumnsMenu = ref(false)

// Definición de todas las columnas disponibles
const allColumns = [
  { title: '', key: 'select', sortable: false, required: true },
  {
    title: 'ID',
    key: 'ID',
    sortable: true,
    filterable: true,
    required: true,
  },
  { title: 'Sync', key: 'SyncActive', sortable: true, class: 'text-center', required: false },
  { title: 'Catálogo', key: 'CatalogActive', sortable: true, required: false },
  { title: 'Estado', key: 'Status', sortable: true, required: false },
  { title: 'Populate', key: 'IsPopulate', sortable: true, required: false },
  { title: 'F. Populated', key: 'updated_at', sortable: true, required: false },
  { title: 'F. Updated', key: 'ExtUpdatedAt', sortable: true, required: false },
  { title: 'F. Created', key: 'ExtCreatedAt', sortable: true, required: false },
  { title: '', key: 'actions', sortable: false, required: true },
]

// Definir las columnas que se mostrarán por defecto
const defaultColumns = [
  'select', // Siempre incluir la columna de selección
  'ID',
  'SyncActive',
  'CatalogActive',
  'Status',
  'StatusML',
  'actions', // Siempre incluir la columna de acciones
]

// Estado para las columnas visibles (inicialmente las columnas por defecto)
const visibleColumns = ref<string[]>([])

// Cabeceras de tabla para IDs de productos (filtradas según las columnas visibles)
const productIdsHeaders = computed(() => {
  return allColumns.filter((col) => visibleColumns.value.includes(col.key) || col.required)
})

// Computed properties
const currentAccount = computed(() => accountStore.currentAccount)
const accountId = computed(() => currentAccount.value?.ID || 0)
const hasAccount = computed(() => !!currentAccount.value)

// Verificar si hay filtros activos visualmente (excluyendo el filtro de estado por defecto)
const hasActiveFilters = computed(() => {
  return (
    (statusFilter.value !== 'active' && statusFilter.value !== '') ||
    syncActiveFilter.value !== '' ||
    catalogActiveFilter.value !== '' ||
    searchQuery.value !== ''
  )
})

// Información centralizada de paginación
const paginationInfo = computed(() => {
  if (!productIds.value.length) return { text: '', start: 0, end: 0, total: 0 }

  const filtersApplied = hasActiveFilters.value || !!searchQuery.value.trim()

  if (filtersApplied) {
    const filteredTotal = filteredProductIds.value.length
    return {
      text: `${filteredTotal} de ${filteredTotal}`,
      start: filteredTotal > 0 ? 1 : 0,
      end: filteredTotal,
      total: filteredTotal,
      isFiltered: true,
    }
  }

  // Para paginación normal
  const start = (page.value - 1) * itemsPerPage.value + 1
  const end = Math.min(page.value * itemsPerPage.value, totalProductIds.value)
  return {
    text: `${start}-${end} de ${totalProductIds.value}`,
    start,
    end,
    total: totalProductIds.value,
    isFiltered: false,
  }
})

const filteredMessage = computed(() => {
  if (!productIds.value.length) return ''

  const total = filteredProductIds.value.length
  const isFilteredView = hasActiveFilters.value || searchQuery.value.trim().length > 0

  if (isFilteredView) {
    return `${total} publicaciones filtradas paginadas`
  }

  return `${total} publicaciones paginadas`
})

// Mantener detalles completos de las publicaciones seleccionadas
const selectedItemsDetails = ref<Record<string, ProductId>>({})
const selectedItemsOrder = ref<string[]>([])

// Actualizar detalles cuando cambia la selección
watch(
  selectedItems,
  (newSelected) => {
    const details: Record<string, ProductId> = { ...selectedItemsDetails.value }
    const currentById = new Map(productIds.value.map((product) => [product.ID, product]))
    const selectedIds = new Set<string>(newSelected)

    const preservedOrder = selectedItemsOrder.value.filter((id) => selectedIds.has(id))
    const newlySelected = newSelected.filter((id) => !preservedOrder.includes(id))
    selectedItemsOrder.value = [...newlySelected, ...preservedOrder]

    selectedItemsOrder.value.forEach((id) => {
      const fromCurrent = currentById.get(id)
      if (fromCurrent) {
        details[id] = { ...fromCurrent }
      } else if (details[id]) {
        // keep existing details if already stored
        details[id] = { ...details[id] }
      }
    })

    Object.keys(details).forEach((id) => {
      if (!selectedIds.has(id)) {
        delete details[id]
      }
    })

    selectedItemsDetails.value = details
  },
  { deep: false },
)

// Sincronizar detalles cuando se recargan publicaciones
watch(
  () => productIds.value,
  (newProducts) => {
    if (!Array.isArray(newProducts) || newProducts.length === 0) {
      return
    }

    const details: Record<string, ProductId> = { ...selectedItemsDetails.value }
    newProducts.forEach((product) => {
      if (details[product.ID]) {
        details[product.ID] = { ...product }
      }
    })
    selectedItemsDetails.value = details
  },
  { deep: true },
)

// Filtrar IDs de productos
const filteredProductIds = computed(() => {
  // Aplicar filtros normales a todos los productos
  let filtered = productIds.value.filter((item): item is ProductId => {
    if (!item || typeof item.ID !== 'string' || item.ID.length === 0) {
      console.warn('Producto inválido en productIds', item)
      return false
    }
    return true
  })

  // Filtrar por estado
  if (statusFilter.value) {
    const filterValue = statusFilter.value.toLowerCase()

    if (filterValue === 'active') {
      filtered = filtered.filter(
        (item) =>
          item.StatusML?.toLowerCase() === 'active' ||
          (item.StatusML === undefined && item.Status === true),
      )
    } else if (filterValue === 'inactive') {
      filtered = filtered.filter(
        (item) =>
          item.StatusML?.toLowerCase() !== 'active' &&
          !(item.StatusML === undefined && item.Status === true),
      )
    } else if (filterValue === 'under_review') {
      filtered = filtered.filter((item) => item.StatusML?.toLowerCase() === 'under_review')
    } else if (filterValue === 'paused') {
      filtered = filtered.filter((item) => item.StatusML?.toLowerCase() === 'paused')
    } else if (filterValue === 'closed') {
      filtered = filtered.filter((item) => item.StatusML?.toLowerCase() === 'closed')
    } else if (filterValue === 'deleted') {
      filtered = filtered.filter((item) => item.StatusML?.toLowerCase() === 'deleted')
    }
  }

  // Filtrar por Sync Activo
  if (syncActiveFilter.value) {
    const isActive = syncActiveFilter.value === 'true' ? true : false
    filtered = filtered.filter((item) => item.SyncActive === isActive)
  }

  // Filtrar por Catálogo Activo
  if (catalogActiveFilter.value) {
    const isActive = catalogActiveFilter.value === 'true' ? true : false
    filtered = filtered.filter((item) => item.CatalogActive === isActive)
  }

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((item) => {
      const id = typeof item.ID === 'string' ? item.ID : String(item.ID ?? '')
      return id.toLowerCase().includes(query)
    })
  }

  const selectedIds = new Set(selectedItems.value)

  const selectedWithDetails = selectedItemsOrder.value
    .filter((id) => selectedIds.has(id))
    .map((id) => {
      return selectedItemsDetails.value[id] || filtered.find((product) => product.ID === id)
    })
    .filter((item): item is ProductId => !!item)

  const nonSelectedFiltered = filtered.filter((item) => !selectedIds.has(item.ID))

  return [...selectedWithDetails, ...nonSelectedFiltered]
})

// Cargar IDs de productos
const loadProductIds = async () => {
  if (!hasAccount.value) {
    error.value = 'Selecciona una cuenta para ver los productos'
    // Mostrar notificación cuando no hay cuenta seleccionada
    showNotification.value = true
    notificationMessage.value = 'Selecciona una cuenta para ver los productos'
    notificationType.value = 'warning'
    return
  }

  loading.value = true
  error.value = null

  try {
    const offset = (page.value - 1) * itemsPerPage.value
    const response = await migrationService.getProductIds(
      accountId.value,
      undefined, // status
      offset,
      itemsPerPage.value,
    )

    if (response && response.products) {
      productIds.value = response.products
      totalProductIds.value = response.total
    } else {
      error.value = 'Error al cargar IDs de productos'
      // Mostrar notificación de error
      showNotification.value = true
      notificationMessage.value = 'Error al cargar IDs de productos'
      notificationType.value = 'error'
    }
  } catch (err) {
    console.error('Error al cargar IDs de productos:', err)

    // Extraer mensaje de error más detallado
    let errorMessage = 'Error al cargar IDs de productos'

    if (err instanceof Error) {
      errorMessage = `Error al cargar IDs de productos: ${err.message}`
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

    // Mostrar notificación de error
    showNotification.value = true
    notificationMessage.value = errorMessage
    notificationType.value = 'error'
  } finally {
    loading.value = false
  }
}

// Ver detalles del producto
const viewProductDetail = (productId: string) => {
  // Abrir en una nueva pestaña
  const route = router.resolve(`/product-detail/${productId}`)
  window.open(route.href, '_blank')
}

// Actualizar el estado de sincronización de un producto
const toggleSyncActive = async (productId: string, currentValue: boolean) => {
  if (!hasAccount.value) return

  try {
    processingSyncActiveId.value = productId
    const newValue = !currentValue

    const result = await migrationService.updateSyncActive(productId, newValue, accountId.value)

    if (result && result.success) {
      // Actualizar el estado localmente para evitar recargar toda la lista
      const index = productIds.value.findIndex((p) => p.ID === productId)
      if (index !== -1) {
        productIds.value[index].SyncActive = newValue
      }

      notificationMessage.value = result.message
      notificationType.value = 'success'
    } else {
      notificationMessage.value = 'Error al actualizar el estado de sincronización'
      notificationType.value = 'error'
      // Recargar la lista para asegurar que los datos están actualizados
      await loadProductIds()
    }
  } catch (err) {
    console.error(`Error al actualizar el estado de sincronización para ${productId}:`, err)
    notificationMessage.value = 'Error al actualizar el estado de sincronización'
    notificationType.value = 'error'
    // Recargar la lista para asegurar que los datos están actualizados
    await loadProductIds()
  } finally {
    showNotification.value = true
    processingSyncActiveId.value = null
  }
}

// Confirmar eliminación de un producto
const confirmDeleteProduct = (productId: string) => {
  confirmDialogTitle.value = 'Confirmar eliminación'
  confirmDialogMessage.value = `¿Estás seguro de que deseas eliminar la publicación ${productId}? Esta acción no se puede deshacer.`
  confirmDialogAction.value = () => deleteProduct(productId)
  showConfirmDialog.value = true
}

// Eliminar un producto
const deleteProduct = async (productId: string) => {
  if (!hasAccount.value) return

  try {
    processingDeleteId.value = productId
    const result = await migrationService.deleteProduct(accountId.value, productId)

    if (result && result.success) {
      notificationMessage.value = result.message
      notificationType.value = 'success'
      await loadProductIds()
    } else {
      notificationMessage.value = 'Error al eliminar la publicación'
      notificationType.value = 'error'
    }
  } catch (err) {
    console.error(`Error al eliminar el producto ${productId}:`, err)
    notificationMessage.value = 'Error al eliminar la publicación'
    notificationType.value = 'error'
  } finally {
    showNotification.value = true
    processingDeleteId.value = null
  }
}

// Confirmar populate de un producto
const confirmPopulateProduct = (productId: string) => {
  confirmDialogTitle.value = 'Confirmar populate'
  confirmDialogMessage.value = `¿Estás seguro de que deseas hacer populate de la publicación ${productId}?`
  confirmDialogAction.value = () => populateProduct(productId)
  showConfirmDialog.value = true
}

// Populate un producto
const populateProduct = async (productId: string) => {
  if (!hasAccount.value) return

  try {
    processingPopulateId.value = productId

    // Usar la función reutilizable del servicio publicationOperations
    const result = await publicationOperations.populateProduct(accountId.value, productId)

    // Manejar el resultado
    notificationMessage.value = result.message
    notificationType.value = result.success ? 'success' : 'error'

    // Si fue exitoso, recargar los IDs de productos
    if (result.success) {
      await loadProductIds()
    }
  } catch (err) {
    console.error(`Error al hacer populate del producto ${productId}:`, err)
    notificationMessage.value = 'Error al hacer populate de la publicación'
    notificationType.value = 'error'
  } finally {
    showNotification.value = true
    processingPopulateId.value = null
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
      loading.value = true

      // Llamar al servicio para eliminar los productos seleccionados
      const result = await migrationService.deleteMultipleProducts(
        accountId.value,
        selectedItems.value.map((item) => item.ID),
      )

      if (result && result.success) {
        notificationMessage.value = result.message
        notificationType.value = 'success'
        selectedItems.value = []
        await loadProductIds()
      } else {
        notificationMessage.value = 'Error al eliminar las publicaciones seleccionadas'
        notificationType.value = 'error'
      }
    } catch (err) {
      console.error('Error al eliminar productos seleccionados:', err)
      notificationMessage.value = 'Error al eliminar las publicaciones seleccionadas'
      notificationType.value = 'error'
    } finally {
      showNotification.value = true
      loading.value = false
    }
  }
  showConfirmDialog.value = true
}

// Confirmar populate de múltiples productos
const confirmPopulateSelectedItems = () => {
  if (selectedItems.value.length === 0) return

  // Mostrar diálogo de confirmación
  confirmDialogTitle.value = 'Populate publicaciones seleccionadas'
  confirmDialogMessage.value = `¿Estás seguro de que deseas hacer populate de las ${selectedItems.value.length} publicaciones seleccionadas?`
  confirmDialogAction.value = () => populateSelectedItems()
  showConfirmDialog.value = true
}

// Populate múltiples productos
const populateSelectedItems = async () => {
  if (!hasAccount.value || selectedItems.value.length === 0) return

  try {
    // Inicializar variables de progreso
    processingPopulateMultiple.value = true
    isProcessing.value = true
    showProgressDialog.value = true
    progressDialogTitle.value = 'Procesando publicaciones'
    progressDialogMessage.value = 'Realizando populate de las publicaciones seleccionadas...'
    progressValue.value = 0
    processedCount.value = 0
    successCount.value = 0
    failedCount.value = 0
    totalItemsToProcess.value = selectedItems.value.length
    errorResults.value = []

    // Convertir los IDs seleccionados a strings si es necesario
    const productIds = selectedItems.value.map((id) => id.toString())

    // Procesar cada producto individualmente para mostrar el progreso
    let successfulCount = 0
    let failedItemsCount = 0

    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i]

      try {
        // Llamar al API para cada producto
        const result = await migrationService.updateProductPopulate(accountId.value, productId)

        if (result.success) {
          successfulCount++
          successCount.value = successfulCount
        } else {
          failedItemsCount++
          failedCount.value = failedItemsCount
          // Guardar el error para mostrarlo en el overlay
          // Manejar la estructura específica de error del endpoint
          errorResults.value.push({
            id: productId,
            success: false,
            message: result.message || result.Message || 'Error desconocido',
            Code: result.Code,
            Status: result.Status,
            TecnicalDetails: result.TecnicalDetails,
          })
        }
      } catch (error) {
        failedItemsCount++
        failedCount.value = failedItemsCount
        // Guardar el error para mostrarlo en el overlay
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

        // Intentar extraer más información si es un error de API
        const apiError = error as any
        errorResults.value.push({
          id: productId,
          success: false,
          message: errorMessage,
          Code: apiError?.Code || apiError?.code,
          Status: apiError?.Status || apiError?.status,
          TecnicalDetails:
            apiError?.TecnicalDetails || apiError?.tecnicalDetails || apiError?.details,
        })
      }

      // Actualizar el progreso
      processedCount.value = i + 1
      progressValue.value = ((i + 1) / productIds.length) * 100
    }

    // Cerrar el diálogo de progreso
    showProgressDialog.value = false

    // Preparar y mostrar el overlay de resultados
    populateHasErrors.value = failedCount.value > 0
    resultsMessage.value = `Proceso completado: ${successCount.value} exitosos, ${failedCount.value} fallidos de ${productIds.length} totales`
    showResultsOverlay.value = true

    // Recargar los datos y deseleccionar publicaciones
    await loadProductIds()
    selectedItems.value = [] // Deseleccionar todas las publicaciones
  } catch (err) {
    console.error('Error al hacer populate de productos seleccionados:', err)
    progressDialogMessage.value = 'Error al procesar las publicaciones'
    showProgressDialog.value = false

    // Mostrar el error en el overlay
    populateHasErrors.value = true
    resultsMessage.value = 'Error al procesar las publicaciones'

    // Extraer detalles del error
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
    const apiError = err as any

    errorResults.value = [
      {
        id: 'general',
        success: false,
        message: errorMessage,
        Code: apiError?.Code || apiError?.code,
        Status: apiError?.Status || apiError?.status,
        TecnicalDetails:
          apiError?.TecnicalDetails || apiError?.tecnicalDetails || apiError?.details,
      },
    ]

    showResultsOverlay.value = true
  } finally {
    processingPopulateMultiple.value = false
    isProcessing.value = false
  }
}

// Confirmar populate de todas las publicaciones de la cuenta
const confirmPopulateAllProducts = (isEmpty: boolean = false) => {
  if (!hasAccount.value) return

  // Mostrar diálogo de confirmación
  confirmDialogTitle.value = isEmpty
    ? 'Populate publicaciones sin atributos'
    : 'Populate todas las publicaciones'
  confirmDialogMessage.value = isEmpty
    ? `¿Estás seguro de que deseas hacer populate de todas las publicaciones SIN ATRIBUTOS de la cuenta? Este proceso puede tardar varios minutos.`
    : `¿Estás seguro de que deseas hacer populate de TODAS las publicaciones de la cuenta? Este proceso puede tardar varios minutos.`
  confirmDialogAction.value = () => populateAllProducts(isEmpty)
  showConfirmDialog.value = true
}

// Populate todas las publicaciones de la cuenta
const populateAllProducts = async (isEmpty: boolean = false) => {
  if (!hasAccount.value) return

  try {
    processingPopulateAll.value = true

    // Crear una promesa de timeout para mostrar un mensaje rápido al usuario
    const timeoutPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Proceso de populate ${isEmpty ? 'para publicaciones sin atributos' : 'para todas las publicaciones'} iniciado. Este proceso puede tardar varios minutos.`,
        })
      }, 3000) // Esperamos máximo 3 segundos por una respuesta inicial
    })

    // Iniciar el proceso de populate sin esperar a que termine completamente
    const populatePromise = migrationService.updateAllProductsPopulate(accountId.value, isEmpty)

    // Esperamos solo la confirmación de inicio o el timeout, lo que ocurra primero
    const result = await Promise.race([populatePromise, timeoutPromise])

    // Mostrar mensaje de resultado inicial
    notificationMessage.value = result.message
    notificationType.value = 'success'
    showNotification.value = true

    // Recargar los datos después de un tiempo para ver los cambios iniciales
    setTimeout(() => {
      // Mostrar mensaje adicional explicando que el proceso continuará en segundo plano
      showNotification.value = true
      notificationMessage.value =
        'El proceso de populate continuará en segundo plano. Puedes seguir usando la aplicación.'
      notificationType.value = 'success'
    }, 3000)

    // Continuamos con la promesa original en segundo plano
    populatePromise
      .then((finalResult) => {
        // Cuando finalmente termine, mostramos el resultado completo
        if (finalResult.count && finalResult.count > 0) {
          setTimeout(() => {
            loadProductIds()
            showNotification.value = true
            notificationMessage.value = `Proceso de populate completado: ${finalResult.count} publicaciones procesadas.`

            // Si hay menos de 10 publicaciones, mostrar los IDs en el mensaje
            if (finalResult.data && finalResult.data.length > 0 && finalResult.data.length <= 10) {
              notificationMessage.value += `\nIDs: ${finalResult.data.join(', ')}`
            }

            notificationType.value = 'success'
          }, 10000) // Mostramos este mensaje después de 10 segundos
        }
      })
      .catch((error) => {
        console.error('Error en el proceso de populate en segundo plano:', error)
        setTimeout(() => {
          showNotification.value = true
          notificationMessage.value = 'Error durante el proceso de populate en segundo plano'
          notificationType.value = 'error'
        }, 5000)
      })
  } catch (err) {
    console.error('Error al iniciar el proceso de populate:', err)
    notificationMessage.value = 'Error al iniciar el proceso de populate para las publicaciones'
    notificationType.value = 'error'
    showNotification.value = true
  } finally {
    processingPopulateAll.value = false
  }
}

// Alias para mantener compatibilidad con el código existente
const openProductInNewTab = openInMercadoLibre

// Formatear fecha
const formatDate = (dateString: string) => {
  if (!dateString) return 'No disponible'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (_) {
    return 'N/A'
  }
}

// Funciones para manejar errores
const viewErrorDetails = (error: ErrorResult) => {
  selectedError.value = error
  showErrorDialog.value = true
}

const copyErrorToClipboard = (error: ErrorResult | null) => {
  if (!error) return

  const errorText = formatErrorDetails(error)
  navigator.clipboard
    .writeText(errorText)
    .then(() => {
      // Opcional: mostrar alguna notificación de éxito
      console.log('Error copiado al portapapeles')
    })
    .catch((err) => {
      console.error('Error al copiar al portapapeles:', err)
    })
}

const copyAllErrorsToClipboard = () => {
  const allErrors = errorResults.value
    .map((item, index) => {
      return `Error #${index + 1} - ID: ${item.id}\n${formatErrorDetails(item)}`
    })
    .join('\n\n' + '-'.repeat(50) + '\n\n')

  navigator.clipboard
    .writeText(allErrors)
    .then(() => {
      console.log('Todos los errores copiados al portapapeles')
    })
    .catch((err) => {
      console.error('Error al copiar al portapapeles:', err)
    })
}

const formatErrorDetails = (error: ErrorResult | null | unknown): string => {
  if (!error) return 'No hay detalles disponibles'

  if (typeof error === 'string') {
    return error
  }

  // Convertir a objeto para facilitar el acceso a las propiedades
  const errorObj = error as Record<string, any>

  // Manejar la estructura específica de error del endpoint /v1/migration/update/products/populate/{id}
  // ErrorCustom struct { Code string, Status int, Message string, TecnicalDetails string }
  if (errorObj.Code || errorObj.Status || errorObj.TecnicalDetails) {
    let details = ''

    if (errorObj.Message) {
      details += `Mensaje: ${errorObj.Message}\n`
    }

    if (errorObj.Code) {
      details += `Código: ${errorObj.Code}\n`
    }

    if (errorObj.Status) {
      details += `Estado: ${errorObj.Status}\n`
    }

    if (errorObj.TecnicalDetails) {
      details += `\nDetalles técnicos:\n${errorObj.TecnicalDetails}`
    }

    if (errorObj.id) {
      details += `\nID: ${errorObj.id}`
    }

    return details
  }

  // Manejo genérico para otros formatos de error
  if (errorObj.message) {
    let details = `Mensaje: ${errorObj.message}\n`

    if (errorObj.id) {
      details += `ID: ${errorObj.id}\n`
    }

    // Si hay más detalles en el objeto error, mostrarlos
    try {
      const otherDetails = { ...errorObj }
      delete otherDetails.message
      delete otherDetails.id

      if (Object.keys(otherDetails).length > 0) {
        details += `\nDetalles adicionales:\n${JSON.stringify(otherDetails, null, 2)}`
      }
    } catch (e) {
      // Si no se puede clonar el objeto, simplemente ignorar
    }

    return details
  }

  // Si nada más funciona, intentar convertir a JSON
  try {
    return JSON.stringify(error, null, 2)
  } catch (e) {
    return 'Error no serializable'
  }
}

// Funciones para gestionar columnas visibles
const toggleColumnVisibility = (key: string) => {
  // No permitir ocultar columnas requeridas
  const column = allColumns.find((col) => col.key === key)
  if (column?.required) return

  // Alternar visibilidad
  if (visibleColumns.value.includes(key)) {
    visibleColumns.value = visibleColumns.value.filter((k) => k !== key)
  } else {
    visibleColumns.value.push(key)
  }

  // Guardar preferencias en localStorage
  localStorage.setItem('publicationsTableColumns', JSON.stringify(visibleColumns.value))
}

// Establecer columnas por defecto
const selectDefaultColumns = () => {
  // Asegurarse de que las columnas requeridas siempre estén incluidas
  const requiredKeys = allColumns.filter((col) => col.required).map((col) => col.key)
  // Crear un array con valores únicos sin usar Set para evitar problemas de TypeScript
  const uniqueColumns = [...defaultColumns]
  requiredKeys.forEach((key) => {
    if (!uniqueColumns.includes(key)) {
      uniqueColumns.push(key)
    }
  })
  visibleColumns.value = uniqueColumns
  localStorage.setItem('publicationsTableColumns', JSON.stringify(visibleColumns.value))
  showColumnsMenu.value = false // Cerrar el menú después de aplicar los cambios
}

// Restablecer columnas visibles a mostrar todas
const resetColumns = () => {
  visibleColumns.value = allColumns.map((col) => col.key)
  localStorage.setItem('publicationsTableColumns', JSON.stringify(visibleColumns.value))
  showColumnsMenu.value = false // Cerrar el menú después de aplicar los cambios
}

// Cargar preferencias de columnas desde localStorage al iniciar
const loadColumnPreferences = () => {
  const savedColumns = localStorage.getItem('publicationsTableColumns')
  if (savedColumns) {
    try {
      const parsedColumns = JSON.parse(savedColumns)
      // Asegurarse de que las columnas requeridas siempre estén incluidas
      const requiredKeys = allColumns.filter((col) => col.required).map((col) => col.key)
      // Crear un array con valores únicos sin usar Set para evitar problemas de TypeScript
      const uniqueColumns = [...parsedColumns]
      requiredKeys.forEach((key) => {
        if (!uniqueColumns.includes(key)) {
          uniqueColumns.push(key)
        }
      })
      visibleColumns.value = uniqueColumns
    } catch (error) {
      console.error('Error al cargar preferencias de columnas:', error)
      // Si hay un error, usar las columnas por defecto
      selectDefaultColumns()
    }
  } else {
    // Si no hay preferencias guardadas, usar las columnas por defecto
    selectDefaultColumns()
  }
}

// La función formatPrice ha sido eliminada

// Determinar el color del chip según el estado
const getStatusColor = (statusML: string | undefined): string => {
  if (!statusML) return 'grey'

  statusML = statusML.toLowerCase()

  switch (statusML) {
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

// Manejar cambio de página
const handlePageChange = () => {
  // Si hay una búsqueda activa, usar executeSearch, de lo contrario usar loadProductIds
  if (searchQuery.value.trim()) {
    executeSearch()
  } else {
    loadProductIds()
  }
}

// Manejar cambio de items por página
const handleItemsPerPageChange = () => {
  page.value = 1 // Resetear a la primera página cuando cambia el número de items por página
  // Si hay una búsqueda activa, usar executeSearch, de lo contrario usar loadProductIds
  if (searchQuery.value.trim()) {
    executeSearch()
  } else {
    loadProductIds()
  }
}

// Manejar cambio de filtro de estado
const handleStatusFilterChange = () => {
  // Actualizar la bandera que indica si es el filtro por defecto
  isDefaultStatusFilter.value = statusFilter.value === 'active'
  page.value = 1
  loadProductIds()
}

// Manejar cambio de filtro de sync activo
const handleSyncActiveFilterChange = () => {
  page.value = 1
  loadProductIds()
}

// Manejar cambio de filtro de catálogo activo
const handleCatalogActiveFilterChange = () => {
  page.value = 1
  loadProductIds()
}

// Referencia a la tabla de datos
const dataTable = ref<{ sort?: (field: string) => void } | null>(null)

// Función para manejar el ordenamiento
const handleSort = (key: string) => {
  if (dataTable.value) {
    // Intentar usar el método sort de la tabla si está disponible
    if (typeof dataTable.value.sort === 'function') {
      dataTable.value.sort(key)
    }
  }
}

// Definir interfaz para la columna
interface TableColumn {
  sortable?: boolean
  key?: string | null
  options?: {
    sortBy?: string[]
    sortDesc?: boolean[]
  }
}

// Función para verificar si una columna está ordenada
const isSorted = (column: TableColumn) => {
  if (!column.sortable || !column.options || !column.options.sortBy) return false
  return column.options.sortBy.includes(column.key || '')
}

// Función para obtener el icono de ordenamiento
const getSortIcon = (column: TableColumn) => {
  // Si la columna no está ordenada, mostrar el icono neutral
  if (!column.sortable) return ''

  // Verificar si la tabla tiene información de ordenamiento
  if (!column.options || !column.options.sortBy) return 'mdi-arrow-up-down'

  // Determinar la dirección del ordenamiento
  if (!isSorted(column)) return 'mdi-arrow-up-down'

  // Mostrar el icono según la dirección del ordenamiento
  return column.options.sortDesc && column.options.sortDesc[0] ? 'mdi-arrow-down' : 'mdi-arrow-up'
}

// Funciones auxiliares para las etiquetas de los filtros
const getStatusLabel = (value: string): string => {
  const option = statusOptions.find((opt) => opt.value === value)
  return option ? option.title : value
}

const getSyncLabel = (value: string): string => {
  const option = booleanFilterOptions.find((opt) => opt.value === value)
  return option ? option.title : value
}

const getCatalogLabel = (value: string): string => {
  const option = booleanFilterOptions.find((opt) => opt.value === value)
  return option ? option.title : value
}

// Función para manejar el cambio en la búsqueda
const handleSearchInputChange = () => {
  page.value = 1
}

const executeSearch = async () => {
  const query = searchQuery.value.trim()

  if (!query) {
    await loadProductIds()
    return
  }

  loading.value = true
  error.value = null

  try {
    const offset = (page.value - 1) * itemsPerPage.value
    const response = await migrationService.searchPublications(
      accountId.value,
      query,
      offset,
      itemsPerPage.value,
    )
    const products = response.products ?? []

    console.log('Loaded ProductIds from searchPublications', {
      query,
      offset,
      limit: itemsPerPage.value,
      total: response.total,
      products,
    })

    if (products.length === 0 && page.value === 1) {
      productIds.value = []
      totalProductIds.value = 0
      showNotification.value = true
      notificationMessage.value = 'No se encontraron publicaciones que coincidan con la búsqueda'
      notificationType.value = 'warning'
      return
    }

    // Resetear filtros locales para evitar que descarten los resultados remotos
    statusFilter.value = ''
    isDefaultStatusFilter.value = false
    syncActiveFilter.value = ''
    catalogActiveFilter.value = ''

    productIds.value = products
    console.log('productIds.value', productIds.value)
    totalProductIds.value = response.total ?? products.length
  } catch (err) {
    console.error('Error al buscar publicaciones:', err)

    let errorMessage = 'Error al buscar publicaciones'

    if (err instanceof Error) {
      errorMessage = `Error al buscar publicaciones: ${err.message}`
    } else if (typeof err === 'object' && err !== null && 'response' in err) {
      const axiosError = err as {
        response?: {
          status?: number
          data?: {
            message?: string
            Message?: string
          }
        }
      }
      if (axiosError.response?.status === 502) {
        errorMessage = 'El servidor no está disponible (Error 502). Por favor, intenta más tarde.'
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message
      } else if (axiosError.response?.data?.Message) {
        errorMessage = axiosError.response.data.Message
      }
    }

    error.value = errorMessage
    showNotification.value = true
    notificationMessage.value = errorMessage
    notificationType.value = 'error'
  } finally {
    loading.value = false
  }
}

const clearSearchField = async () => {
  searchQuery.value = ''
  page.value = 1
  await loadProductIds()
}

const clearAllFilters = async () => {
  statusFilter.value = 'active'
  isDefaultStatusFilter.value = true
  syncActiveFilter.value = ''
  catalogActiveFilter.value = ''
  if (searchQuery.value) {
    searchQuery.value = ''
  }
  page.value = 1
  await loadProductIds()
}

// Observar cambios en la cuenta seleccionada
watch(
  () => accountId.value,
  (newAccountId) => {
    if (newAccountId) {
      loadProductIds()
    }
  },
)

// Cargar datos al montar el componente
onMounted(() => {
  // Cargar preferencias de columnas
  loadColumnPreferences()

  // Cargar datos si hay una cuenta seleccionada
  if (hasAccount.value) {
    loadProductIds()
  }
})
</script>

<style scoped>
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
  font-size: 1rem;
}

.modern-search :deep(.v-field__input) {
  min-height: 44px;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  line-height: 40px;
}

.modern-search :deep(.v-field__prepend-inner) {
  padding: 0 10px 0 12px;
  color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
}

.modern-search :deep(.v-field__append-inner) {
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  padding: 0;
  margin-right: -12px;
}

.search-action-btn {
  min-width: 48px;
  height: 100%;
  box-shadow: none;
  padding: 0 12px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-top-right-radius: 999px;
  border-bottom-right-radius: 999px;
}

.search-action-btn :deep(.v-btn__content) {
  justify-content: center;
}

.filter-pills-container {
  padding: 4px 0;
  gap: 0 !important; /* SEPARACION ENTRE FILTROS */
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

.filter-pill:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.filter-pill :deep(.v-chip__content) {
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

.items-per-page-select {
  width: 100px;
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

.pagination-centered {
  margin: 0 auto;
}

/* Estilos para la transición del campo de búsqueda */
.v-slide-x-transition-enter-active,
.v-slide-x-transition-leave-active {
  transition: all 0.3s ease;
  position: absolute;
  width: 100%;
}

.search-field {
  transition: all 0.3s ease;
  width: auto;
}

/* Estilo para el campo de búsqueda en el encabezado */
:deep(.search-field .v-field__input) {
  padding-top: 0;
  padding-bottom: 0;
  min-height: 32px;
}

:deep(.v-field__field) {
  height: 32px;
}

:deep(.modern-search .v-field__input::placeholder) {
  font-size: 14px;
  padding-left: 8px;
  line-height: 44px;
  display: flex;
  align-items: center;
}

:deep(.modern-search .v-field__prepend-inner .v-icon) {
  font-size: 20px;
  padding-left: 0;
}

:deep(.modern-search .v-field__append-inner .v-btn .v-icon) {
  font-size: 20px;
}

/* Animación de pulso para el chip cuando se está procesando */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.pulse-animation {
  animation: pulse 1.5s infinite ease-in-out;
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
  width: auto;
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

/* Estilo para el fondo del diálogo de errores */
.bg-overlay-minimal {
  background-color: rgba(255, 255, 255, 0.3) !important;
}
</style>
